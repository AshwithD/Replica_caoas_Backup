"""Design 5: Clean Corporate Blue & White Wave payslip PDF renderer.

Faithful to reference fields and model attributes:
PayslipRecord, Employee, Batch, Client, and EmployeeSalaryStructure.

Improvements:
- Removed hardcoded "Navigate your next" tagline
- Upgraded icons to Lucide outline family with SVG rendering (crisp, consistent)
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


# --- Improved Lucide Icons (same family as generator1 for consistency) ---
_LUCIDE_SVG = {
    'user': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
    'wallet': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    'shield': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'document': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
}

try:
    from svglib.svglib import svg2rlg
except Exception:
    svg2rlg = None


def _draw_lucide_svg(c, kind, x, y, size, colour):
    """Try to draw crisp Lucide SVG via svglib, return True if success"""
    if svg2rlg is None or kind not in _LUCIDE_SVG:
        return False
    try:
        svg = _LUCIDE_SVG[kind].replace('currentColor', colour)
        drawing = svg2rlg(io.StringIO(svg))
        scale = size / drawing.width
        drawing.scale(scale, scale)
        drawing.drawOn(c, x, y)
        return True
    except Exception:
        return False


def _draw_lucide_icon(c, kind, x, y, size, colour):
    """Improved outline icon system - SVG first, fallback to refined vectors"""
    if _draw_lucide_svg(c, kind, x, y, size, colour):
        return

    # Refined fallback vectors - consistent 1.6pt stroke, optically centered
    c.saveState()
    c.setStrokeColor(colors.HexColor(colour))
    c.setFillColor(colors.HexColor(colour))
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    q = size / 24.0

    if kind == 'user':
        # Better proportioned user
        c.circle(x + 12 * q, y + 15.5 * q, 4.2 * q, stroke=1, fill=0)
        p = c.beginPath()
        p.moveTo(x + 5 * q, y + 4 * q)
        p.curveTo(x + 5 * q, y + 8 * q, x + 8 * q, y + 10 * q, x + 12 * q, y + 10 * q)
        p.curveTo(x + 16 * q, y + 10 * q, x + 19 * q, y + 8 * q, x + 19 * q, y + 4 * q)
        c.drawPath(p, stroke=1, fill=0)
    elif kind == 'wallet':
        c.roundRect(x + 2.5 * q, y + 6 * q, 18 * q, 12 * q, 2 * q, stroke=1, fill=0)
        c.roundRect(x + 13.5 * q, y + 9 * q, 7 * q, 5 * q, 1.2 * q, stroke=1, fill=0)
        c.circle(x + 16.5 * q, y + 11.5 * q, 0.9 * q, stroke=0, fill=1)
    elif kind == 'shield':
        p = c.beginPath()
        p.moveTo(x + 12 * q, y + 2.5 * q)
        p.lineTo(x + 20 * q, y + 6.5 * q)
        p.lineTo(x + 20 * q, y + 13.5 * q)
        p.curveTo(x + 20 * q, y + 18.5 * q, x + 16 * q, y + 21 * q, x + 12 * q, y + 22.5 * q)
        p.curveTo(x + 8 * q, y + 21 * q, x + 4 * q, y + 18.5 * q, x + 4 * q, y + 13.5 * q)
        p.lineTo(x + 4 * q, y + 6.5 * q)
        p.close()
        c.drawPath(p, stroke=1, fill=0)
        # checkmark
        c.setLineWidth(1.8)
        c.line(x + 8.5 * q, y + 12.5 * q, x + 11 * q, y + 15 * q)
        c.line(x + 11 * q, y + 15 * q, x + 16 * q, y + 10 * q)
    elif kind == 'document':
        c.roundRect(x + 5 * q, y + 2.5 * q, 14 * q, 19 * q, 1.8 * q, stroke=1, fill=0)
        c.line(x + 5 * q, y + 18 * q, x + 13 * q, y + 18 * q)
        c.line(x + 13 * q, y + 18 * q, x + 19 * q, y + 12 * q)
        c.line(x + 19 * q, y + 12 * q, x + 19 * q, y + 2.5 * q)
        c.line(x + 8 * q, y + 15 * q, x + 16 * q, y + 15 * q)
        c.line(x + 8 * q, y + 11 * q, x + 16 * q, y + 11 * q)
        c.line(x + 8 * q, y + 7 * q, x + 13 * q, y + 7 * q)
    elif kind == 'calendar':
        c.roundRect(x + 3 * q, y + 3.5 * q, 18 * q, 15 * q, 1.8 * q, stroke=1, fill=0)
        c.line(x + 3 * q, y + 13 * q, x + 21 * q, y + 13 * q)
        c.line(x + 7.5 * q, y + 20.5 * q, x + 7.5 * q, y + 15 * q)
        c.line(x + 16.5 * q, y + 20.5 * q, x + 16.5 * q, y + 15 * q)
    c.restoreState()


def _draw_icon_badge(c, kind, x, y, size, shape='square'):
    c.saveState()
    c.setFillColor(colors.HexColor('#eff6ff'))
    c.setStrokeColor(colors.HexColor('#bfdbfe'))
    c.setLineWidth(0.7)
    if shape == 'circle':
        c.circle(x + size / 2, y + size / 2, size / 2, stroke=1, fill=1)
    else:
        c.roundRect(x, y, size, size, 1.8 * mm, stroke=1, fill=1)
    c.restoreState()
    # Icon slightly larger and centered for better visual weight
    _draw_lucide_icon(c, kind, x + size * 0.18, y + size * 0.18, size * 0.64, '#0369a1')


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = A4
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # Color Palette
    PAGE_BG = '#f4f7fb'
    CARD_BG = '#ffffff'
    CARD_BORDER = '#dbe5f0'
    PRIMARY_BLUE = '#0265cb'
    DARK_NAVY = '#0b3a75'
    TEXT_MAIN = '#0f172a'
    SLATE_MUTED = '#64748b'
    GREEN_PILL_BG = '#edfbf2'
    GREEN_PILL_TEXT = '#0f7643'
    RED_PILL_BG = '#fff1f2'
    RED_PILL_TEXT = '#b91c1c'

    # Fill Page Background
    c.setFillColor(colors.HexColor(PAGE_BG))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    margin = 12 * mm
    content_w = W - 2 * margin

    # ----------------------------------------------------
    # Top Header Card with Wave Curve
    # ----------------------------------------------------
    header_top = H - 10 * mm
    header_h = 28 * mm
    header_y = header_top - header_h

    # White Header Card
    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, header_y, content_w, header_h, 3.5 * mm, stroke=1, fill=1)

    # Top-right swoosh/wave decoration inside header
    c.saveState()
    p_clip = c.beginPath()
    p_clip.roundRect(margin, header_y, content_w, header_h, 3.5 * mm)
    c.clipPath(p_clip, stroke=0)

    p1 = c.beginPath()
    p1.moveTo(W - margin - 45 * mm, header_top)
    p1.curveTo(W - margin - 35 * mm, header_y + 16 * mm, W - margin - 15 * mm, header_y + 8 * mm, W - margin, header_y + 12 * mm)
    p1.lineTo(W - margin, header_top)
    p1.close()
    c.setFillColor(colors.HexColor('#dbeafe'))
    c.drawPath(p1, stroke=0, fill=1)

    p2 = c.beginPath()
    p2.moveTo(W - margin - 25 * mm, header_top)
    p2.curveTo(W - margin - 18 * mm, header_y + 20 * mm, W - margin - 8 * mm, header_y + 18 * mm, W - margin, header_y + 20 * mm)
    p2.lineTo(W - margin, header_top)
    p2.close()
    c.setFillColor(colors.HexColor('#bfdbfe'))
    c.drawPath(p2, stroke=0, fill=1)
    c.restoreState()
    c.restoreState()

    # Left: Client Logo (dynamic, no hardcoded tagline)
    logo = getattr(client, 'logo', None)
    drawn_logo = False
    logo_w, logo_h = 38 * mm, 12 * mm
    logo_y = header_top - 6 * mm
    if logo and PILImage and getattr(logo, 'path', None) and Path(logo.path).exists():
        try:
            data = resized_logo_bytes(logo.path)
            if not data:
                raise ValueError('logo resize failed')
            with PILImage.open(io.BytesIO(data)) as im:
                iw, ih = im.size
            ratio = min(logo_w / iw, logo_h / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(ImageReader(io.BytesIO(data)), margin + 6 * mm, logo_y - lh, lw, lh, mask='auto')
            drawn_logo = True
            lh = lh
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'COMPANY').strip()
        c.setFont(_BOLD, 20)
        c.setFillColor(colors.HexColor('#007cc3'))
        c.drawString(margin + 6 * mm, logo_y - 8 * mm, client_name)
        lh = 10 * mm

    # Vertical Divider Line (only if we have logo or name)
    div_x = margin + 48 * mm
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.setLineWidth(0.7)
    c.line(div_x, header_y + 4 * mm, div_x, header_top - 4 * mm)

    # Address - dynamically from client.address, no hardcoded tagline
    address_lines = (client.address or '').splitlines()
    if not address_lines:
        address_lines = [client.address or '']
    c.setFont(_FONT, 7.8)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    # Show up to 2 lines of address
    if address_lines:
        c.drawString(div_x + 5 * mm, header_top - 12 * mm, address_lines[0][:50])
    if len(address_lines) > 1 and address_lines[1].strip():
        c.drawString(div_x + 5 * mm, header_top - 16.5 * mm, address_lines[1][:50])

    # Right: SALARY SLIP & Month Button
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    c.drawRightString(W - margin - 8 * mm, header_top - 7.5 * mm, "S A L A R Y   S L I P")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    btn_font_size = 8.2
    month_w = pdfmetrics.stringWidth(month_text, _BOLD, btn_font_size)
    btn_w = month_w + 16 * mm
    btn_h = 7.2 * mm
    btn_x = W - margin - btn_w - 6 * mm
    btn_y = header_top - 20 * mm

    c.saveState()
    c.setFillColor(colors.HexColor(PRIMARY_BLUE))
    c.roundRect(btn_x, btn_y, btn_w, btn_h, btn_h / 2, stroke=0, fill=1)
    c.restoreState()

    _draw_lucide_icon(c, 'calendar', btn_x + 3 * mm, btn_y + 1.6 * mm, 4 * mm, '#ffffff')
    c.setFont(_BOLD, btn_font_size)
    c.setFillColor(colors.white)
    c.drawString(btn_x + 8.5 * mm, btn_y + 2.2 * mm, month_text)

    # ----------------------------------------------------
    # Employee Details Card (3 Columns)
    # ----------------------------------------------------
    card1_top = header_y - 5 * mm
    card1_h = 72 * mm
    card1_y = card1_top - card1_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, card1_y, content_w, card1_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    _draw_icon_badge(c, 'user', margin + 6 * mm, card1_top - 11.5 * mm, 8 * mm, shape='circle')
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(margin + 17 * mm, card1_top - 7.8 * mm, "EMPLOYEE DETAILS")

    c.setStrokeColor(colors.HexColor('#e8edf4'))
    c.setLineWidth(0.6)
    c.line(margin + 6 * mm, card1_top - 14 * mm, margin + content_w - 6 * mm, card1_top - 14 * mm)

    col_w = (content_w - 12 * mm) / 3
    col1_x = margin + 6 * mm
    col2_x = col1_x + col_w
    col3_x = col2_x + col_w

    c.setStrokeColor(colors.HexColor('#f1f5f9'))
    c.line(col2_x - 3 * mm, card1_top - 16 * mm, col2_x - 3 * mm, card1_y + 6 * mm)
    c.line(col3_x - 3 * mm, card1_top - 16 * mm, col3_x - 3 * mm, card1_y + 6 * mm)

    grid_data = [
        (("EMPLOYEE CODE", employee.employee_code or '—'),
         ("EMPLOYEE NAME", employee.full_name or '—'),
         ("DESIGNATION", employee.position or '—')),
        (("DEPARTMENT", employee.department or '—'),
         ("PAN NUMBER", employee.pan_number or '—'),
         ("EMAIL", employee.email or '—')),
        (("DATE OF JOINING", str(employee.hire_date or '—')),
         ("CTC (ANNUAL)", str(ctc)),
         ("DAYS IN MONTH", _days(record.days_in_month))),
        (("WORKING DAYS", _days(record.actual_working_days)),
         ("PAID LEAVE", _leave(record.paid_leave_days)),
         ("LOP DAYS", _leave(record.lop_days))),
    ]

    r_y = card1_top - 20 * mm
    step_y = 12 * mm
    for (l1, v1), (l2, v2), (l3, v3) in grid_data:
        c.setFont(_BOLD, 6.5)
        c.setFillColor(colors.HexColor(SLATE_MUTED))
        c.drawString(col1_x, r_y, l1)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col1_x, r_y - 4.5 * mm, str(v1))

        c.setFont(_BOLD, 6.5)
        c.setFillColor(colors.HexColor(SLATE_MUTED))
        c.drawString(col2_x, r_y, l2)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col2_x, r_y - 4.5 * mm, str(v2))

        c.setFont(_BOLD, 6.5)
        c.setFillColor(colors.HexColor(SLATE_MUTED))
        c.drawString(col3_x, r_y, l3)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col3_x, r_y - 4.5 * mm, str(v3))

        r_y -= step_y

    # ----------------------------------------------------
    # Earnings & Deductions Tables
    # ----------------------------------------------------
    tables_top = card1_y - 5 * mm
    table_card_h = 88 * mm
    table_card_y = tables_top - table_card_h
    card_gap = 5 * mm
    table_w = (content_w - card_gap) / 2

    earn_x = margin
    ded_x = margin + table_w + card_gap

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(earn_x, table_card_y, table_w, table_card_h, 3.5 * mm, stroke=1, fill=1)
    c.roundRect(ded_x, table_card_y, table_w, table_card_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    _draw_icon_badge(c, 'wallet', earn_x + 6 * mm, tables_top - 10.5 * mm, 7.5 * mm, shape='square')
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(earn_x + 16 * mm, tables_top - 7.4 * mm, "EARNINGS")
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    c.drawRightString(earn_x + table_w - 6 * mm, tables_top - 7.4 * mm, "Amount (₹)")

    _draw_icon_badge(c, 'shield', ded_x + 6 * mm, tables_top - 10.5 * mm, 7.5 * mm, shape='square')
    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(DARK_NAVY))
    c.drawString(ded_x + 16 * mm, tables_top - 7.4 * mm, "DEDUCTIONS")
    c.setFont(_FONT, 7.5)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    c.drawRightString(ded_x + table_w - 6 * mm, tables_top - 7.4 * mm, "Amount (₹)")

    c.setStrokeColor(colors.HexColor('#e8edf4'))
    c.setLineWidth(0.6)
    c.line(earn_x + 6 * mm, tables_top - 13 * mm, earn_x + table_w - 6 * mm, tables_top - 13 * mm)
    c.line(ded_x + 6 * mm, tables_top - 13 * mm, ded_x + table_w - 6 * mm, tables_top - 13 * mm)

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

    row_h = 7.4 * mm
    curr_e_y = tables_top - 19 * mm
    for ename, evalue in earn_list:
        c.setFont(_FONT, 8.2)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(earn_x + 6 * mm, curr_e_y, ename)
        c.setFont(_BOLD, 8.2)
        c.drawRightString(earn_x + table_w - 6 * mm, curr_e_y, evalue)
        curr_e_y -= row_h

    curr_d_y = tables_top - 19 * mm
    for dname, dvalue in ded_list:
        c.setFont(_FONT, 8.2)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(ded_x + 6 * mm, curr_d_y, dname)
        c.setFont(_BOLD, 8.2)
        c.drawRightString(ded_x + table_w - 6 * mm, curr_d_y, dvalue)
        curr_d_y -= row_h

    gross_y = table_card_y + 18 * mm
    c.setStrokeColor(colors.HexColor('#e8edf4'))
    c.line(earn_x + 6 * mm, gross_y + 4.5 * mm, earn_x + table_w - 6 * mm, gross_y + 4.5 * mm)

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(earn_x + 6 * mm, gross_y, "Gross Salary")
    c.drawRightString(earn_x + table_w - 6 * mm, gross_y, _money(record.gross_salary) or '0.00')

    pill_w = table_w - 10 * mm
    pill_y = table_card_y + 5 * mm
    c.saveState()
    c.setFillColor(colors.HexColor(GREEN_PILL_BG))
    c.roundRect(earn_x + 5 * mm, pill_y, pill_w, 8 * mm, 2.5 * mm, stroke=0, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.2)
    c.setFillColor(colors.HexColor(GREEN_PILL_TEXT))
    c.drawString(earn_x + 8 * mm, pill_y + 2.5 * mm, "EARNED SALARY")
    c.drawRightString(earn_x + 5 * mm + pill_w - 4 * mm, pill_y + 2.5 * mm, _money(record.earned_salary) or '0.00')

    c.saveState()
    c.setFillColor(colors.HexColor(RED_PILL_BG))
    c.roundRect(ded_x + 5 * mm, pill_y, pill_w, 8 * mm, 2.5 * mm, stroke=0, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.2)
    c.setFillColor(colors.HexColor(RED_PILL_TEXT))
    c.drawString(ded_x + 8 * mm, pill_y + 2.5 * mm, "TOTAL DEDUCTIONS")
    c.drawRightString(ded_x + 5 * mm + pill_w - 4 * mm, pill_y + 2.5 * mm, _money(record.total_deductions) or '0.00')

    net_top = table_card_y - 5 * mm
    net_h = 26 * mm
    net_y = net_top - net_h

    c.saveState()
    c.setFillColor(colors.HexColor(PRIMARY_BLUE))
    c.roundRect(margin, net_y, content_w, net_h, 3.5 * mm, stroke=0, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor('#bfdbfe'))
    c.drawString(margin + 8 * mm, net_top - 8 * mm, "N E T   S A L A R Y   ( T A K E - H O M E )")

    c.setFont(_BOLD, 22)
    c.setFillColor(colors.white)
    c.drawString(margin + 8 * mm, net_y + 6 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    c.setFont(_BOLD, 46)
    c.setFillColor(colors.HexColor('#1d76dd'))
    c.drawRightString(W - margin - 8 * mm, net_y + 3.5 * mm, "₹")

    words_top = net_y - 5 * mm
    words_h = 16 * mm
    words_y = words_top - words_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, words_y, content_w, words_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    _draw_icon_badge(c, 'document', margin + 6 * mm, words_y + 3.5 * mm, 8 * mm, shape='square')

    c.setFont(_BOLD, 6.8)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    c.drawString(margin + 17 * mm, words_top - 5.5 * mm, "A M O U N T   I N   W O R D S")

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 17 * mm, words_y + 3.8 * mm, amount_in_words(record.net_salary))

    fy = 11 * mm
    _draw_lucide_icon(c, 'shield', margin, fy - 1 * mm, 4.2 * mm, PRIMARY_BLUE)
    c.setFont(_FONT, 7.2)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    disclaimer = "This is a system-generated, password-protected salary slip and does not require a signature."
    c.drawString(margin + 6 * mm, fy, disclaimer)

    disc_w = pdfmetrics.stringWidth(disclaimer, _FONT, 7.2)
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.setLineWidth(0.6)
    c.line(margin + 7 * mm + disc_w, fy + 1 * mm, W - margin, fy + 1 * mm)

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
    output = Path(media_root) / 'payslips_v5' / client_slug / str(record.batch.year) / month_folder
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