"""hrms_backend/payroll/email_service/email_service.py"""

import logging
import os
import time
from calendar import month_name
from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from dotenv import load_dotenv

from ..models import EmailLog, PayslipRecord
from ..pdf_generator import resized_logo_bytes

logger = logging.getLogger(__name__)


# ── Payroll email credentials ─────────────────────────────────────────────
# Payroll sends email using ONLY the credentials in `payroll/.env`
# (PAYROLL_EMAIL_*) — never the project-wide EMAIL_HOST_* settings in
# hrms_backend/settings.py. This module is the single source of truth for
# that config; tasks.py imports get_payroll_email_connection() from here so
# the bulk-send and single-resend paths always use the same .env values.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

PAYROLL_EMAIL_HOST = os.environ.get("PAYROLL_EMAIL_HOST", "smtp.gmail.com")
PAYROLL_EMAIL_PORT = int(os.environ.get("PAYROLL_EMAIL_PORT", "587"))
PAYROLL_EMAIL_USE_TLS = os.environ.get("PAYROLL_EMAIL_USE_TLS", "True") == "True"
PAYROLL_EMAIL_HOST_USER = os.environ.get("PAYROLL_EMAIL_HOST_USER", "")
PAYROLL_EMAIL_HOST_PASSWORD = os.environ.get("PAYROLL_EMAIL_HOST_PASSWORD", "")
# From address. Defaults to the authenticated account (HOST_USER) so the
# From header always matches the SMTP login — Gmail rejects From ≠ the
# authenticated user. Set an explicit display name + address like
#   PAYROLL_EMAIL_FROM=CAPSCA <audits@ckpsca.com>
PAYROLL_EMAIL_FROM = os.environ.get("PAYROLL_EMAIL_FROM", "") or PAYROLL_EMAIL_HOST_USER


def get_payroll_email_connection():
    return get_connection(
        host=PAYROLL_EMAIL_HOST,
        port=PAYROLL_EMAIL_PORT,
        username=PAYROLL_EMAIL_HOST_USER,
        password=PAYROLL_EMAIL_HOST_PASSWORD,
        use_tls=PAYROLL_EMAIL_USE_TLS,
    )


# ── Logo helper ────────────────────────────────────────────────────────────

LOGO_CID = "company_logo"


def _client_logo(client):
    """Resolve the client's payslip logo (ClientProfile.payroll_logo).
    Returns None when there is no profile row or no logo set."""
    profile = getattr(client, "payroll_profile", None)
    return getattr(profile, "payroll_logo", None) if profile else None


def _logo_img_tag(client) -> str:
    """
    Returns an <img> tag referencing the logo via Content-ID (cid:), which
    must be attached separately as an inline MIME part (see
    _attach_logo_inline). Gmail and most major clients strip/ignore
    base64 data: URIs in HTML email bodies, so cid: is the only
    reliable cross-client approach for embedded images.
    Falls back to the company name as bold text if no logo is set.
    """
    logo = _client_logo(client)
    if not logo:
        return f'<span style="color:#ffffff;font-size:18px;font-weight:700;">{client.name}</span>'
    try:
        # Just confirm the file actually exists on disk before referencing it;
        # the real attach happens in _attach_logo_inline.
        if not Path(logo.path).exists():
            raise FileNotFoundError
        return (
            f'<img src="cid:{LOGO_CID}" '
            f'alt="{client.name}" '
            f'style="max-height:48px;max-width:160px;object-fit:contain;" />'
        )
    except Exception:
        return f'<span style="color:#ffffff;font-size:18px;font-weight:700;">{client.name}</span>'


def _attach_logo_inline(email: EmailMultiAlternatives, client) -> None:
    """
    Attaches the company logo as an inline image part with the Content-ID
    referenced by _logo_img_tag's cid: src. Must be called whenever
    _logo_img_tag actually returned an <img> tag (i.e. logo exists and is
    readable) — otherwise there's nothing to attach.
    """
    logo = _client_logo(client)
    if not logo:
        return
    try:
        logo_path = Path(logo.path)
        if not logo_path.exists():
            return
        logo_bytes = resized_logo_bytes(logo_path)
        if logo_bytes is None:
            return
        # resized_logo_bytes always re-encodes to PNG (if the source had
        # transparency) or JPEG (otherwise) — so the subtype/filename must
        # match what was actually written, not the original upload's
        # extension, or mail clients may fail to render it.
        is_png = logo_bytes[:8] == b"\x89PNG\r\n\x1a\n"
        subtype = "png" if is_png else "jpeg"
        img = MIMEImage(logo_bytes, _subtype=subtype)
        img.add_header("Content-ID", f"<{LOGO_CID}>")
        img.add_header("Content-Disposition", "inline", filename=f"logo.{subtype}")
        email.attach(img)
    except Exception:
        # If attaching fails, the <img> tag will just show as a broken
        # image — non-fatal, the email still sends with the rest of the body.
        pass


