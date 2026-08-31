"""Design 4: Classic Formal Corporate / Accounting Bordered payslip PDF renderer.

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
from reportlab.lib.pagesizes import A4
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

_FONT, _BOLD, _ITALIC = 'Times-Roman', 'Times-Bold', 'Times-Italic'


def _register_font():
    global _FONT, _BOLD, _ITALIC
    candidates = [
        ('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'),
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
        # Local fallback — this design previously only checked the
        # system-wide font path above, so it never picked up the fonts/
        # folder the other 7 designs use, and silently fell back to base
        # Times-Roman (no ₹ glyph). No DejaVuSerif.ttf is available yet,
        # so this uses DejaVuSans as a working (non-serif) substitute —
        # drop a real DejaVuSerif.ttf/-Bold.ttf in here later to restore
        # the intended serif look; it'll be picked up automatically since
        # the serif candidate above is checked first.
        (str(Path(__file__).parent / 'fonts' / 'DejaVuSerif.ttf'), str(Path(__file__).parent / 'fonts' / 'DejaVuSerif-Bold.ttf')),
        (str(Path(__file__).parent / 'fonts' / 'DejaVuSans.ttf'), str(Path(__file__).parent / 'fonts' / 'DejaVuSans-Bold.ttf')),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            try:
                pdfmetrics.registerFont(TTFont('FormalSerif', regular))
                pdfmetrics.registerFont(TTFont('FormalSerif-Bold', bold))
                _FONT, _BOLD, _ITALIC = 'FormalSerif', 'FormalSerif-Bold', 'FormalSerif'
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
    c.setLineWidth(0.9)
    q = size / 16.0
    c.roundRect(x + 2 * q, y + 1 * q, 12 * q, 9 * q, 1.5 * q, stroke=1, fill=0)
    p = c.beginPath()
    p.moveTo(x + 4.5 * q, y + 10 * q)
    p.lineTo(x + 4.5 * q, y + 13 * q)
    p.curveTo(x + 4.5 * q, y + 15.5 * q, x + 11.5 * q, y + 15.5 * q, x + 11.5 * q, y + 13 * q)
    p.lineTo(x + 11.5 * q, y + 10 * q)
    c.drawPath(p, stroke=1, fill=0)
    c.circle(x + 8 * q, y + 6 * q, 1.2 * q, stroke=0, fill=1)
    c.rect(x + 7.4 * q, y + 3.5 * q, 1.2 * q, 2.2 * q, stroke=0, fill=1)
    c.restoreState()


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = A4
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # ----------------------------------------------------
    # Double Page Border
    # ----------------------------------------------------
    c.setStrokeColor(colors.HexColor('#1f2937'))
    # Outer thin border
    c.setLineWidth(1.2)
    c.rect(7 * mm, 7 * mm, W - 14 * mm, H - 14 * mm, stroke=1, fill=0)
    # Inner border
    c.setLineWidth(0.6)
    c.rect(8.8 * mm, 8.8 * mm, W - 17.6 * mm, H - 17.6 * mm, stroke=1, fill=0)

    content_x = 13 * mm
    content_w = W - 2 * content_x

    # ----------------------------------------------------
    # Header: Logo & Address
    # ----------------------------------------------------
    y = H - 24 * mm
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
            ratio = min(48 * mm / iw, 15 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            lx = (W - lw) / 2
            c.drawImage(ImageReader(io.BytesIO(data)), lx, y - lh, lw, lh, mask='auto')
            y -= (lh + 2 * mm)
            drawn_logo = True
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'COMPANY').strip()
        c.setFont(_BOLD, 22)
        c.setFillColor(colors.HexColor('#007cc3'))
        c.drawCentredString(W / 2, y - 6 * mm, client_name)
        y -= 9 * mm

    # Address
    address_line = (client.address or 'CORPORATE OFFICE').splitlines()[0].upper()
    c.setFont(_FONT, 8.5)
    c.setFillColor(colors.HexColor('#1f2937'))
    c.drawCentredString(W / 2, y, address_line)

    # Double horizontal line below header
    y -= 5 * mm
    c.setStrokeColor(colors.HexColor('#1f2937'))
    c.setLineWidth(0.7)
    c.line(content_x, y, content_x + content_w, y)
    c.line(content_x, y - 1.2 * mm, content_x + content_w, y - 1.2 * mm)

    # ----------------------------------------------------
    # Title: SALARY SLIP FOR THE MONTH OF ...
    # ----------------------------------------------------
    y -= 7 * mm
    c.setFont(_BOLD, 10.5)
    c.setFillColor(colors.HexColor('#111827'))
    month_name = calendar.month_name[batch.month].upper()
    title_text = f"SALARY SLIP FOR THE MONTH OF {month_name} {batch.year}"
    c.drawCentredString(W / 2, y, title_text)

    # Line below title
    y -= 4 * mm
    c.setLineWidth(0.8)
    c.line(content_x, y, content_x + content_w, y)

    # ----------------------------------------------------
    # Employee Details Section
    # ----------------------------------------------------
    y -= 6.5 * mm
    c.setFont(_BOLD, 9)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawCentredString(W / 2, y, "E M P L O Y E E   D E T A I L S")

    y -= 3.5 * mm
    c.setLineWidth(0.8)
    c.line(content_x, y, content_x + content_w, y)

    # Grid specifications: 4 columns
    # Col 1: Label (38mm)
    # Col 2: Value (54mm)
    # Col 3: Label (38mm)
    # Col 4: Value (54mm)
    col1_w = 38 * mm
    col2_w = 54 * mm
    col3_w = 38 * mm
    col4_w = content_w - (col1_w + col2_w + col3_w)

    x0 = content_x
    x1 = x0 + col1_w
    x2 = x1 + col2_w
    x3 = x2 + col3_w
    x4 = x0 + content_w

    details_data = [
        ("Employee Code", employee.employee_code or '—', "Employee Name", employee.full_name or '—'),
        ("Designation", employee.position or '—', "Department", employee.department or '—'),
        ("PAN Number", employee.pan_number or '—', "Email", employee.email or '—'),
        ("Date of Joining", str(employee.hire_date or '—'), "CTC (Annual)", str(ctc)),
        ("Days in Month", _days(record.days_in_month), "Working Days", _days(record.actual_working_days)),
        ("Paid Leave", _leave(record.paid_leave_days), "LOP Days", _leave(record.lop_days)),
    ]

    row_h = 6.8 * mm
    grid_top = y
    c.setStrokeColor(colors.HexColor('#374151'))
    c.setLineWidth(0.6)

    curr_row_y = grid_top
    for r_idx, (l1, v1, l2, v2) in enumerate(details_data):
        row_bottom = curr_row_y - row_h

        # Horizontal bottom border of row
        c.line(x0, row_bottom, x4, row_bottom)

        # Text baseline
        text_y = row_bottom + 2.2 * mm

        # Col 1
        c.setFont(_FONT, 8.5)
        c.setFillColor(colors.HexColor('#1f2937'))
        c.drawString(x0 + 2.5 * mm, text_y, l1)

        # Col 2
        c.setFont(_BOLD, 8.5)
        c.drawString(x1 + 2.5 * mm, text_y, str(v1))

        # Col 3
        c.setFont(_FONT, 8.5)
        c.drawString(x2 + 2.5 * mm, text_y, l2)

        # Col 4
        c.setFont(_BOLD, 8.5)
        c.drawString(x3 + 2.5 * mm, text_y, str(v2))

        curr_row_y = row_bottom

    # Vertical grid lines
    grid_bottom = curr_row_y
    for vx in (x0, x1, x2, x3, x4):
        c.line(vx, grid_top, vx, grid_bottom)

    # ----------------------------------------------------
    # Earnings & Deductions Tables (Bordered Classic Grid)
    # ----------------------------------------------------
    y = grid_bottom - 6 * mm
    card_gap = 5 * mm
    table_w = (content_w - card_gap) / 2

    earn_x0 = content_x
    earn_x1 = earn_x0 + table_w

    ded_x0 = content_x + table_w + card_gap
    ded_x1 = ded_x0 + table_w

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

    tbl_row_h = 6.6 * mm

    # Draw Table Header (Both Tables)
    header_h = 7.0 * mm
    header_top = y
    header_bottom = header_top - header_h

    # Earnings Header Background
    c.setFillColor(colors.HexColor('#f3f4f6'))
    c.rect(earn_x0, header_bottom, table_w, header_h, stroke=1, fill=1)
    # Deductions Header Background
    c.rect(ded_x0, header_bottom, table_w, header_h, stroke=1, fill=1)

    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.HexColor('#111827'))
    # Earnings header text - changed as per request
    c.drawString(earn_x0 + 3 * mm, header_bottom + 2.4 * mm, "EARNINGS")
    c.drawRightString(earn_x1 - 3 * mm, header_bottom + 2.4 * mm, "AMOUNT (₹)")
    # Deductions header text - changed as per request
    c.drawString(ded_x0 + 3 * mm, header_bottom + 2.4 * mm, "DEDUCTIONS")
    c.drawRightString(ded_x1 - 3 * mm, header_bottom + 2.4 * mm, "AMOUNT (₹)")

    # Data Rows
    max_rows = max(len(earn_list), len(ded_list))
    curr_tbl_y = header_bottom

    for i in range(max_rows):
        r_bottom = curr_tbl_y - tbl_row_h
        text_baseline = r_bottom + 2.2 * mm

        # Left Table (Earnings)
        c.setFillColor(colors.HexColor('#ffffff'))
        c.rect(earn_x0, r_bottom, table_w, tbl_row_h, stroke=1, fill=0)
        if i < len(earn_list):
            ename, evalue = earn_list[i]
            c.setFont(_FONT, 8.5)
            c.setFillColor(colors.HexColor('#1f2937'))
            c.drawString(earn_x0 + 3 * mm, text_baseline, ename)
            c.drawRightString(earn_x1 - 3 * mm, text_baseline, evalue)

        # Right Table (Deductions)
        c.rect(ded_x0, r_bottom, table_w, tbl_row_h, stroke=1, fill=0)
        if i < len(ded_list):
            dname, dvalue = ded_list[i]
            c.setFont(_FONT, 8.5)
            c.setFillColor(colors.HexColor('#1f2937'))
            c.drawString(ded_x0 + 3 * mm, text_baseline, dname)
            c.drawRightString(ded_x1 - 3 * mm, text_baseline, dvalue)

        curr_tbl_y = r_bottom

    # Summary Rows:
    # Left: GROSS SALARY
    # Right: TOTAL DEDUCTIONS
    r_bottom = curr_tbl_y - tbl_row_h
    text_baseline = r_bottom + 2.2 * mm

    c.rect(earn_x0, r_bottom, table_w, tbl_row_h, stroke=1, fill=0)
    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawString(earn_x0 + 3 * mm, text_baseline, "GROSS SALARY")
    c.drawRightString(earn_x1 - 3 * mm, text_baseline, _money(record.gross_salary) or '0.00')

    c.rect(ded_x0, r_bottom, table_w, tbl_row_h, stroke=1, fill=0)
    c.drawString(ded_x0 + 3 * mm, text_baseline, "TOTAL DEDUCTIONS")
    c.drawRightString(ded_x1 - 3 * mm, text_baseline, _money(record.total_deductions) or '0.00')

    curr_tbl_y = r_bottom

    # Next row: EARNED SALARY on left
    r_bottom = curr_tbl_y - tbl_row_h
    text_baseline = r_bottom + 2.2 * mm

    c.rect(earn_x0, r_bottom, table_w, tbl_row_h, stroke=1, fill=0)
    c.setFont(_BOLD, 8.5)
    c.drawString(earn_x0 + 3 * mm, text_baseline, "EARNED SALARY")
    c.drawRightString(earn_x1 - 3 * mm, text_baseline, _money(record.earned_salary) or '0.00')

    # ----------------------------------------------------
    # NET SALARY (TAKE-HOME) Box with Drop Shadow
    # ----------------------------------------------------
    net_w = 112 * mm
    net_h = 22 * mm
    net_x = (W - net_w) / 2
    net_y = r_bottom - 24 * mm

    # Shadow (Offset by 2mm bottom-right)
    c.saveState()
    c.setFillColor(colors.HexColor('#b5bdc7'))
    c.rect(net_x + 1.8 * mm, net_y - 1.8 * mm, net_w, net_h, stroke=0, fill=1)

    # Front Box
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#111827'))
    c.setLineWidth(1.1)
    c.rect(net_x, net_y, net_w, net_h, stroke=1, fill=1)
    c.restoreState()

    # Net Salary Content
    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawCentredString(W / 2, net_y + net_h - 6.5 * mm, "N E T   S A L A R Y   ( T A K E - H O M E )")

    c.setFont(_BOLD, 18.5)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawCentredString(W / 2, net_y + 4.5 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    # ----------------------------------------------------
    # AMOUNT IN WORDS Box
    # ----------------------------------------------------
    words_h = 16 * mm
    words_y = net_y - words_h - 6 * mm

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#111827'))
    c.setLineWidth(0.8)
    c.rect(content_x, words_y, content_w, words_h, stroke=1, fill=0)
    c.restoreState()

    c.setFont(_BOLD, 7.2)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawCentredString(W / 2, words_y + words_h - 5.5 * mm, "A M O U N T   I N   W O R D S")

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#111827'))
    c.drawCentredString(W / 2, words_y + 3.8 * mm, amount_in_words(record.net_salary))

    # ----------------------------------------------------
    # Footer
    # ----------------------------------------------------
    fy = 11 * mm
    disclaimer = "This is a system-generated, password-protected salary slip and does not require a signature."
    f_size = 7.5
    f_width = pdfmetrics.stringWidth(disclaimer, _ITALIC, f_size)
    total_footer_w = f_width + 6 * mm
    fx = (W - total_footer_w) / 2

    _draw_lock_icon(c, fx, fy - 0.5 * mm, 3.8 * mm, '#4b5563')
    c.setFont(_ITALIC, f_size)
    c.setFillColor(colors.HexColor('#4b5563'))
    c.drawString(fx + 5.5 * mm, fy, disclaimer)

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
    output = Path(media_root) / 'payslips_v4' / client_slug / str(record.batch.year) / month_folder
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