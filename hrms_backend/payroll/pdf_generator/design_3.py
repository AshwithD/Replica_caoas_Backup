"""Design 3: Cyberpunk / Slate-Dark-Theme Portrait payslip PDF renderer.

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
from .text_fit import draw_block, draw_fitted

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


def _employer_pf_note(c, structure, cx, y):
    """One-line employer-PF disclosure, drawn in the same quiet slate style
    as the system-generated footer note. Skipped when there is no structure
    or no employer PF (pf_opted=False / basic below ceiling)."""
    amount = getattr(structure, 'employer_pf', None) if structure else None
    if not amount or amount <= 0:
        return
    text = f"Employer PF ₹{_money(amount)} — for information only, not deducted · Gross = Earned + Employer PF"
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor('#475569'))
    c.drawCentredString(cx, y, text)


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = A4
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # Color Palette
    PAGE_BG = '#0b1220'
    CARD_BG = '#0d172a'
    CARD_BORDER = '#1e2b42'
    CYAN_ACCENT = '#38bdf8'
    CYAN_BRIGHT = '#22d3ee'
    SLATE_LABEL = '#64748b'
    TEXT_WHITE = '#ffffff'
    GREEN_STROKE = '#10b981'
    GREEN_FILL = '#063327'
    GREEN_TEXT = '#34d399'
    RED_STROKE = '#ef4444'
    RED_FILL = '#381419'
    RED_TEXT = '#f87171'

    # Fill Page Background
    c.setFillColor(colors.HexColor(PAGE_BG))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    margin = 12 * mm
    content_w = W - 2 * margin

    # ----------------------------------------------------
    # Header: Logo (left) & Salary Slip + Month Pill (right)
    # ----------------------------------------------------
    header_y = H - 18 * mm
    _profile = getattr(client, 'payroll_profile', None)
    logo = getattr(_profile, 'payroll_logo', None) if _profile else None
    drawn_logo = False
    name_bottom = None
    if logo and PILImage and getattr(logo, 'path', None) and Path(logo.path).exists():
        try:
            data = resized_logo_bytes(logo.path)
            if not data:
                raise ValueError('logo resize failed')
            with PILImage.open(io.BytesIO(data)) as im:
                iw, ih = im.size
            ratio = min(42 * mm / iw, 14 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(ImageReader(io.BytesIO(data)), margin, header_y - lh, lw, lh, mask='auto')
            drawn_logo = True
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'COMPANY').strip()
        # Reserve everything left of the right-hand SALARY SLIP / month pill.
        name_w = content_w - 42 * mm
        c.setFillColor(colors.HexColor(CYAN_ACCENT))
        # Track the block's real bottom so the address sits BELOW the wrapped
        # name instead of at a fixed offset that a 2-line name overlaps.
        # 13pt max keeps a 2-line name inside the fixed header band, so the
        # address below and the details card keep their exact positions.
        name_bottom = draw_block(c, margin, header_y - 6 * mm, client_name, _BOLD, 22,
                                 name_w, max_lines=2, min_size=9, leading_ratio=1.1)

    # Address / Subtitle
    address_text = (client.address or 'CORPORATE OFFICE')
    c.setFillColor(colors.HexColor('#7286a5'))
    # Fixed baseline: the header band is a constant height for every client,
    # so nothing below it can ever be pushed off the page.
    addr_y = header_y - 19 * mm
    draw_block(c, margin, addr_y, address_text, _FONT, 7.5,
               content_w - 46 * mm, max_lines=2, min_size=6.0, leading_ratio=1.15)

    # Header Right
    c.setFont(_BOLD, 8)
    c.setFillColor(colors.HexColor('#798da3'))
    c.drawRightString(W - margin, header_y - 2 * mm, "SALARY SLIP")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    pill_font_size = 8.5
    month_w = pdfmetrics.stringWidth(month_text, _BOLD, pill_font_size)
    pill_w = month_w + 14 * mm
    pill_h = 7 * mm
    pill_x = W - margin - pill_w
    pill_y = header_y - 15 * mm

    c.saveState()
    c.setFillColor(colors.HexColor('#0c233e'))
    c.setStrokeColor(colors.HexColor('#0284c7'))
    c.setLineWidth(0.8)
    c.roundRect(pill_x, pill_y, pill_w, pill_h, pill_h / 2, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, pill_font_size)
    c.setFillColor(colors.HexColor(CYAN_ACCENT))
    c.drawCentredString(pill_x + pill_w / 2, pill_y + 2.2 * mm, month_text)

    # ----------------------------------------------------
    # Employee Details Card
    # ----------------------------------------------------
    # The details card starts below whatever height the (possibly wrapped)
    # name + address block actually consumed — never a fixed offset that a
    # long client name would overlap.
    card1_top = header_y - 27 * mm
    card1_h = 72 * mm
    card1_y = card1_top - card1_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, card1_y, content_w, card1_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    # Section Title
    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.HexColor(CYAN_ACCENT))
    c.drawString(margin + 6 * mm, card1_top - 8 * mm, "E M P L O Y E E   D E T A I L S")

    # Grid of details: 2 columns, 6 rows
    left_col_x = margin + 6 * mm
    right_col_x = margin + content_w / 2 + 3 * mm

    details_grid = [
        (("EMPLOYEE CODE", employee.employee_code or '—'),
         ("EMPLOYEE NAME", employee.full_name or '—')),
        (("DESIGNATION", employee.position or '—'),
         ("DEPARTMENT", employee.department or '—')),
        (("PAN NUMBER", employee.pan_number or '—'),
         ("EMAIL", employee.email or '—')),
        (("DATE OF JOINING", str(employee.hire_date or '—')),
         ("CTC (ANNUAL)", str(ctc))),
        (("DAYS IN MONTH", _days(record.days_in_month)),
         ("WORKING DAYS", _days(record.actual_working_days))),
        (("PAID LEAVE", _leave(record.paid_leave_days)),
         ("LOP DAYS", _leave(record.lop_days))),
    ]

    row_y = card1_top - 16 * mm
    for (l_label, l_val), (r_label, r_val) in details_grid:
        # Left column
        col_w = content_w / 2 - 9 * mm
        c.setFont(_BOLD, 6.8)
        c.setFillColor(colors.HexColor(SLATE_LABEL))
        c.drawString(left_col_x, row_y, l_label)
        c.setFillColor(colors.HexColor(TEXT_WHITE))
        # Fitted so a long name/email can't spill into the right column.
        draw_fitted(c, left_col_x, row_y - 4.2 * mm, str(l_val), _BOLD, 8.5, col_w, min_size=6)

        # Right column
        c.setFont(_BOLD, 6.8)
        c.setFillColor(colors.HexColor(SLATE_LABEL))
        c.drawString(right_col_x, row_y, r_label)
        c.setFillColor(colors.HexColor(TEXT_WHITE))
        draw_fitted(c, right_col_x, row_y - 4.2 * mm, str(r_val), _BOLD, 8.5,
                    (margin + content_w - 6 * mm) - right_col_x, min_size=6)

        row_y -= 9.2 * mm

    # ----------------------------------------------------
    # Earnings & Deductions Tables (Two Cards Side-by-Side)
    # ----------------------------------------------------
    tables_top = card1_y - 6 * mm
    table_card_h = 92 * mm
    table_card_y = tables_top - table_card_h
    card_gap = 5 * mm
    table_w = (content_w - card_gap) / 2

    # Left Card: Earnings
    earn_x = margin
    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(earn_x, table_card_y, table_w, table_card_h, 3.5 * mm, stroke=1, fill=1)

    # Right Card: Deductions
    ded_x = margin + table_w + card_gap
    c.roundRect(ded_x, table_card_y, table_w, table_card_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    # Earnings Header
    c.setFont(_BOLD, 9.2)
    c.setFillColor(colors.HexColor(TEXT_WHITE))
    c.drawString(earn_x + 6 * mm, tables_top - 8 * mm, "Earnings")
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor(SLATE_LABEL))
    c.drawRightString(earn_x + table_w - 6 * mm, tables_top - 8 * mm, "Amount (₹)")

    # Deductions Header
    c.setFont(_BOLD, 9.2)
    c.setFillColor(colors.HexColor(TEXT_WHITE))
    c.drawString(ded_x + 6 * mm, tables_top - 8 * mm, "Deductions")
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor(SLATE_LABEL))
    c.drawRightString(ded_x + table_w - 6 * mm, tables_top - 8 * mm, "Amount (₹)")

    # Build data rows using standard rules
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

    row_h = 7.6 * mm
    curr_earn_y = tables_top - 17 * mm
    for name, val in earn_list:
        c.setFont(_FONT, 8.5)
        c.setFillColor(colors.HexColor('#e2e8f0'))
        c.drawString(earn_x + 6 * mm, curr_earn_y, name)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_WHITE))
        c.drawRightString(earn_x + table_w - 6 * mm, curr_earn_y, val)
        curr_earn_y -= row_h

    curr_ded_y = tables_top - 17 * mm
    for name, val in ded_list:
        c.setFont(_FONT, 8.5)
        c.setFillColor(colors.HexColor('#e2e8f0'))
        c.drawString(ded_x + 6 * mm, curr_ded_y, name)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_WHITE))
        c.drawRightString(ded_x + table_w - 6 * mm, curr_ded_y, val)
        curr_ded_y -= row_h

    # Earnings Bottom Summary: Gross Salary & Earned Salary
    # Align pills in same row as per reference image
    gross_y = table_card_y + 19 * mm
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(TEXT_WHITE))
    c.drawString(earn_x + 6 * mm, gross_y, "Gross Salary")
    c.drawRightString(earn_x + table_w - 6 * mm, gross_y, _money(record.gross_salary) or '0.00')

    # Earned Salary Pill + Total Deductions Pill - SAME ROW
    pill_y = table_card_y + 5 * mm  # shared Y for both pills - reference alignment
    pill_inner_w = table_w - 10 * mm

    # Earned Salary Pill (left)
    c.saveState()
    c.setFillColor(colors.HexColor(GREEN_FILL))
    c.setStrokeColor(colors.HexColor(GREEN_STROKE))
    c.setLineWidth(0.8)
    c.roundRect(earn_x + 5 * mm, pill_y, pill_inner_w, 8 * mm, 2.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(GREEN_TEXT))
    c.drawString(earn_x + 9 * mm, pill_y + 2.5 * mm, "Earned Salary")
    c.drawRightString(earn_x + 5 * mm + pill_inner_w - 4 * mm, pill_y + 2.5 * mm, _money(record.earned_salary) or '0.00')

    # Total Deductions Pill (right) - SAME ROW as Earned Salary
    c.saveState()
    c.setFillColor(colors.HexColor(RED_FILL))
    c.setStrokeColor(colors.HexColor(RED_STROKE))
    c.setLineWidth(0.8)
    c.roundRect(ded_x + 5 * mm, pill_y, pill_inner_w, 8 * mm, 2.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(RED_TEXT))
    c.drawString(ded_x + 9 * mm, pill_y + 2.5 * mm, "Total Deductions")
    c.drawRightString(ded_x + 5 * mm + pill_inner_w - 4 * mm, pill_y + 2.5 * mm, _money(record.total_deductions) or '0.00')

    # ----------------------------------------------------
    # Net Salary (Take-Home) Card with Stylized Rupee Watermark
    # ----------------------------------------------------
    _employer_pf_note(c, structure, W/2, table_card_y - 8.5*mm)
    net_card_top = table_card_y - 13 * mm
    net_card_h = 28 * mm
    net_card_y = net_card_top - net_card_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, net_card_y, content_w, net_card_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    # Left text
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor(CYAN_ACCENT))
    c.drawString(margin + 8 * mm, net_card_top - 8 * mm, "N E T   S A L A R Y   ( T A K E - H O M E )")

    c.setFont(_BOLD, 22)
    c.setFillColor(colors.HexColor(CYAN_BRIGHT))
    c.drawString(margin + 8 * mm, net_card_y + 6.5 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    # Right side: Large Rupee Watermark
    c.setFont(_BOLD, 48)
    c.setFillColor(colors.HexColor('#141f36'))
    c.drawRightString(W - margin - 8 * mm, net_card_y + 4 * mm, "₹")

    # ----------------------------------------------------
    # Amount In Words Card
    # ----------------------------------------------------
    words_card_top = net_card_y - 5 * mm
    words_card_h = 16 * mm
    words_card_y = words_card_top - words_card_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, words_card_y, content_w, words_card_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 6.8)
    c.setFillColor(colors.HexColor(SLATE_LABEL))
    c.drawString(margin + 8 * mm, words_card_top - 5.5 * mm, "A M O U N T   I N   W O R D S")

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_WHITE))
    c.drawString(margin + 8 * mm, words_card_y + 3.8 * mm, amount_in_words(record.net_salary))

    # ----------------------------------------------------
    # Footer Disclaimer
    # ----------------------------------------------------
    fy = 11 * mm
    disclaimer_text = "This is a system-generated, password-protected salary slip and does not require a signature."
    _draw_lock_icon(c, margin + 15 * mm, fy - 0.5 * mm, 3.8 * mm, '#475569')
    c.setFont(_FONT, 7.2)
    c.setFillColor(colors.HexColor('#475569'))
    c.drawString(margin + 20 * mm, fy, disclaimer_text)

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
    output = Path(media_root) / 'payslips_v3' / client_slug / str(record.batch.year) / month_folder
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