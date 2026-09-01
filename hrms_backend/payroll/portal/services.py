"""
payroll/portal/services.py

apply-on-approve pipeline. Approving a submitted month turns each pending
PortalSubmissionItem into real payroll rows:

    NEW_EMPLOYEE        → Employee + EmployeeSalaryStructure (build_from_ctc)
    REVISION            → a new EmployeeSalaryStructure version (effective_from)
    EXIT                → Employee.status = inactive
    SALARY_HOLD         → OnHoldAdjustment (+amount, folds into this month's
                          pay) + PortalHold (scheduled auto-release)
    ADVANCE             → SalaryAdvance plan + its lump-sum disbursement
    ONE_TIME_EARNING    → PortalAdjustment (earning)
    ONE_TIME_DEDUCTION  → PortalAdjustment (deduction)
    NOTE                → no-op (informational for the approver)

Each item is applied inside its own savepoint, so a failing item rolls back
its own partial writes and is marked FAILED while the rest proceed. The
submission flips to APPROVED only when nothing failed; otherwise it stays
SUBMITTED so the admin can fix and re-approve (re-approval retries PENDING
and FAILED items and skips APPLIED ones).
"""

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

from payroll.models import (
    Employee,
    EmployeeSalaryStructure,
    OnHoldAdjustment,
    SalaryAdvance,
    SalaryAdvanceAdjustment,
)

from .models import PortalAdjustment, PortalHold, PortalSubmission, PortalSubmissionItem
from .validators import parse_date, to_decimal, to_positive_int

# Structure fields the portal may set explicitly on top of build_from_ctc.
_STRUCTURE_OVERRIDES = ("nps_allowance", "fbp", "vpf")


def _first_of_month(submission) -> date:
    return date(submission.year, submission.month, 1)


def _get_employee(submission, employee_id):
    employee = Employee.objects.filter(id=employee_id, client=submission.client).first()
    if employee is None:
        raise ValueError(f"Employee id {employee_id} was not found for this client.")
    return employee


def _make_structure(employee, submission, payload, approved_by, reason):
    """Builds an EmployeeSalaryStructure from a payload's CTC, then applies
    any explicit nps/fbp/vpf overrides. Returns the saved structure."""
    ctc_annual = to_decimal(payload["ctc_annual"], "ctc_annual")
    if ctc_annual <= 0:
        raise ValueError("ctc_annual must be greater than 0.")
    structure = EmployeeSalaryStructure(
        employee=employee,
        effective_from=parse_date(payload["effective_from"]),
        created_by=approved_by,
        change_reason=reason,
        **EmployeeSalaryStructure.build_from_ctc(
            ctc_annual, pf_opted=payload.get("pf_opted", True)
        ),
    )
    for field in _STRUCTURE_OVERRIDES:
        if payload.get(field) is not None:
            setattr(structure, field, to_decimal(payload[field], field))
    structure.save()
    return structure


def _apply_new_employee(item, submission, approved_by):
    payload = item.payload
    code = str(payload["employee_code"]).strip()
    if not code:
        raise ValueError("employee_code is required.")
    if Employee.objects.filter(client=submission.client, employee_code=code).exists():
        raise ValueError(f"Employee code {code!r} already exists for this client.")

    hire_date = parse_date(payload["hire_date"]) if payload.get("hire_date") else None
    employee = Employee.objects.create(
        client=submission.client,
        employee_code=code,
        first_name=str(payload["first_name"]).strip(),
        last_name=str(payload.get("last_name") or "").strip(),
        email=str(payload.get("email") or "").strip(),
        pan_number=str(payload.get("pan_number") or "").strip(),
        department=str(payload.get("department") or "").strip(),
        position=str(payload.get("position") or "").strip(),
        hire_date=hire_date,
        ctc=to_decimal(payload["ctc_annual"], "ctc_annual"),
    )

    effective_from = (
        parse_date(payload["effective_from"])
        if payload.get("effective_from")
        else (hire_date or _first_of_month(submission))
    )
    _make_structure(
        employee,
        submission,
        {**payload, "effective_from": effective_from.isoformat()},
        approved_by,
        f"Portal new joiner — {submission.month:02d}/{submission.year}",
    )
    return employee


def _apply_revision(item, submission, approved_by):
    payload = item.payload
    employee = _get_employee(submission, payload["employee_id"])
    structure = _make_structure(
        employee,
        submission,
        payload,
        approved_by,
        str(payload.get("change_reason") or f"Portal revision — {submission.month:02d}/{submission.year}"),
    )
    employee.ctc = structure.ctc_annual
    employee.save(update_fields=["ctc", "updated_at"])
    return structure


