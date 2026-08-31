"""Design 2: Modern dark-sidebar landscape payslip PDF renderer.

Faithful to reference fields and model attributes:
PayslipRecord, Employee, Batch, Client, and EmployeeSalaryStructure.
"""
from __future__ import annotations

import io
import re
import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from django.conf import settings
from django.utils.text import slugify
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm
from reportlab.lib.pdfencrypt import StandardEncryption
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from ..models import PayslipRecord

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None

_FONT, _BOLD = 'Helvetica', 'Helvetica-Bold'


def _register_font():
    global _FONT, _BOLD
    candidates = [
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
        (str(Path(__file__).parent / 'fonts' / 'DejaVuSans.ttf'), str(Path(__file__).parent / 'fonts' / 'DejaVuSans-Bold.ttf')),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            try:
                pdfmetrics.registerFont(TTFont('PayslipSans', regular))
                pdfmetrics.registerFont(TTFont('PayslipSans-Bold', bold))
                _FONT, _BOLD = 'PayslipSans', 'PayslipSans-Bold'
                return
            except Exception:
                pass


_register_font()


def resized_logo_bytes(logo_path, max_px: int = 420) -> bytes | None:
    if PILImage is None:
        return None
    try:
        with PILImage.open(logo_path) as image:
            image = image.convert('RGBA') if image.mode in ('RGBA', 'LA', 'P') else image.convert('RGB')
            width, height = image.size
            longest = max(width, height)
            if longest > max_px:
                ratio = max_px / longest
                resampling = getattr(PILImage, 'Resampling', PILImage).LANCZOS
                image = image.resize((max(1, round(width * ratio)), max(1, round(height * ratio))), resampling)
            output = io.BytesIO()
            if image.mode == 'RGBA':
                image.save(output, format='PNG', optimize=True)
            else:
                image.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()
    except Exception:
        return None


def _money(value):
    value = Decimal(str(value or 0))
    if not value:
        return ''
    return f"{value.quantize(Decimal('1'), rounding=ROUND_HALF_UP):,.0f}"


def _money_or_zero(value):
    value = Decimal(str(value or 0))
    return f"{value.quantize(Decimal('1'), rounding=ROUND_HALF_UP):,.0f}"


def _leave(value):
    try:
        return f"{Decimal(str(value)):,.2f}"
    except Exception:
        return str(value)


def _days(value):
    try:
        n = Decimal(str(value))
        return f'{n:.0f}' if n == n.to_integral_value() else f'{n:,.2f}'
    except Exception:
        return str(value)


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[^A-Za-z0-9\s_-]', '', name or 'Employee').strip()
    return re.sub(r'\s+', '_', name) or 'Employee'


def _password_for(record):
    employee = record.employee
    name = re.sub(r'[^A-Za-z]', '', (employee.full_name or '').split()[0] if employee.full_name else '').upper()
    digits = re.sub(r'\D', '', employee.pan_number or '')
    return f"{name[:4].ljust(4, 'X')}{digits}" if digits else employee.employee_code


_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']


def _two(n): return _ONES[n] if n < 20 else _TENS[n // 10] + ('' if n % 10 == 0 else ' ' + _ONES[n % 10])
def _three(n): return _two(n) if n < 100 else _ONES[n // 100] + ' Hundred' + ('' if n % 100 == 0 else ' ' + _two(n % 100))
def _words(n):
    if not n: return 'Zero'
    result = []
    for divisor, label in ((10_000_000, 'Crore'), (100_000, 'Lakh'), (1000, 'Thousand')):
        part, n = divmod(n, divisor)
        if part: result.append(_three(part) + ' ' + label)
    if n: result.append(_three(n))
    return ' '.join(result)


def amount_in_words(amount):
    rupees = int(Decimal(str(amount)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    return 'Rupees ' + _words(rupees) + ' Only'


def _structure(record):
    try:
        from ..models import EmployeeSalaryStructure
    except (ImportError, ValueError):
        from models import EmployeeSalaryStructure
    reference = date(record.batch.year, record.batch.month, 1)
    obj = EmployeeSalaryStructure.objects.filter(employee=record.employee, effective_from__lte=reference).order_by('-effective_from').first()
    return obj, bool(obj.pf_opted) if obj else bool(record.epf)


def _draw_lock_icon(c, x, y, size, colour):
    c.saveState()
    c.setStrokeColor(colors.HexColor(colour))
    c.setFillColor(colors.HexColor(colour))
    c.setLineWidth(1.0)
    q = size / 16.0
    # Lock body
    c.roundRect(x + 2 * q, y + 1 * q, 12 * q, 9 * q, 1.5 * q, stroke=1, fill=0)
    # Shackle
    p = c.beginPath()
    p.moveTo(x + 4.5 * q, y + 10 * q)
    p.lineTo(x + 4.5 * q, y + 13 * q)
    p.curveTo(x + 4.5 * q, y + 15.5 * q, x + 11.5 * q, y + 15.5 * q, x + 11.5 * q, y + 13 * q)
    p.lineTo(x + 11.5 * q, y + 10 * q)
    c.drawPath(p, stroke=1, fill=0)
    # Keyhole
    c.circle(x + 8 * q, y + 6 * q, 1.2 * q, stroke=0, fill=1)
    c.rect(x + 7.4 * q, y + 3.5 * q, 1.2 * q, 2.2 * q, stroke=0, fill=1)
    c.restoreState()


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = landscape(A4)
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # Color definitions
    SIDEBAR_BG = '#101d36'
    SIDEBAR_MUTED = '#687e9d'
    SIDEBAR_SUBTITLE = '#8ea4c8'
    SIDEBAR_CARD_BG = '#152542'
    SIDEBAR_CARD_BORDER = '#564426'
    GOLD_TEXT = '#f6b840'
    GOLD_LABEL = '#d89f36'

    DARK_NAVY = '#10223d'
    CARD_BG = '#f1f5f9'
    CARD_MUTED = '#6b7c93'
    GREEN_AMOUNT = '#0a8754'
    RED_AMOUNT = '#c63d2b'

    WORDS_BG = '#fbf5eb'
    WORDS_STRIPE = '#d49b35'
    WORDS_LABEL = '#9c7832'

    # Left Sidebar Dimensions
    sw = 88 * mm
    c.setFillColor(colors.HexColor(SIDEBAR_BG))
    c.rect(0, 0, sw, H, stroke=0, fill=1)

    sx = 11 * mm
    inner_w = sw - 2 * sx

    # Top of sidebar: Logo / Company Name
    y = H - 20 * mm
    _profile = getattr(client, 'payroll_profile', None)
    logo = getattr(_profile, 'payroll_logo', None) if _profile else None
    drawn_logo = False
    if logo and PILImage and getattr(logo, 'path', None) and Path(logo.path).exists():
        try:
            data = resized_logo_bytes(logo.path)
            if not data:
                raise ValueError('logo resize failed')
            with PILImage.open(io.BytesIO(data)) as im:
                iw, ih = im.size
            ratio = min((inner_w * 0.7) / iw, 14 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(ImageReader(io.BytesIO(data)), sx, y - lh, lw, lh, mask='auto')
            # Accent bar under logo
            c.setStrokeColor(colors.HexColor('#007cc3'))
            c.setLineWidth(2.2)
            c.line(sx, y - lh - 2.5 * mm, sx + 20 * mm, y - lh - 2.5 * mm)
            y -= (lh + 6 * mm)
            drawn_logo = True
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'COMPANY').strip()
        c.setFont(_BOLD, 24)
        c.setFillColor(colors.HexColor('#007cc3'))
        c.drawString(sx, y, client_name)
        # Accent bar under logo
        c.setStrokeColor(colors.HexColor('#007cc3'))
        c.setLineWidth(2.5)
        c.line(sx, y - 4 * mm, sx + 22 * mm, y - 4 * mm)
        y -= 9 * mm

    # Address / Subtitle
    address_line = (client.address or 'CORPORATE OFFICE').splitlines()[0].upper()
    c.setFont(_BOLD, 7)
    c.setFillColor(colors.HexColor(SIDEBAR_MUTED))
    c.drawString(sx, y - 1 * mm, address_line)

    # Employee Section
    y -= 19 * mm
    c.setFont(_BOLD, 7)
    c.setFillColor(colors.HexColor(SIDEBAR_MUTED))
    c.drawString(sx, y, "E M P L O Y E E")

    y -= 7.5 * mm
    c.setFont(_BOLD, 17.5)
    c.setFillColor(colors.white)
    c.drawString(sx, y, employee.full_name or '—')

    y -= 5.5 * mm
    c.setFont(_FONT, 9.5)
    c.setFillColor(colors.HexColor(SIDEBAR_SUBTITLE))
    c.drawString(sx, y, employee.position or '—')

    y -= 4.8 * mm
    c.setFont(_FONT, 8.8)
    c.setFillColor(colors.HexColor(SIDEBAR_SUBTITLE))
    dept = employee.department or '—'
    c.drawString(sx, y, f"Department - {dept}")

    # Employee Metadata Rows
    meta_rows = [
        ("EMPLOYEE CODE", employee.employee_code or '—'),
        ("PAN NUMBER", employee.pan_number or '—'),
        ("EMAIL", employee.email or '—'),
        ("DATE OF JOINING", str(employee.hire_date or '—')),
        ("CTC (ANNUAL)", str(ctc)),
    ]

    y -= 13 * mm
    for label, val in meta_rows:
        c.setFont(_BOLD, 7)
        c.setFillColor(colors.HexColor(SIDEBAR_MUTED))
        c.drawString(sx, y, label)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.white)
        c.drawRightString(sw - sx, y, str(val))
        y -= 7.8 * mm

    # Net Take-Home Card at Bottom of Sidebar
    card_h = 32 * mm
    card_y = 15 * mm
    c.saveState()
    c.setFillColor(colors.HexColor('#13213a'))
    c.setStrokeColor(colors.HexColor('#3d495d'))
    c.setLineWidth(1.0)
    c.roundRect(sx, card_y, inner_w, card_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor(GOLD_LABEL))
    c.drawString(sx + 6 * mm, card_y + card_h - 8 * mm, "N E T   T A K E - H O M E")

    c.setFont(_BOLD, 22)
    c.setFillColor(colors.HexColor(GOLD_TEXT))
    net_str = f"₹{_money(record.net_salary) or '0.00'}"
    c.drawString(sx + 6 * mm, card_y + 7.5 * mm, net_str)

    # ----------------------------------------------------
    # Right Main Area
    # ----------------------------------------------------
    rx = sw + 14 * mm
    rw = (W - 14 * mm) - rx

    # Header Row: Title & Month Pill
    hy = H - 20 * mm
    c.setFont(_BOLD, 16)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(rx, hy, "SALARY SLIP")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    pill_font_size = 9.5
    month_w = pdfmetrics.stringWidth(month_text, _BOLD, pill_font_size)
    pill_w = month_w + 16 * mm
    pill_h = 8 * mm
    pill_x = rx + rw - pill_w
    pill_y = hy - 1.8 * mm

    c.saveState()
    c.setFillColor(colors.HexColor('#faefe0'))
    c.roundRect(pill_x, pill_y, pill_w, pill_h, pill_h / 2, stroke=0, fill=1)
    c.restoreState()

    c.setFont(_BOLD, pill_font_size)
    c.setFillColor(colors.HexColor('#8a6d3b'))
    c.drawCentredString(pill_x + pill_w / 2, pill_y + 2.5 * mm, month_text)

    # Dark divider line under header
    c.setStrokeColor(colors.HexColor(DARK_NAVY))
    c.setLineWidth(1.5)
    c.line(rx, hy - 6 * mm, rx + rw, hy - 6 * mm)

    # Attendance Metric Cards (4 cards)
    att_y = hy - 26 * mm
    att_h = 17 * mm
    gap = 4 * mm
    card_w = (rw - 3 * gap) / 4

    metrics = [
        ("DAYS IN MONTH", _days(record.days_in_month)),
        ("WORKING DAYS", _days(record.actual_working_days)),
        ("PAID LEAVE", _leave(record.paid_leave_days)),
        ("LOP DAYS", _leave(record.lop_days)),
    ]

    for idx, (label, val) in enumerate(metrics):
        cx = rx + idx * (card_w + gap)
        c.saveState()
        c.setFillColor(colors.HexColor(CARD_BG))
        c.roundRect(cx, att_y, card_w, att_h, 3 * mm, stroke=0, fill=1)
        c.restoreState()

        c.setFont(_BOLD, 7)
        c.setFillColor(colors.HexColor(CARD_MUTED))
        c.drawString(cx + 4.5 * mm, att_y + att_h - 5.8 * mm, label)

        c.setFont(_BOLD, 14.5)
        c.setFillColor(colors.HexColor(DARK_NAVY))
        c.drawString(cx + 4.5 * mm, att_y + 3.8 * mm, str(val))

    # Earnings & Deductions Tables
    table_top = att_y - 11 * mm
    col_gap = 10 * mm
    col_w = (rw - col_gap) / 2

    # Column Headers
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    # Earnings header
    c.drawString(rx, table_top, "EARNINGS")
    c.drawRightString(rx + col_w, table_top, "₹")
    # Deductions header
    c.drawString(rx + col_w + col_gap, table_top, "DEDUCTIONS")
    c.drawRightString(rx + 2 * col_w + col_gap, table_top, "₹")

    # Header underline
    c.setStrokeColor(colors.HexColor(DARK_NAVY))
    c.setLineWidth(1.6)
    c.line(rx, table_top - 2.5 * mm, rx + col_w, table_top - 2.5 * mm)
    c.line(rx + col_w + col_gap, table_top - 2.5 * mm, rx + 2 * col_w + col_gap, table_top - 2.5 * mm)

    # Build rows based on exact field rules
    def rows(spec):
        return [(name, _money(value) or '0.00') for name, value, optional in spec if not (optional and value == 0)]

    earn_list = rows([
        ('Basic + DA', record.basic_da, False),
        ('HRA', record.hra, False),
        ('Leave Travel Allowance', record.lta, True),
        ('Special Allowance', record.special_allowance, False),
        ('NPS Allowance', record.nps_allowance_earned, True),
        ('Variable Pay', record.variable_pay, True),
        ('Commission / Other', record.commission_other, True),
        ('Salary Advance Given', record.salary_advance_disbursed, True),
        ('On Hold Released', record.on_hold_released, True),
        ('Reimbursement', record.reimbursements, True),
        ('Arrears', record.arrears, True),
    ])

    ded_list = rows([
        ('EPF', record.epf, not pf_opted),
        ('VPF', record.vpf, True),
        ('VPF Arrears', record.vpf_arrears, True),
        ('Professional Tax', record.professional_tax, False),
        ('TDS', record.tds, False),
        ('NPS Deduction', record.nps_deduction, True),
        ('NPS Deduction – Arrears', record.nps_deduction_arrears, True),
        ('Loan Deduction', record.loan_deduction, True),
        ('Salary Advance Recovered', record.salary_advance_recovered, True),
        ('On Hold Deducted', record.on_hold_deducted, True),
        ('LWF', record.lwf, True),
        ('Other Deduction', record.other_deduction, True),
    ])

    row_h = 8.2 * mm
    max_len = max(len(earn_list), len(ded_list))

    curr_y = table_top - 8.5 * mm
    for i in range(max_len):
        # Earnings item
        if i < len(earn_list):
            ename, evalue = earn_list[i]
            c.setFont(_FONT, 8.8)
            c.setFillColor(colors.HexColor(DARK_NAVY))
            c.drawString(rx, curr_y, ename)
            c.drawRightString(rx + col_w, curr_y, evalue)

        # Deductions item
        if i < len(ded_list):
            dname, dvalue = ded_list[i]
            c.setFont(_FONT, 8.8)
            c.setFillColor(colors.HexColor(DARK_NAVY))
            c.drawString(rx + col_w + col_gap, curr_y, dname)
            c.drawRightString(rx + 2 * col_w + col_gap, curr_y, dvalue)

        curr_y -= row_h

    # Totals section
    total_line_y = curr_y + 2.5 * mm
    c.setStrokeColor(colors.HexColor(DARK_NAVY))
    c.setLineWidth(1.6)
    c.line(rx, total_line_y, rx + col_w, total_line_y)
    c.line(rx + col_w + col_gap, total_line_y, rx + 2 * col_w + col_gap, total_line_y)

    curr_y -= 2 * mm
    # GROSS SALARY & TOTAL DEDUCTIONS
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(rx, curr_y, "GROSS SALARY")
    c.drawRightString(rx + col_w, curr_y, _money(record.gross_salary) or '0.00')

    c.drawString(rx + col_w + col_gap, curr_y, "TOTAL DEDUCTIONS")
    c.setFillColor(colors.HexColor(RED_AMOUNT))
    c.drawRightString(rx + 2 * col_w + col_gap, curr_y, _money(record.total_deductions) or '0.00')

    curr_y -= row_h
    # EARNED SALARY
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(rx, curr_y, "EARNED SALARY")
    c.setFillColor(colors.HexColor(GREEN_AMOUNT))
    c.drawRightString(rx + col_w, curr_y, _money(record.earned_salary) or '0.00')

    # AMOUNT IN WORDS Box
    words_y = 19 * mm
    words_h = 16 * mm
    c.saveState()
    c.setFillColor(colors.HexColor(WORDS_BG))
    c.roundRect(rx, words_y, rw, words_h, 2.5 * mm, stroke=0, fill=1)
    # Left amber stripe
    c.setFillColor(colors.HexColor(WORDS_STRIPE))
    c.rect(rx, words_y, 3.5 * mm, words_h, stroke=0, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 7.2)
    c.setFillColor(colors.HexColor(WORDS_LABEL))
    c.drawString(rx + 7.5 * mm, words_y + words_h - 5.5 * mm, "AMOUNT IN WORDS")

    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(rx + 7.5 * mm, words_y + 3.8 * mm, amount_in_words(record.net_salary))

    # Footer note
    fy = 10.5 * mm
    _draw_lock_icon(c, rx, fy - 0.5 * mm, 4 * mm, '#8a99a8')
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor('#8a99a8'))
    c.drawString(rx + 5.5 * mm, fy, "This is a system-generated, password-protected salary slip and does not require a signature.")

    c.showPage()
    c.save()
    return buf.getvalue()


def _encrypt_pdf_inplace(path: Path, password: str) -> None:
    try:
        from pypdf import PdfReader, PdfWriter
        reader = PdfReader(str(path))
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(password)
        with path.open('wb') as file:
            writer.write(file)
    except ImportError:
        return


def generate_payslip_pdf(record: PayslipRecord) -> str:
    client, employee = record.batch.client, record.employee
    client_slug = slugify(client.name) or f"client-{client.id}"
    month_folder = f"{record.batch.month:02d}-{calendar.month_name[record.batch.month]}"
    media_root = getattr(settings, 'MEDIA_ROOT', '/tmp/media') if settings.configured else '/tmp/media'
    output = Path(media_root) / 'payslips_v2' / client_slug / str(record.batch.year) / month_folder
    output.mkdir(parents=True, exist_ok=True)
    path = output / f'{employee.employee_code}.pdf'

    password = _password_for(record)
    encryption = StandardEncryption(userPassword=password, ownerPassword=password,
                                    canPrint=1, canModify=0, canCopy=0, canAnnotate=0)
    path.write_bytes(_build_pdf_bytes(record, encryption=encryption))
    record.pdf_path = str(path)
    record.pdf_password = password
    record.status = PayslipRecord.STATUS_APPROVED
    record.save(update_fields=['pdf_path', 'pdf_password', 'status', 'updated_at'])
    return str(path)