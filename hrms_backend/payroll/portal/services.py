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

import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from payroll.calculations import calculate_payslip_fields, is_in_probation
from payroll.models import (
    Employee,
    EmployeeSalaryStructure,
    OnHoldAdjustment,
    PayrollBatch,
    PayslipRecord,
    SalaryAdvance,
    SalaryAdvanceAdjustment,
    get_latest_salary_structure,
)

from .models import (
    PortalAdjustment,
    PortalHold,
    PortalSubmission,
    PortalSubmissionEvent,
    PortalSubmissionItem,
)
from .validators import parse_date, to_decimal, to_positive_int

# Structure fields the portal may set explicitly on top of build_from_ctc.
_STRUCTURE_OVERRIDES = ("nps_allowance", "fbp", "vpf")


def record_event(submission, event_type, item_count=0, actor_portal=None, actor_staff=None, note=""):
    """Appends one row to the submission's round history."""
    return PortalSubmissionEvent.objects.create(
        submission=submission,
        event_type=event_type,
        item_count=item_count,
        actor_portal=actor_portal,
        actor_staff=actor_staff,
        note=(note or "")[:1000],
    )


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

    applied_items = []
    with transaction.atomic():
        for item in items:
            if apply_item(item, approved_by):
                summary["applied"] += 1
                applied_items.append(item)
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

        # Record the round so the client's History still shows "Approved and
        # applied" after the month reopens as DRAFT (the submission row's own
        # status can't hold that).
        record_event(
            submission,
            PortalSubmissionEvent.TYPE_APPROVED,
            item_count=summary["applied"],
            actor_staff=approved_by,
        )

        # If this month's payroll batch was already generated (an earlier
        # round), fold the just-applied changes straight into its payslip
        # records — otherwise a second round's money would be marked
        # APPLIED in the portal yet never show up on the payslips.
        if applied_items:
            refresh_batch_after_apply(submission, approved_by, applied_items)

    return summary


# ─────────────────────────────────────────────────────────────────────────────
# Batch sync — fold later-round portal changes into an already-generated batch
# ─────────────────────────────────────────────────────────────────────────────


def _synthetic_row(days_in_month: int) -> dict:
    """The full-attendance, zero-extra row a portal-generated record starts
    from — mirrors the row PayrollUploadView.generate_from_portal builds."""
    return {
        "actual_working_days": days_in_month,
        "extra_working_days": Decimal("0"),
        "paid_leave_days": Decimal("0"),
        "lop_days": Decimal("0"),
        "lta": Decimal("0"),
        "special_allowance": Decimal("0"),
        "nps_allowance_earned": Decimal("0"),
        "commission_other": Decimal("0"),
        "arrears": Decimal("0"),
        "reimbursements": Decimal("0"),
        "tds": Decimal("0"),
        "vpf_arrears": Decimal("0"),
        "nps_deduction_arrears": Decimal("0"),
        "loan_deduction": Decimal("0"),
        "lwf": Decimal("0"),
        "other_deduction": Decimal("0"),
    }


def _attendance_row_for(record) -> dict:
    """Rebuild the raw `row` dict used to (re)compute a record — same shape
    the Batch Review attendance-edit path passes to calculate_payslip_fields,
    so a revision recompute can't double-count the structure baseline."""
    return {
        "actual_working_days": record.actual_working_days,
        "lop_days": record.lop_days,
        "extra_working_days": record.extra_working_days,
        "paid_leave_days": record.paid_leave_days,
        "lta": record.lta_upload,
        "special_allowance": record.special_allowance_upload,
        "nps_allowance_earned": record.nps_allowance_upload,
        "commission_other": record.commission_other,
        "arrears": record.arrears,
    }


def _build_record_for_joiner(batch, employee, submission, days_in_month) -> PayslipRecord:
    """Creates the missing payslip record for an employee who joined after the
    batch was generated (a NEW_EMPLOYEE item in a later round)."""
    latest_structure = get_latest_salary_structure(employee)
    row = _synthetic_row(days_in_month)
    computed = calculate_payslip_fields(
        latest_structure,
        row,
        submission.month,
        days_in_month,
        comp_off_opening_balance=Decimal("0"),
        leave_opening_balance=Decimal("0"),
        is_probation=is_in_probation(employee.hire_date, submission.year, submission.month),
    )
    # calculate_payslip_fields() already returns the prorated+upload combined
    # values for these three, so they must come out of `row` before the
    # spread (same pop as _build_record_for_employee); the raw uploads are
    # stored on the *_upload fields instead (all zero for a new joiner).
    lta_upload = row.pop("lta", Decimal("0"))
    special_allowance_upload = row.pop("special_allowance", Decimal("0"))
    nps_allowance_upload = row.pop("nps_allowance_earned", Decimal("0"))
    return PayslipRecord.objects.create(
        batch=batch,
        employee=employee,
        salary_structure_snapshot=latest_structure,
        days_in_month=days_in_month,
        salary_advance_opening_balance=Decimal("0"),
        on_hold_opening_balance=Decimal("0"),
        lta_upload=lta_upload,
        special_allowance_upload=special_allowance_upload,
        nps_allowance_upload=nps_allowance_upload,
        **row,
        **computed,
    )