def _apply_exit(item, submission, approved_by):
    payload = item.payload
    employee = _get_employee(submission, payload["employee_id"])
    employee.status = Employee.STATUS_INACTIVE
    employee.save(update_fields=["status", "updated_at"])
    return employee


def _apply_hold(item, submission, approved_by):
    """Salary hold: put `amount` on hold this month, auto-release later.

    Creates a positive OnHoldAdjustment (which the batch builder folds into
    this month's payslip as on_hold_deducted, reducing net pay and growing
    the on-hold balance) plus a PortalHold row that remembers when to
    release it. materialize_due_hold_releases() turns that row into the
    negative release adjustment when the release month's batch is generated.
    """
    payload = item.payload
    employee = _get_employee(submission, payload["employee_id"])
    amount = to_decimal(payload["amount"], "amount")
    if amount <= 0:
        raise ValueError("amount must be greater than 0.")

    try:
        release_month = int(payload["release_month"])
        release_year = int(payload["release_year"])
    except (TypeError, ValueError):
        raise ValueError("release_month and release_year must be whole numbers.")
    if not (1 <= release_month <= 12):
        raise ValueError("release_month must be between 1 and 12.")
    if release_year < 2000 or release_year > 2200:
        raise ValueError("release_year is out of range.")
    if (release_year, release_month) <= (submission.year, submission.month):
        raise ValueError("release month must be later than the payroll month.")

    reason = str(payload.get("reason") or "Salary hold").strip() or "Salary hold"

    hold_adjustment = OnHoldAdjustment.objects.create(
        employee=employee,
        amount=amount,
        reason=f"Portal salary hold ({submission.month:02d}/{submission.year}): {reason}",
        created_by=approved_by,
    )
    return PortalHold.objects.create(
        item=item,
        employee=employee,
        amount=amount,
        reason=reason,
        release_month=release_month,
        release_year=release_year,
        hold_adjustment=hold_adjustment,
    )


def _apply_advance(item, submission, approved_by):
    payload = item.payload
    employee = _get_employee(submission, payload["employee_id"])
    total = to_decimal(payload["total_amount"], "total_amount")
    if total <= 0:
        raise ValueError("total_amount must be greater than 0.")
    tenure = to_positive_int(payload["tenure_months"], "tenure_months")
    reason = (
        str(payload.get("reason") or payload.get("label") or "Advance / loan").strip()
        or "Advance / loan"
    )
    emi = (total / tenure).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Mirror SalaryAdvanceSerializer.create: the disbursement adjustment is
    # created first (advance=None), then the plan points back at it.
    disbursement = SalaryAdvanceAdjustment.objects.create(
        employee=employee,
        amount=total,
        reason=f"Salary advance disbursement ({tenure}-month EMI plan): {reason}",
        created_by=approved_by,
    )
    advance = SalaryAdvance.objects.create(
        employee=employee,
        total_amount=total,
        tenure_months=tenure,
        emi_amount=emi,
        reason=reason,
        disbursement_adjustment=disbursement,
        created_by=approved_by,
    )
    disbursement.advance = advance
    disbursement.save(update_fields=["advance"])
    return advance


def _apply_one_time(item, submission, approved_by):
    payload = item.payload
    employee = _get_employee(submission, payload["employee_id"])
    amount = to_decimal(payload["amount"], "amount")
    if amount <= 0:
        raise ValueError("amount must be greater than 0.")
    direction = (
        PortalAdjustment.DIRECTION_EARNING
        if item.item_type == PortalSubmissionItem.TYPE_ONE_TIME_EARNING
        else PortalAdjustment.DIRECTION_DEDUCTION
    )
    return PortalAdjustment.objects.create(
        employee=employee,
        item=item,
        direction=direction,
        amount=amount,
        description=str(payload.get("description") or "").strip(),
        month=submission.month,
        year=submission.year,
    )


def _apply_note(item, submission, approved_by):
    return None


_HANDLERS = {
    PortalSubmissionItem.TYPE_NEW_EMPLOYEE: _apply_new_employee,
    PortalSubmissionItem.TYPE_REVISION: _apply_revision,
    PortalSubmissionItem.TYPE_EXIT: _apply_exit,
    PortalSubmissionItem.TYPE_SALARY_HOLD: _apply_hold,
    PortalSubmissionItem.TYPE_ADVANCE: _apply_advance,
    PortalSubmissionItem.TYPE_ONE_TIME_EARNING: _apply_one_time,
    PortalSubmissionItem.TYPE_ONE_TIME_DEDUCTION: _apply_one_time,
    PortalSubmissionItem.TYPE_NOTE: _apply_note,
}


