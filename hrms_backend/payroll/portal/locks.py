"""payroll/portal/locks.py — "this month is already paid out" guard.

Once payslips have been generated for a client-month at Batch Review, any
further portal change is a lie: the PDF the employee received will not match
what the UI shows. Approving/applying such a change silently mutates payroll
data behind an already-issued payslip.

So a month becomes **locked** as soon as its PayrollBatch has produced
payslips (or started/finished emailing them). Locked months are read-only on
the client portal — the client can still look at the month and its history,
but cannot add, edit or delete changes, cannot rewrite the note, and cannot
submit. Staff are not blocked (they may legitimately need to correct and
regenerate the batch), they just get a loud warning.

Nothing here writes; it is a pure read-side helper used by the portal
serializers and views.
"""

from django.db.models import Count

from payroll.models import PayrollBatch, PayslipRecord

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# Batch states that mean payslips have left (or are leaving) the building,
# even if a pdf_path row hasn't been counted yet.
SENDING_STATUSES = (PayrollBatch.STATUS_SENDING, PayrollBatch.STATUS_COMPLETED)

UNLOCKED = {
    "locked": False,
    "reason": None,
    "batch_id": None,
    "batch_status": None,
    "payslips_generated": 0,
    "payslips_emailed": 0,
}


def _month_label(month, year):
    try:
        return f"{MONTH_NAMES[int(month) - 1]} {int(year)}"
    except (TypeError, ValueError, IndexError):
        return f"{month}/{year}"


def _build(batch, generated, emailed):
    locked = bool(generated) or emailed > 0 or batch.status in SENDING_STATUSES
    if not locked:
        return {
            **UNLOCKED,
            "batch_id": batch.id,
            "batch_status": batch.status,
        }

    label = _month_label(batch.month, batch.year)
    if emailed:
        reason = (
            f"Payslips for {label} have already been generated and emailed "
            f"({emailed} sent). This month is closed for new changes."
        )
    elif generated:
        reason = (
            f"Payslips for {label} have already been generated "
            f"({generated} payslip{'' if generated == 1 else 's'}). "
            "This month is closed for new changes."
        )
    else:
        reason = f"Payslips for {label} are being sent out. This month is closed for new changes."

    return {
        "locked": True,
        "reason": reason,
        "batch_id": batch.id,
        "batch_status": batch.status,
        "payslips_generated": generated,
        "payslips_emailed": emailed,
    }


def locks_for(submissions):
    """Bulk version: {(client_id, month, year): lock_dict} in two queries.

    Used by the serializers so a list of months doesn't fire a query per row.
    """
    keys = {(s.client_id, int(s.month), int(s.year)) for s in submissions}
    if not keys:
        return {}

    batches = list(
        PayrollBatch.objects.filter(
            client_id__in={k[0] for k in keys},
            month__in={k[1] for k in keys},
            year__in={k[2] for k in keys},
        ).only("id", "client_id", "month", "year", "status", "email_sent")
    )
    batches = [b for b in batches if (b.client_id, b.month, b.year) in keys]

    generated_by_batch = {}
    if batches:
        rows = (
            PayslipRecord.objects.filter(batch_id__in=[b.id for b in batches])
            .exclude(pdf_path__isnull=True)
            .exclude(pdf_path="")
            .values("batch_id")
            .annotate(n=Count("id"))
        )
        generated_by_batch = {r["batch_id"]: r["n"] for r in rows}

    result = {key: dict(UNLOCKED) for key in keys}
    for batch in batches:
        result[(batch.client_id, batch.month, batch.year)] = _build(
            batch,
            generated_by_batch.get(batch.id, 0),
            batch.email_sent or 0,
        )
    return result


def month_lock(client_id, month, year):
    """Single lookup — {"locked": bool, "reason": str|None, ...}."""
    batch = (
        PayrollBatch.objects.filter(client_id=client_id, month=month, year=year)
        .only("id", "client_id", "month", "year", "status", "email_sent")
        .first()
    )
    if batch is None:
        return dict(UNLOCKED)

    generated = (
        PayslipRecord.objects.filter(batch=batch)
        .exclude(pdf_path__isnull=True)
        .exclude(pdf_path="")
        .count()
    )
    return _build(batch, generated, batch.email_sent or 0)


def submission_lock(submission):
    return month_lock(submission.client_id, submission.month, submission.year)