# ── HTML body builder ──────────────────────────────────────────────────────

def _build_html_body(record: PayslipRecord) -> str:
    client      = record.batch.client
    employee    = record.employee
    month_label = month_name[record.batch.month]
    period      = f"{month_label} {record.batch.year}"
    logo_tag    = _logo_img_tag(client)

    # Password hint (mirrors pdf_generator._password_for logic)
    password_hint = (
        "First 4 letters of your first name (CAPS) + digits from your PAN<br/>"
        "<span style='color:#6b7280;font-size:12px;'>"
        "e.g.&nbsp; Name: <b>Rahul</b> Sharma &nbsp;·&nbsp; PAN: <b>ABCDE1234F</b>"
        " &nbsp;→&nbsp; Password: <b>RAHU1234</b>"
        "</span>"
    )

    # Employee detail rows — NO salary values
    details = [
        ("Employee Code",   employee.employee_code),
        ("Designation",     getattr(employee, 'designation', None) or '—'),
        ("Pay Period",      period),
        ("Date of Joining", str(getattr(employee, 'hire_date', None) or '—')),
    ]
    detail_rows_html = ''.join(
        f"""
        <tr>
          <td style="padding:8px 12px;color:#6b7280;font-size:13px;
                     width:40%;border-bottom:1px solid #f1f5f9;">{label}</td>
          <td style="padding:8px 12px;color:#1e293b;font-size:13px;font-weight:600;
                     border-bottom:1px solid #f1f5f9;">{value}</td>
        </tr>"""
        for label, value in details
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Salary Slip — {period}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;
             font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border-radius:8px;
                      box-shadow:0 1px 4px rgba(0,0,0,.08);
                      overflow:hidden;max-width:600px;width:100%;">

          <!-- ── HEADER BAR (mirrors PDF header) ── -->
          <tr>
            <td style="background-color:#1e3a5f;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Logo — left -->
                  <td style="padding:16px 20px;vertical-align:middle;width:50%;">
                    {logo_tag}
                  </td>
                  <!-- Period — right -->
                  <td style="padding:16px 20px;vertical-align:middle;
                             text-align:right;width:50%;">
                    <div style="color:#ffffff;font-size:11px;
                                letter-spacing:1px;text-transform:uppercase;
                                opacity:0.7;">Salary Slip</div>
                    <div style="color:#ffffff;font-size:17px;font-weight:700;
                                letter-spacing:0.5px;margin-top:2px;">{period.upper()}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── GREETING ── -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0;font-size:15px;color:#1e293b;">
                Dear <strong>{employee.full_name}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#475569;line-height:1.6;">
                Please find attached your salary slip for <strong>{period}</strong>.
                This document is password-protected for your privacy.
              </p>
            </td>
          </tr>

          <!-- ── EMPLOYEE DETAILS CARD ── -->
          <tr>
            <td style="padding:20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
                <!-- Card header -->
                <tr>
                  <td colspan="2"
                      style="background:#f1f5f9;padding:10px 12px;
                             font-size:11px;font-weight:700;color:#64748b;
                             letter-spacing:1px;text-transform:uppercase;
                             border-bottom:1px solid #e2e8f0;">
                    Employee Details
                  </td>
                </tr>
                {detail_rows_html}
              </table>
            </td>
          </tr>

          <!-- ── PASSWORD NOTICE ── -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fffbeb;border:1px solid #fde68a;
                            border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;
                               color:#92400e;letter-spacing:0.5px;
                               text-transform:uppercase;">
                      🔒 PDF Password
                    </p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                      {password_hint}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CONFIDENTIALITY NOTICE ── -->
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;
                         line-height:1.6;border-top:1px solid #f1f5f9;
                         padding-top:16px;">
                This email and its attachment are confidential and intended solely
                for the named recipient. If you have received this in error, please
                notify us immediately and delete all copies.
              </p>
            </td>
          </tr>

          <!-- ── SIGN-OFF ── -->
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-size:14px;color:#475569;">
                Warm regards,<br/>
                <strong style="color:#1e293b;">{client.name}</strong><br/>
                <span style="font-size:12px;color:#94a3b8;">
                  People &amp; Payroll Team
                </span>
              </p>
            </td>
          </tr>

          <!-- ── FOOTER BAR ── -->
          <tr>
            <td style="background:#1e3a5f;padding:14px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#93c5fd;">
                This is a system-generated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>"""


# ── Plain-text fallback ────────────────────────────────────────────────────

def _build_plain_body(record: PayslipRecord) -> str:
    client      = record.batch.client
    employee    = record.employee
    month_label = month_name[record.batch.month]
    period      = f"{month_label} {record.batch.year}"
    return (
        f"Dear {employee.full_name},\n\n"
        f"Please find attached your salary slip for {period}.\n\n"
        f"Employee Code : {employee.employee_code}\n"
        f"Designation   : {getattr(employee, 'designation', None) or '—'}\n"
        f"Pay Period     : {period}\n\n"
        "PDF PASSWORD\n"
        "------------\n"
        "First 4 letters of your first name (CAPS) + digits from your PAN\n"
        "e.g. Name: Rahul Sharma, PAN: ABCDE1234F → Password: RAHU1234\n\n"
        "This email and its attachment are confidential. "
        "If received in error, please notify us and delete all copies.\n\n"
        f"Regards,\n{client.name}\nPeople & Payroll Team"
    )


# ── Public send function ───────────────────────────────────────────────────

def send_payslip_email(record: PayslipRecord, sent_by, connection=None) -> tuple[bool, str]:
    # No connection supplied (e.g. single-record resend from the API) →
    # use the payroll .env connection, NOT Django's settings.py backend.
    connection = connection or get_payroll_email_connection()
    client       = record.batch.client
    employee     = record.employee
    month_label  = month_name[record.batch.month]
    period       = f"{month_label} {record.batch.year}"
    subject      = f"Your Salary Slip for {period} | {client.name}"
    # payroll_email override wins; otherwise fall back to the master client's email.
    _profile     = getattr(client, "payroll_profile", None)
    cc_email     = (getattr(_profile, "payroll_email", None) or client.email) or None
    attempt_number = EmailLog.objects.filter(payslip_record=record).count() + 1

    try:
        if not record.pdf_path:
            raise FileNotFoundError("Payslip PDF has not been generated.")
        pdf_path = Path(record.pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"Payslip PDF not found at {record.pdf_path}.")
        pdf_size_kb = pdf_path.stat().st_size / 1024

        t0 = time.perf_counter()
        # Callers sending a whole batch pass a single open connection in so
        # every email in the batch reuses one SMTP/TLS handshake instead of
        # paying that cost per-email.
        email = EmailMultiAlternatives(
            subject=subject,
            body=_build_plain_body(record),       # plain-text fallback
            from_email=PAYROLL_EMAIL_FROM or settings.DEFAULT_FROM_EMAIL,
            to=[employee.email],
            cc=[cc_email] if cc_email else [],
            connection=connection,
        )
        # mixed_subtype="related" is required so the inline logo (cid:) is
        # associated with the HTML alternative rather than treated as a
        # regular attachment by some clients.
        email.mixed_subtype = "related"
        email.attach_alternative(_build_html_body(record), "text/html")
        t1 = time.perf_counter()

        _attach_logo_inline(email, client)
        t2 = time.perf_counter()

        attachment_name = f"{employee.full_name.replace(' ', '')}_{month_label}{record.batch.year}-payslip.pdf"
        email.attach(attachment_name, pdf_path.read_bytes(), "application/pdf")
        t3 = time.perf_counter()

        email.send(fail_silently=False)
        t4 = time.perf_counter()

        logger.warning(
            "payslip_email_timing record=%s pdf_kb=%.0f build=%.2fs logo=%.2fs "
            "attach_pdf=%.2fs smtp_send=%.2fs total=%.2fs",
            record.id, pdf_size_kb, t1 - t0, t2 - t1, t3 - t2, t4 - t3, t4 - t0,
        )

        success = True
        message = "Email sent"
        record.status = PayslipRecord.STATUS_EMAIL_SENT
        record.save(update_fields=["status", "updated_at"])

    except Exception as exc:
        success = False
        message = str(exc)
        record.status = PayslipRecord.STATUS_EMAIL_FAILED
        record.save(update_fields=["status", "updated_at"])

    EmailLog.objects.create(
        payslip_record=record,
        sent_by=sent_by,
        recipient_email=employee.email,
        cc_email=cc_email,
        subject=subject,
        success=success,
        error_message="" if success else message,
        attempt_number=attempt_number,
    )
    return success, message