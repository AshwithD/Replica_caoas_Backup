"""apps/payroll/tasks/tasks.py"""

from celery import shared_task
from django.utils import timezone

from django.contrib.auth import get_user_model
User = get_user_model()

from ..email_service import get_payroll_email_connection, send_payslip_email
from ..models import PayrollBatch, PayslipRecord


@shared_task
def send_bulk_payslip_emails(batch_id, sent_by_id):
    """
    Sends every unsent payslip in a batch, in the background. This is the
    same logic that used to run synchronously inside the "send-emails"
    view — moved here wholesale so a 50-employee batch doesn't block the
    HTTP request (and risk hitting a proxy/browser timeout) for several
    minutes. The view now just does `.delay(batch.id, request.user.id)`
    and returns immediately.
    """
    batch = PayrollBatch.objects.select_related("client").get(id=batch_id)
    sent_by = User.objects.get(id=sent_by_id)

    batch.status = PayrollBatch.STATUS_SENDING
    batch.sent_by = sent_by
    batch.sent_at = timezone.now()
    batch.save(update_fields=["status", "sent_by", "sent_at", "updated_at"])

    results = []
    total_sent = 0
    total_failed = 0
    records = batch.records.exclude(status=PayslipRecord.STATUS_EMAIL_SENT).select_related(
        "employee", "batch__client"
    )

    # Same reasoning as before: one shared SMTP connection for the whole
    # batch, since the TLS handshake per email — not the message itself —
    # was the dominant per-email cost.
    #
    # The per-record send is wrapped in its own try/except now — an
    # unexpected exception on ONE record (a bug in send_payslip_email, a
    # bad attribute, whatever) must never kill the whole task, because
    # this task is the only thing that ever moves the batch out of
    # SENDING. If the loop dies partway through, the batch is left
    # SENDING forever and the UI has no way to know the task is gone —
    # it just shows a permanently "in progress" batch with no error and
    # no retry option. So: log it, mark that one record failed, keep
    # going, and the outer finally/status-update below always runs.
    #
    # Getting the connection itself is inside this try too — if even
    # opening the SMTP connection fails (bad credentials, host down),
    # the finally below still fires and the batch still gets moved out
    # of SENDING (to FAILED, since nothing was sent) instead of hanging.
    try:
        connection = get_payroll_email_connection()
        connection.open()
        for record in records:
            try:
                success, message = send_payslip_email(record, sent_by, connection=connection)
            except Exception as exc:
                success = False
                message = str(exc)
                record.status = PayslipRecord.STATUS_EMAIL_FAILED
                record.save(update_fields=["status", "updated_at"])
                import logging
                logging.getLogger(__name__).exception(
                    "Unexpected error sending payslip for record %s (employee %s) in batch %s — "
                    "marking this record failed and continuing with the rest of the batch.",
                    record.id, record.employee.employee_code, batch_id,
                )
            if success:
                total_sent += 1
            else:
                total_failed += 1
            results.append(
                {
                    "record": record.id,
                    "employee_code": record.employee.employee_code,
                    "success": success,
                    "message": message,
                }
            )
    finally:
        # connection may never have been assigned if get_payroll_email_connection()
        # itself raised — guard the close() so that doesn't mask the real
        # error or skip the batch-status finalization below.
        try:
            connection.close()
        except NameError:
            pass
        # Always finalize the batch's counts/status, even if the loop
        # above was interrupted by something outside the per-record
        # try/except (e.g. connection.open() itself failing). Without
        # this in the same finally, a batch could still end up stuck in
        # SENDING with no path back to REVIEWED/retry.
        batch.email_sent = batch.records.filter(status=PayslipRecord.STATUS_EMAIL_SENT).count()
        batch.email_failed = batch.records.filter(status=PayslipRecord.STATUS_EMAIL_FAILED).count()
        batch.status = PayrollBatch.STATUS_COMPLETED if batch.email_failed == 0 else PayrollBatch.STATUS_FAILED
        batch.save(update_fields=["email_sent", "email_failed", "status", "updated_at"])

    if total_failed > 0:
        # No in-app Notification model exists in this project — discarded
        # per project decision. Failures remain visible via
        # batch.email_failed / batch.status and this log line.
        import logging

        failed_codes = [r["employee_code"] for r in results if not r["success"]]
        logging.getLogger(__name__).warning(
            "Payroll batch %s (%s %s/%s): %s of %s payslip email(s) failed: %s",
            batch_id, batch.client.name, batch.month, batch.year,
            total_failed, total_failed + total_sent, ", ".join(failed_codes),
        )

    return {
        "batch_status": batch.status,
        "total_sent": total_sent,
        "total_failed": total_failed,
        "results": results,
    }