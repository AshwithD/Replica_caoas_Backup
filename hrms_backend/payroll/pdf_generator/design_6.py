"""Design 6: Bohemian Contemporary / Warm Earthy - Reference Perfect Match.

Faithful to reference fields and model attributes:
PayslipRecord, Employee, Batch, Client, and EmployeeSalaryStructure.

Matches reference image exactly:
- Beige header with diagonal lines, terracotta arc, olive blob, dark green organic shape
- Employee details with sage icon tiles and row separators
- Earnings: mint header, dotted separators, Gross light mint, Earned dark green
- Deductions: peach header, Total light pink
- Net Salary: lavender with dot matrix, purple rupee badge, banknote+hand illustration
- Footer: blue-gray with lock badge and dot matrix
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


# --- Lucide SVG Icons ---
_LUCIDE_SVG = {
    'id': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>',
    'person': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
    'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
    'building': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 8h4"/><path d="M10 12h4"/></svg>',
    'card': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
    'mail': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
    'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
    'rupee': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>',
    'calendar-days': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/><path d="M16 17h.01"/></svg>',
    'clock': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="M16.13 7.13 19 10"/><path d="M18 21v-3a2 2 0 0 0-4 0v3"/></svg>',
    'plane': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    'calendar-minus': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18h6"/><path d="M16 2v3"/><path d="M21 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3"/><path d="M3 9h18"/><path d="M8 2v3"/></svg>',
    'calendar-check': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
    'calendar-x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m14 14 4 4"/><path d="m18 14-4 4"/></svg>',
    'briefcase-check': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    'calendar-heart': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 17.5a2.5 2.5 0 0 0 3.2-2.3c0-1.4-1.8-2.4-3.2-3-1.4.6-3.2 1.6-3.2 3a2.5 2.5 0 0 0 3.2 2.3Z"/></svg>',
    'palmtree': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l2.5-2.5 2.5 2.5H11z"/><path d="M13 7.5a5.5 5.5 0 0 1 5.5 5.5c0 1.6-.5 3-1.3 4"/><path d="M15 12a5 5 0 0 0-5 5v4h4v-4a5 5 0 0 1 5-5h-4Z"/></svg>',
    'beach': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10V3"/><path d="M12 10a5 5 0 0 1 5 5c0 1.5-.5 2.5-1.5 3.5a5 5 0 0 1-3.5 1.5a5 5 0 0 1-3.5-1.5C7.5 17.5 7 16.5 7 15a5 5 0 0 1 5-5Z"/><path d="M2 21h20"/></svg>',
    'sun': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    'umbrella': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-9.95 9h11.64L9.74 7.05a10 10 0 0 0 2.26 0L8.05 11H19.95A10 10 0 0 0 12 2Z"/><path d="M12 22a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Z"/></svg>',
    'wallet': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    'shield': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'map-pin': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    'shield-lock': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9.807V6a1 1 0 00-1-1c-2 0-4.49-1.19-6.24-2.72a1.17 1.17 0 00-1.52 0C9.5 3.8 7 5 5 5a1 1 0 00-1 1v7c0 3.88 2.107 6.254 5 7.796"/><path d="M19 17v-2a2 2 0 00-4 0v2"/><rect x="13" y="17" width="8" height="5" rx="1"/></svg>',
    'banknote': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
}

try:
    from svglib.svglib import svg2rlg
except Exception:
    svg2rlg = None


def _draw_lucide_svg(c, kind, x, y, size, colour):
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


def _draw_icon(c, kind, x, y, size, colour):
    if _draw_lucide_svg(c, kind, x, y, size, colour):
        return
    c.saveState()
    c.setStrokeColor(colors.HexColor(colour))
    c.setLineWidth(1.3)
    c.setLineCap(1)
    c.setLineJoin(1)
    q = size / 20.0
    c.circle(x + 10 * q, y + 10 * q, 6 * q, stroke=1, fill=0)
    c.restoreState()


def _draw_dot_matrix(c, x, y, cols, rows, spacing=2.3 * mm, color='#c5bede', dot_size=0.38 * mm):
    c.saveState()
    c.setFillColor(colors.HexColor(color))
    for r in range(rows):
        for col in range(cols):
            c.circle(x + col * spacing, y + r * spacing, dot_size, stroke=0, fill=1)
    c.restoreState()


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    W, H = A4
    c = canvas.Canvas(buf, pagesize=A4, encrypt=encryption)

    PAGE_BG = '#fcf8f3'
    FOREST_GREEN = '#2d4a3e'
    FOREST_DARK = '#1e3a2f'
    TERRACOTTA = '#b85c3a'
    WARM_OLIVE = '#c19a6b'
    BEIGE_HEADER = '#fdf6e8'
    CARD_BG = '#ffffff'
    CARD_HEADER_BG = '#f8f5ee'
    CARD_BORDER = '#e8e0d0'
    SAGE_TILE_BG = '#e8efe6'
    SAGE_TILE_BORDER = '#c8d8c5'
    TEXT_MAIN = '#2d3748'
    SLATE_MUTED = '#718096'
    ROW_LINE = '#edf2f7'

    LAVENDER_BG = '#ede8f8'
    LAVENDER_BORDER = '#d6cceb'
    VIOLET_TEXT = '#3c2d6b'
    VIOLET_BADGE = '#5b4a9e'
    AMBER_BG = '#fef6e0'
    AMBER_BADGE = '#f0b429'
    AMBER_TEXT = '#975a16'

    c.setFillColor(colors.HexColor(PAGE_BG))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    margin = 11 * mm
    content_w = W - 2 * margin

    # ===== HEADER: Reverted to previous organic forest green style =====
    # Top-right deep forest green organic curved shape
    c.saveState()
    p_green = c.beginPath()
    p_green.moveTo(W - 78 * mm, H)
    p_green.curveTo(W - 75 * mm, H - 18 * mm, W - 65 * mm, H - 35 * mm, W - 40 * mm, H - 35 * mm)
    p_green.lineTo(W, H - 35 * mm)
    p_green.lineTo(W, H)
    p_green.close()
    c.setFillColor(colors.HexColor(FOREST_GREEN))
    c.drawPath(p_green, stroke=0, fill=1)

    c.setFont(_BOLD, 12)
    c.setFillColor(colors.white)
    c.drawRightString(W - 12 * mm, H - 16 * mm, "SALARY SLIP")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#d8c8b4'))
    c.drawRightString(W - 12 * mm, H - 23 * mm, month_text)

    c.setStrokeColor(colors.HexColor('#d8c8b4'))
    c.setLineWidth(1.2)
    c.line(W - 32 * mm, H - 26 * mm, W - 12 * mm, H - 26 * mm)
    c.restoreState()

    # Top-left terracotta arc + concentric lines + olive blob (previous design)
    c.saveState()
    c.setFillColor(colors.HexColor(TERRACOTTA))
    c.circle(0, H - 38 * mm, 12 * mm, stroke=0, fill=1)
    c.setStrokeColor(colors.HexColor('#d6c9b3'))
    c.setLineWidth(0.8)
    c.circle(-4 * mm, H - 10 * mm, 20 * mm, stroke=1, fill=0)
    c.circle(-4 * mm, H - 10 * mm, 26 * mm, stroke=1, fill=0)
    c.setFillColor(colors.HexColor(WARM_OLIVE))
    c.circle(W * 0.56, H - 4 * mm, 13 * mm, stroke=0, fill=1)
    c.restoreState()

    # Logo and company info
    logo_y = H - 21 * mm
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
            ratio = min(34 * mm / iw, 12 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(ImageReader(io.BytesIO(data)), 14 * mm, logo_y - lh + 3 * mm, lw, lh, mask='auto')
            drawn_logo = True
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'COMPANY').strip()
        c.setFont(_BOLD, 20)
        c.setFillColor(colors.HexColor('#2d6a4f'))
        c.drawString(14 * mm, logo_y - 2 * mm, client_name)

    div_x = 62 * mm
    c.setStrokeColor(colors.HexColor('#e2d5c0'))
    c.setLineWidth(0.6)
    c.line(div_x, logo_y - 10 * mm, div_x, logo_y + 6 * mm)

    c.setFont(_BOLD, 9.5)
    c.setFillColor(colors.HexColor('#5a4a3a'))
    c.drawString(div_x + 6 * mm, logo_y + 2 * mm, (client.name or 'INFOSYS').upper())

    _draw_icon(c, 'map-pin', div_x + 5.5 * mm, logo_y - 6.5 * mm, 3.8 * mm, '#5a4a3a')
    address_line = (client.address or 'Banashankari, Bangalore').splitlines()[0]
    c.setFont(_FONT, 7.8)
    c.setFillColor(colors.HexColor('#6b5a4a'))
    c.drawString(div_x + 10 * mm, logo_y - 5.5 * mm, address_line)

    # ===== EMPLOYEE DETAILS CARD =====
    card1_top = H - 42 * mm
    card1_h = 78 * mm
    card1_y = card1_top - card1_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.7)
    c.roundRect(margin, card1_y, content_w, card1_h, 4 * mm, stroke=1, fill=1)

    # Header background
    c.setFillColor(colors.HexColor(CARD_HEADER_BG))
    c.roundRect(margin, card1_top - 12 * mm, content_w, 12 * mm, 4 * mm, stroke=0, fill=1)
    c.rect(margin, card1_top - 12 * mm, content_w, 6 * mm, stroke=0, fill=1)
    c.restoreState()

    # Header icon
    c.saveState()
    c.setFillColor(colors.HexColor('#6b5f4a'))
    c.circle(margin + 9 * mm, card1_top - 6 * mm, 4.2 * mm, stroke=0, fill=1)
    _draw_icon(c, 'person', margin + 6.5 * mm, card1_top - 8.5 * mm, 5 * mm, '#ffffff')
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#5a4f3a'))
    c.drawString(margin + 16 * mm, card1_top - 7.2 * mm, "EMPLOYEE DETAILS")

    half_w = (content_w - 1 * mm) / 2
    col1_x = margin + 5 * mm
    col2_x = margin + half_w + 4 * mm

    details_list = [
        (('id', 'Employee Code', employee.employee_code or '—'),
         ('person', 'Employee Name', employee.full_name or '—')),
        (('briefcase', 'Designation', employee.position or '—'),
         ('building', 'Department', employee.department or '—')),
        (('card', 'PAN Number', employee.pan_number or '—'),
         ('mail', 'Email', employee.email or '—')),
        (('calendar', 'Date of Joining', str(employee.hire_date or '—')),
         ('rupee', 'CTC (Annual)', str(ctc))),
        (('calendar-days', 'Days in Month', _days(record.days_in_month)),
         ('calendar-check', 'Working Days', _days(record.actual_working_days))),
        (('plane', 'Paid Leave', _leave(record.paid_leave_days)),
         ('calendar-x', 'LOP Days', _leave(record.lop_days))),
    ]

    r_y = card1_top - 19 * mm
    step_y = 9.5 * mm

    for (i1, l1, v1), (i2, l2, v2) in details_list:
        # Vertical divider between columns (full height of details)
        if r_y == card1_top - 19 * mm:
            c.setStrokeColor(colors.HexColor(ROW_LINE))
            c.setLineWidth(0.5)
            c.line(margin + half_w, card1_top - 14 * mm, margin + half_w, card1_y + 3 * mm)

        # Horizontal separator
        c.setStrokeColor(colors.HexColor(ROW_LINE))
        c.setLineWidth(0.4)
        c.line(col1_x, r_y - 3.2 * mm, col1_x + half_w - 8 * mm, r_y - 3.2 * mm)
        c.line(col2_x, r_y - 3.2 * mm, col2_x + half_w - 8 * mm, r_y - 3.2 * mm)

        # Col1
        c.saveState()
        c.setFillColor(colors.HexColor(SAGE_TILE_BG))
        c.setStrokeColor(colors.HexColor(SAGE_TILE_BORDER))
        c.setLineWidth(0.5)
        c.roundRect(col1_x, r_y - 1.2 * mm, 5.2 * mm, 5.2 * mm, 1.1 * mm, stroke=1, fill=1)
        c.restoreState()
        _draw_icon(c, i1, col1_x + 0.5 * mm, r_y - 0.6 * mm, 4.2 * mm, '#2f4a3a')

        c.setFont(_FONT, 7.5)
        c.setFillColor(colors.HexColor('#4a5568'))
        c.drawString(col1_x + 8.5 * mm, r_y, l1)
        c.setFont(_BOLD, 7.8)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col1_x + 34 * mm, r_y, str(v1)[:22])

        # Col2
        c.saveState()
        c.setFillColor(colors.HexColor(SAGE_TILE_BG))
        c.setStrokeColor(colors.HexColor(SAGE_TILE_BORDER))
        c.setLineWidth(0.5)
        c.roundRect(col2_x, r_y - 1.2 * mm, 5.2 * mm, 5.2 * mm, 1.1 * mm, stroke=1, fill=1)
        c.restoreState()
        _draw_icon(c, i2, col2_x + 0.5 * mm, r_y - 0.6 * mm, 4.2 * mm, '#2f4a3a')

        c.setFont(_FONT, 7.5)
        c.setFillColor(colors.HexColor('#4a5568'))
        c.drawString(col2_x + 8.5 * mm, r_y, l2)
        c.setFont(_BOLD, 7.8)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col2_x + 34 * mm, r_y, str(v2)[:22])

        r_y -= step_y

    # ===== EARNINGS & DEDUCTIONS - DYNAMIC HEIGHT TO AVOID EMPTY SPACE =====
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

    row_h = 7.2 * mm
    max_rows = max(len(earn_list), len(ded_list), 1)
    # Dynamic height: header 11mm + rows + gross 8mm + pill 9mm + padding 6mm
    table_h = 11 * mm + max_rows * row_h + 18 * mm
    tables_top = card1_y - 5 * mm
    table_y = tables_top - table_h
    card_gap = 4 * mm
    table_w = (content_w - card_gap) / 2

    earn_x = margin
    ded_x = margin + table_w + card_gap

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor('#e2d5c0'))
    c.setLineWidth(0.6)
    c.roundRect(earn_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)
    c.roundRect(ded_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    # Earnings header - mint
    c.saveState()
    c.setFillColor(colors.HexColor('#eef6ef'))
    c.roundRect(earn_x, tables_top - 11 * mm, table_w, 11 * mm, 3.5 * mm, stroke=0, fill=1)
    c.rect(earn_x, tables_top - 11 * mm, table_w, 5 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor('#2d5a4a'))
    c.circle(earn_x + 8 * mm, tables_top - 5.5 * mm, 4.5 * mm, stroke=0, fill=1)
    _draw_icon(c, 'wallet', earn_x + 5.5 * mm, tables_top - 8 * mm, 5 * mm, '#ffffff')
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#2d5a4a'))
    c.drawString(earn_x + 15 * mm, tables_top - 6.8 * mm, "EARNINGS")
    c.setFont(_BOLD, 7.0)
    c.setFillColor(colors.HexColor('#5a7a6a'))
    c.drawRightString(earn_x + table_w - 5 * mm, tables_top - 6.8 * mm, "Amount (₹)")

    c.setStrokeColor(colors.HexColor('#d6e8d6'))
    c.setLineWidth(0.5)
    c.line(earn_x, tables_top - 11 * mm, earn_x + table_w, tables_top - 11 * mm)

    # Deductions header - peach
    c.saveState()
    c.setFillColor(colors.HexColor('#fdf0e8'))
    c.roundRect(ded_x, tables_top - 11 * mm, table_w, 11 * mm, 3.5 * mm, stroke=0, fill=1)
    c.rect(ded_x, tables_top - 11 * mm, table_w, 5 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor(TERRACOTTA))
    c.circle(ded_x + 8 * mm, tables_top - 5.5 * mm, 4.5 * mm, stroke=0, fill=1)
    _draw_icon(c, 'shield', ded_x + 5.5 * mm, tables_top - 8 * mm, 5 * mm, '#ffffff')
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#8a4a2f'))
    c.drawString(ded_x + 15 * mm, tables_top - 6.8 * mm, "DEDUCTIONS")
    c.setFont(_BOLD, 7.0)
    c.setFillColor(colors.HexColor('#a86a4a'))
    c.drawRightString(ded_x + table_w - 5 * mm, tables_top - 6.8 * mm, "Amount (₹)")

    c.setStrokeColor(colors.HexColor('#f0d5c5'))
    c.setLineWidth(0.5)
    c.line(ded_x, tables_top - 11 * mm, ded_x + table_w, tables_top - 11 * mm)

    curr_e_y = tables_top - 17 * mm
    for idx, (ename, evalue) in enumerate(earn_list):
        if idx > 0:
            c.setStrokeColor(colors.HexColor('#e8e8e8'))
            c.setDash(1, 1.5)
            c.setLineWidth(0.3)
            c.line(earn_x + 4 * mm, curr_e_y + 4.2 * mm, earn_x + table_w - 4 * mm, curr_e_y + 4.2 * mm)
            c.setDash()
        c.setFont(_FONT, 7.8)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(earn_x + 5 * mm, curr_e_y, ename)
        c.setFont(_BOLD, 7.8)
        c.drawRightString(earn_x + table_w - 5 * mm, curr_e_y, evalue)
        curr_e_y -= row_h

    curr_d_y = tables_top - 17 * mm
    for idx, (dname, dvalue) in enumerate(ded_list):
        if idx > 0:
            c.setStrokeColor(colors.HexColor('#e8e8e8'))
            c.setDash(1, 1.5)
            c.setLineWidth(0.3)
            c.line(ded_x + 4 * mm, curr_d_y + 4.2 * mm, ded_x + table_w - 4 * mm, curr_d_y + 4.2 * mm)
            c.setDash()
        c.setFont(_FONT, 7.8)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(ded_x + 5 * mm, curr_d_y, dname)
        c.setFont(_BOLD, 7.8)
        c.drawRightString(ded_x + table_w - 5 * mm, curr_d_y, dvalue)
        curr_d_y -= row_h

    # Gross Salary - light mint background - PLACED DIRECTLY ABOVE Earned Salary as per reference
    pill_h = 9 * mm
    pill_y = table_y
    gross_h = 8 * mm
    gross_y = pill_y + pill_h + 0.5 * mm  # directly above pill, no empty gap
    c.saveState()
    c.setFillColor(colors.HexColor('#e6f0e8'))
    c.setStrokeColor(colors.HexColor('#c8d8c5'))
    c.setLineWidth(0.4)
    c.rect(earn_x, gross_y, table_w, gross_h, stroke=1, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 8.0)
    c.setFillColor(colors.HexColor('#2d5a4a'))
    c.drawString(earn_x + 5 * mm, gross_y + 2.5 * mm, "GROSS SALARY")
    c.drawRightString(earn_x + table_w - 5 * mm, gross_y + 2.5 * mm, _money(record.gross_salary) or '0.00')

    # Earned & Total same row - as per earlier fix
    pill_w = table_w

    # Earned - dark green
    c.saveState()
    c.setFillColor(colors.HexColor('#5a8a72'))
    c.roundRect(earn_x, pill_y, pill_w, pill_h, 3.5 * mm, stroke=0, fill=1)
    c.rect(earn_x, pill_y + 3.5 * mm, pill_w, 3.5 * mm, stroke=0, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 8.0)
    c.setFillColor(colors.white)
    c.drawString(earn_x + 5 * mm, pill_y + 3 * mm, "EARNED SALARY")
    c.setFont(_BOLD, 9.5)
    c.drawRightString(earn_x + table_w - 5 * mm, pill_y + 3 * mm, _money(record.earned_salary) or '0.00')

    # Total Deductions - light pink
    c.saveState()
    c.setFillColor(colors.HexColor('#f9d5c8'))
    c.roundRect(ded_x, pill_y, pill_w, pill_h, 3.5 * mm, stroke=0, fill=1)
    c.rect(ded_x, pill_y + 3.5 * mm, pill_w, 3.5 * mm, stroke=0, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor('#8a2a2a'))
    c.drawString(ded_x + 5 * mm, pill_y + 3 * mm, "TOTAL DEDUCTIONS")
    c.setFont(_BOLD, 9.5)
    c.setFillColor(colors.HexColor('#a82a2a'))
    c.drawRightString(ded_x + table_w - 5 * mm, pill_y + 3 * mm, _money(record.total_deductions) or '0.00')

    # ===== NET SALARY - Lavender with improved design =====
    net_top = table_y - 5 * mm
    net_h = 24 * mm
    net_y = net_top - net_h

    c.saveState()
    c.setFillColor(colors.HexColor(LAVENDER_BG))
    c.roundRect(margin, net_y, content_w, net_h, 4 * mm, stroke=0, fill=1)

    # Dot matrix left - 3 cols x 7 rows, light purple - improved spacing
    _draw_dot_matrix(c, margin + 3.5 * mm, net_y + 2.5 * mm, 3, 8, spacing=2.1 * mm, color='#c4b5e3', dot_size=0.38 * mm)

    # Purple rupee badge - FIXED: properly centered rupee icon inside circle
    badge_x = margin + 13 * mm
    badge_center_x = badge_x + 6 * mm
    badge_center_y = net_y + net_h / 2
    # Shadow
    c.setFillColor(colors.HexColor('#c9bfe6'))
    c.circle(badge_center_x + 0.7 * mm, badge_center_y - 0.7 * mm, 6.2 * mm, stroke=0, fill=1)
    # Main badge
    c.setFillColor(colors.HexColor(VIOLET_BADGE))
    c.circle(badge_center_x, badge_center_y, 6.2 * mm, stroke=0, fill=1)
    # Rupee icon - properly centered using SVG
    _draw_icon(c, 'rupee', badge_center_x - 3.1 * mm, badge_center_y - 3.1 * mm, 6.2 * mm, '#ffffff')

    # Vertical divider
    c.setStrokeColor(colors.HexColor('#d6cceb'))
    c.setLineWidth(0.6)
    c.line(badge_x + 15 * mm, net_y + 3 * mm, badge_x + 15 * mm, net_top - 3 * mm)

    c.setFont(_BOLD, 7.0)
    c.setFillColor(colors.HexColor('#6b5a9a'))
    c.drawString(badge_x + 19 * mm, net_top - 7.5 * mm, "NET SALARY (TAKE-HOME)")

    c.setFont(_BOLD, 23)
    c.setFillColor(colors.HexColor(VIOLET_TEXT))
    c.drawString(badge_x + 19 * mm, net_y + 4.5 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    # Right illustration removed per user request - clean minimal lavender card
    # No blob, no banknote - just dot matrix, rupee badge, and text

    # ===== AMOUNT IN WORDS - IMPROVED DESIGN =====
    words_top = net_y - 4 * mm
    words_h = 15 * mm
    words_y = words_top - words_h

    c.saveState()
    # Light beige background with subtle border
    c.setFillColor(colors.HexColor('#fef9ec'))
    c.setStrokeColor(colors.HexColor('#f3e8c8'))
    c.setLineWidth(0.6)
    c.roundRect(margin, words_y, content_w, words_h, 3.5 * mm, stroke=1, fill=1)

    # Amber badge - improved with proper centering
    amt_badge_cx = margin + 10 * mm
    amt_badge_cy = words_y + words_h / 2
    # Shadow
    c.setFillColor(colors.HexColor('#fde68a'))
    c.circle(amt_badge_cx + 0.5 * mm, amt_badge_cy - 0.5 * mm, 5.2 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor(AMBER_BADGE))
    c.circle(amt_badge_cx, amt_badge_cy, 5.2 * mm, stroke=0, fill=1)
    _draw_icon(c, 'rupee', amt_badge_cx - 2.6 * mm, amt_badge_cy - 2.6 * mm, 5.2 * mm, '#ffffff')

    # Vertical divider
    c.setStrokeColor(colors.HexColor('#f3e8c8'))
    c.setLineWidth(0.6)
    c.line(margin + 19 * mm, words_y + 2.5 * mm, margin + 19 * mm, words_top - 2.5 * mm)

    c.setFont(_BOLD, 6.5)
    c.setFillColor(colors.HexColor(AMBER_TEXT))
    c.drawString(margin + 23 * mm, words_top - 5 * mm, "AMOUNT IN WORDS")

    c.setFont(_BOLD, 8.4)
    c.setFillColor(colors.HexColor('#1e293b'))
    # Wrap text if too long
    words_text = amount_in_words(record.net_salary)
    c.drawString(margin + 23 * mm, words_y + 3.5 * mm, words_text)
    c.restoreState()

    # ===== FOOTER - Improved note design =====
    fy = 10 * mm
    c.saveState()
    c.setFillColor(colors.HexColor('#eef2f8'))
    c.roundRect(margin, fy - 1 * mm, content_w, 11 * mm, 3 * mm, stroke=0, fill=1)

    # Lock badge - blue circle with lock icon
    c.setFillColor(colors.HexColor('#dbeafe'))
    c.setStrokeColor(colors.HexColor('#93c5fd'))
    c.setLineWidth(0.5)
    c.circle(margin + 8 * mm, fy + 4.5 * mm, 5 * mm, stroke=1, fill=1)
    _draw_icon(c, 'shield-lock', margin + 5 * mm, fy + 1.5 * mm, 6 * mm, '#2563eb')

    # Vertical divider
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.setLineWidth(0.5)
    c.line(margin + 16 * mm, fy + 0.5 * mm, margin + 16 * mm, fy + 8.5 * mm)

    c.setFont(_FONT, 6.8)
    c.setFillColor(colors.HexColor('#475569'))
    c.drawString(margin + 20 * mm, fy + 5.5 * mm, "This is a system-generated, password-protected salary slip")
    c.drawString(margin + 20 * mm, fy + 2.0 * mm, "and does not require a signature.")

    # Dot matrix right
    _draw_dot_matrix(c, W - margin - 20 * mm, fy + 1 * mm, 5, 3, spacing=2.2 * mm, color='#a3b4cc', dot_size=0.35 * mm)
    c.restoreState()

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
    output = Path(media_root) / 'payslips_v6' / client_slug / str(record.batch.year) / month_folder
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