def materialize_due_hold_releases(client, month: int, year: int, released_by) -> int:
    """
    Creates the release (negative) OnHoldAdjustment for every portal hold
    whose release month/year matches the batch about to be generated for
    `client`, so the held amount is paid back in that month. Idempotent —
    holds already released (release_adjustment set) are skipped. Returns the
    number of releases materialized.

    Called by PayrollUploadView.upload and generate_from_portal BEFORE they
    build PayslipRecords, so the new adjustments are picked up by
    _build_record_for_employee just like any other pending on-hold row.
    """
    due = PortalHold.objects.filter(
        employee__client=client,
        release_month=month,
        release_year=year,
        release_adjustment__isnull=True,
    ).select_related("employee")
    created = 0
    for hold in due:
        release = OnHoldAdjustment.objects.create(
            employee=hold.employee,
            amount=-hold.amount,
            reason=f"Portal salary hold release ({month:02d}/{year}): {hold.reason or 'Salary hold'}",
            created_by=released_by,
        )
        hold.release_adjustment = release
        hold.save(update_fields=["release_adjustment"])
        created += 1
    return created


def apply_item(item, approved_by):
    """Applies a single item, marking it APPLIED / FAILED / SKIPPED.

    Returns True when the item applied, False when it failed or was skipped.
    Used by the staff "add input" flow (staff items apply immediately — the
    staff member IS the approver) and by apply_submission below.
    """
    handler = _HANDLERS.get(item.item_type)
    if handler is None:
        item.status = PortalSubmissionItem.STATUS_SKIPPED
        item.error = f"Unsupported item type: {item.item_type}"
        item.save(update_fields=["status", "error", "updated_at"])
        return False
    try:
        # Savepoint: a failing item rolls back its own partial writes.
        with transaction.atomic():
            handler(item, item.submission, approved_by)
    except Exception as exc:  # noqa: BLE001 — record per-item failure, keep going
        item.status = PortalSubmissionItem.STATUS_FAILED
        item.error = str(exc)
        item.save(update_fields=["status", "error", "updated_at"])
        return False
    else:
        item.status = PortalSubmissionItem.STATUS_APPLIED
        item.error = ""
        item.save(update_fields=["status", "error", "updated_at"])
        return True


def apply_submission(submission, approved_by):
    """
    Applies every non-applied item of a submitted month.

    Returns {"applied": n, "failed": n, "skipped": n}. Idempotent per item:
    APPLIED items are left alone; PENDING and FAILED items are (re)attempted.

    A month works in ROUNDS: after every approval the submission reopens as
    DRAFT so the client can record further changes in the same month
    (mid-month joiners, revisions, exits…) and submit again. Re-approval
    only ever touches items that aren't applied yet, so repeat rounds are
    safe. Items that failed this round stay FAILED (with the reason) and are
    retried next round after the client fixes them — the submission reopens
    regardless, so the client can correct and resubmit without you having to
    reject first. approved_by/approved_at always record the last approval.
    """
    if submission.status not in (
        PortalSubmission.STATUS_SUBMITTED,
        PortalSubmission.STATUS_APPROVED,
    ):
        raise ValueError("Only submitted submissions can be applied.")

    summary = {"applied": 0, "failed": 0, "skipped": 0}
    items = submission.items.exclude(status=PortalSubmissionItem.STATUS_APPLIED).order_by(
        "sort", "id"
    )

    with transaction.atomic():
        for item in items:
            if apply_item(item, approved_by):
                summary["applied"] += 1
            elif item.status == PortalSubmissionItem.STATUS_SKIPPED:
                summary["skipped"] += 1
            else:
                summary["failed"] += 1

        submission.approved_by = approved_by
        submission.approved_at = timezone.now()
        submission.rejection_reason = ""
        # Reopen the month for the next round — a client may submit several
        # times within the same month. Item-level APPLIED/FAILED statuses
        # preserve the history of what already happened.
        submission.status = PortalSubmission.STATUS_DRAFT
        submission.save(
            update_fields=[
                "status", "approved_by", "approved_at", "rejection_reason", "updated_at",
            ]
        )

    return summary