def _fold_into_record(record, employee, submission, approved_by, recompute_structure):
    """Folds this employee's just-created pending adjustments into an existing
    payslip record and (optionally) re-derives structure fields after a
    revision. Marks the adjustments as applied so they are never folded twice.
    """
    month, year = submission.month, submission.year

    pending_portal = list(
        PortalAdjustment.objects.filter(
            employee=employee, month=month, year=year, applied_in_record__isnull=True
        )
    )
    portal_earnings = sum(
        (a.amount for a in pending_portal if a.direction == PortalAdjustment.DIRECTION_EARNING),
        Decimal("0"),
    )
    portal_deductions = sum(
        (a.amount for a in pending_portal if a.direction == PortalAdjustment.DIRECTION_DEDUCTION),
        Decimal("0"),
    )
    if portal_earnings or portal_deductions:
        record.commission_other = Decimal(record.commission_other or 0) + portal_earnings
        record.other_deduction = Decimal(record.other_deduction or 0) + portal_deductions

    pending_hold = list(
        OnHoldAdjustment.objects.filter(employee=employee, applied_in_record__isnull=True)
    )
    if pending_hold:
        record.on_hold_deducted = Decimal(record.on_hold_deducted or 0) + sum(
            (a.amount for a in pending_hold if a.amount >= 0), Decimal("0")
        )
        record.on_hold_released = Decimal(record.on_hold_released or 0) + sum(
            (-a.amount for a in pending_hold if a.amount < 0), Decimal("0")
        )

    pending_advance = list(
        SalaryAdvanceAdjustment.objects.filter(employee=employee, applied_in_record__isnull=True)
    )
    if pending_advance:
        record.salary_advance_disbursed = Decimal(record.salary_advance_disbursed or 0) + sum(
            (a.amount for a in pending_advance if a.amount >= 0), Decimal("0")
        )
        record.salary_advance_recovered = Decimal(record.salary_advance_recovered or 0) + sum(
            (-a.amount for a in pending_advance if a.amount < 0), Decimal("0")
        )

    if recompute_structure:
        latest_structure = get_latest_salary_structure(employee)
        row = _attendance_row_for(record)
        computed = calculate_payslip_fields(
            latest_structure,
            row,
            month,
            record.days_in_month,
            comp_off_opening_balance=record.comp_off_opening_balance,
            leave_opening_balance=record.leave_opening_balance,
            is_probation=is_in_probation(employee.hire_date, year, month),
        )
        record.salary_structure_snapshot = latest_structure
        for field_name, value in computed.items():
            # gross_salary / the two opening balances are carried through
            # unchanged by design (see calculate_payslip_fields) — leave them.
            if field_name in ("gross_salary", "comp_off_opening_balance", "leave_opening_balance"):
                continue
            setattr(record, field_name, value)

    record.save()

    if pending_portal:
        PortalAdjustment.objects.filter(id__in=[a.id for a in pending_portal]).update(
            applied_in_record=record
        )
    if pending_hold:
        OnHoldAdjustment.objects.filter(id__in=[a.id for a in pending_hold]).update(
            applied_in_record=record
        )
    if pending_advance:
        SalaryAdvanceAdjustment.objects.filter(id__in=[a.id for a in pending_advance]).update(
            applied_in_record=record
        )
        recovered_advance_ids = [
            a.advance_id for a in pending_advance if a.advance_id is not None and a.amount < 0
        ]
        if recovered_advance_ids:
            SalaryAdvance.objects.filter(id__in=recovered_advance_ids).update(
                months_recovered=F("months_recovered") + 1
            )


def refresh_batch_after_apply(submission, approved_by, applied_items):
    """After a (re-)approval applies items for a month, push those changes into
    the month's payroll batch if it already exists.

    No-op when the batch hasn't been generated yet — generate-from-portal
    builds every active employee's record (and folds pending adjustments) then.
    When it DOES exist, this is what keeps a second (or third…) round's
    money visible on the payslips instead of sitting unapplied forever.
    """
    batch = PayrollBatch.objects.filter(
        client=submission.client, month=submission.month, year=submission.year
    ).first()
    if batch is None:
        return

    employee_ids = set()
    new_employee_codes = []
    revision_employee_ids = set()
    for item in applied_items:
        payload = item.payload or {}
        if item.item_type == PortalSubmissionItem.TYPE_NEW_EMPLOYEE:
            code = str(payload.get("employee_code") or "").strip()
            if code:
                new_employee_codes.append(code)
            continue
        if item.item_type == PortalSubmissionItem.TYPE_NOTE:
            continue
        employee_id = payload.get("employee_id")
        if not employee_id:
            continue
        employee_ids.add(int(employee_id))
        if item.item_type == PortalSubmissionItem.TYPE_REVISION:
            revision_employee_ids.add(int(employee_id))

    employees = list(
        Employee.objects.filter(client=submission.client, id__in=employee_ids)
    )
    for code in new_employee_codes:
        joiner = Employee.objects.filter(
            client=submission.client, employee_code=code
        ).first()
        if joiner is not None:
            employees.append(joiner)

    if not employees:
        return

    days_in_month = calendar.monthrange(submission.year, submission.month)[1]
    created = 0
    for employee in employees:
        record = PayslipRecord.objects.filter(batch=batch, employee=employee).first()
        if record is None:
            record = _build_record_for_joiner(batch, employee, submission, days_in_month)
            created += 1
        _fold_into_record(
            record,
            employee,
            submission,
            approved_by,
            recompute_structure=employee.id in revision_employee_ids,
        )

    if created:
        batch.total_records = batch.records.count()
        batch.save(update_fields=["total_records", "updated_at"])
