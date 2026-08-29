"""Design 8: Minimalist Monochrome / High-Contrast Executive - Reference Exact Match Except Icons.

Faithful to reference fields and model attributes:
PayslipRecord, Employee, Batch, Client, and EmployeeSalaryStructure.

Layout exactly same as reference image, only icons improved to crisp Lucide SVG (same as Design 6/7).
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


# --- Lucide SVG Icons - SAME AS DESIGN 6/7 for consistency, crisp ---
_LUCIDE_SVG = {
    'id': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>',
    'person': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
    'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
    'building': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 8h4"/><path d="M10 12h4"/></svg>',
    'card': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
    'mail': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
    'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
    'rupee': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>',
    'rupee-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M9 16c2 0 4-1 4-3s-2-3-4-3"/><path d="m9 16 5 4"/></svg>',
    'calendar-days': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/><path d="M16 17h.01"/></svg>',
    'clock': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="M16.13 7.13 19 10"/><path d="M18 21v-3a2 2 0 0 0-4 0v3"/></svg>',
    'plane': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    'calendar-minus': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18h6"/><path d="M16 2v3"/><path d="M21 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3"/><path d="M3 9h18"/><path d="M8 2v3"/></svg>',
    'calendar-check': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
    'calendar-x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m14 14 4 4"/><path d="m18 14-4 4"/></svg>',
    'wallet': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    'shield': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'map-pin': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    'lock': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
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


def _draw_icon(c, kind, x, y, size, colour='#000000'):
    if _draw_lucide_svg(c, kind, x, y, size, colour):
        return
    # Fallback old drawing
    c.saveState()
    c.setStrokeColor(colors.HexColor(colour))
    c.setFillColor(colors.HexColor(colour))
    c.setLineWidth(1.0)
    c.setLineCap(1)
    c.setLineJoin(1)
    q = size / 20.0
    if kind == 'id':
        c.roundRect(x + 3 * q, y + 3 * q, 14 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.circle(x + 10 * q, y + 12 * q, 2.2 * q, stroke=1, fill=0)
        c.arc(x + 6 * q, y + 5 * q, x + 14 * q, y + 11 * q, 0, 180)
    elif kind == 'person':
        c.circle(x + 10 * q, y + 13.5 * q, 3.2 * q, stroke=1, fill=0)
        c.arc(x + 4 * q, y + 2 * q, x + 16 * q, y + 11 * q, 0, 180)
    elif kind == 'briefcase':
        c.roundRect(x + 2 * q, y + 4 * q, 16 * q, 11 * q, 1.5 * q, stroke=1, fill=0)
        c.roundRect(x + 6.5 * q, y + 15 * q, 7 * q, 3 * q, 1 * q, stroke=1, fill=0)
        c.line(x + 2 * q, y + 9 * q, x + 18 * q, y + 9 * q)
    elif kind == 'building':
        c.roundRect(x + 3 * q, y + 2 * q, 14 * q, 16 * q, 1 * q, stroke=1, fill=0)
        c.line(x + 6 * q, y + 14 * q, x + 8 * q, y + 14 * q)
        c.line(x + 12 * q, y + 14 * q, x + 14 * q, y + 14 * q)
        c.line(x + 6 * q, y + 10 * q, x + 8 * q, y + 10 * q)
        c.line(x + 12 * q, y + 10 * q, x + 14 * q, y + 10 * q)
        c.line(x + 8.5 * q, y + 2 * q, x + 11.5 * q, y + 2 * q)
    elif kind == 'card':
        c.roundRect(x + 2 * q, y + 4 * q, 16 * q, 12 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 2 * q, y + 11 * q, x + 18 * q, y + 11 * q)
        c.rect(x + 4 * q, y + 6 * q, 4 * q, 2.5 * q, stroke=0, fill=1)
    elif kind == 'mail':
        c.roundRect(x + 2 * q, y + 4 * q, 16 * q, 12 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 2 * q, y + 15 * q, x + 10 * q, y + 9.5 * q)
        c.line(x + 18 * q, y + 15 * q, x + 10 * q, y + 9.5 * q)
    elif kind == 'calendar':
        c.roundRect(x + 3 * q, y + 3 * q, 14 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 3 * q, y + 12 * q, x + 17 * q, y + 12 * q)
        c.line(x + 6.5 * q, y + 17 * q, x + 6.5 * q, y + 15 * q)
        c.line(x + 13.5 * q, y + 17 * q, x + 13.5 * q, y + 15 * q)
    elif kind == 'rupee-circle':
        c.circle(x + 10 * q, y + 10 * q, 7 * q, stroke=1, fill=0)
        c.setFont(_BOLD, size * 0.55)
        c.drawCentredString(x + 10 * q, y + 7 * q, '₹')
    elif kind == 'clock':
        c.circle(x + 10 * q, y + 10 * q, 7 * q, stroke=1, fill=0)
        c.line(x + 10 * q, y + 10 * q, x + 10 * q, y + 14.5 * q)
        c.line(x + 10 * q, y + 10 * q, x + 13.5 * q, y + 10 * q)
    elif kind == 'calendar-days':
        c.roundRect(x + 3 * q, y + 3 * q, 14 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 3 * q, y + 12 * q, x + 17 * q, y + 12 * q)
        c.line(x + 6.5 * q, y + 17 * q, x + 6.5 * q, y + 15 * q)
        c.line(x + 13.5 * q, y + 17 * q, x + 13.5 * q, y + 15 * q)
        c.circle(x + 7 * q, y + 8 * q, 0.8 * q, stroke=0, fill=1)
        c.circle(x + 13 * q, y + 8 * q, 0.8 * q, stroke=0, fill=1)
        c.circle(x + 10 * q, y + 5.5 * q, 0.8 * q, stroke=0, fill=1)
    elif kind == 'lock':
        c.roundRect(x + 3.5 * q, y + 2 * q, 13 * q, 10 * q, 1.5 * q, stroke=1, fill=0)
        p = c.beginPath()
        p.arc(x + 5.5 * q, y + 10 * q, x + 14.5 * q, y + 18 * q, 0, 180)
        c.drawPath(p, stroke=1, fill=0)
        c.circle(x + 10 * q, y + 7 * q, 1.2 * q, stroke=0, fill=1)
        c.rect(x + 9.5 * q, y + 4.5 * q, 1 * q, 2.5 * q, stroke=0, fill=1)
    c.restoreState()


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = A4
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # Color Palette: Clean Monochrome - EXACTLY as reference
    BORDER_COLOR = '#000000'
    TEXT_MAIN = '#000000'
    TEXT_MUTED = '#4b5563'
    CARD_BG = '#ffffff'

    margin = 14 * mm
    content_w = W - 2 * margin

    # ----------------------------------------------------
    # Header: Logo (left) & Salary Slip + Month Pill (right) - EXACT reference
    # ----------------------------------------------------
    header_top = H - 12 * mm
    logo_y = header_top - 4 * mm

    logo = getattr(client, 'logo', None)
    drawn_logo = False
    if logo and PILImage and getattr(logo, 'path', None) and Path(logo.path).exists():
        try:
            with PILImage.open(logo.path) as im:
                iw, ih = im.size
            ratio = min(42 * mm / iw, 14 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(logo.path, margin, logo_y - lh, lw, lh, mask='auto')
            drawn_logo = True
            logo_bottom = logo_y - lh
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'INFOSYS').strip()
        c.setFont(_BOLD, 22)
        c.setFillColor(colors.HexColor('#007cc3'))
        c.drawString(margin, logo_y - 8 * mm, client_name)
        logo_bottom = logo_y - 12 * mm

    address_line = (client.address or 'BANASHANKARI, BANGALORE').splitlines()[0].upper()
    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin, logo_bottom - 4.5 * mm, address_line)

    c.setFont(_BOLD, 8)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawRightString(W - margin, header_top - 5 * mm, "S A L A R Y   S L I P")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    pill_font_size = 9
    month_w = pdfmetrics.stringWidth(month_text, _BOLD, pill_font_size)
    pill_w = month_w + 14 * mm
    pill_h = 7.5 * mm
    pill_x = W - margin - pill_w
    pill_y = header_top - 18 * mm

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(pill_x, pill_y, pill_w, pill_h, pill_h / 2, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, pill_font_size)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawCentredString(pill_x + pill_w / 2, pill_y + 2.4 * mm, month_text)

    # ----------------------------------------------------
    # Employee Details Card - EXACT reference layout
    # ----------------------------------------------------
    card1_top = header_top - 24 * mm
    card1_h = 80 * mm
    card1_y = card1_top - card1_h

    c.saveState()
    c.setFillColor(colors.HexColor(CARD_BG))
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(margin, card1_y, content_w, card1_h, 3.5 * mm, stroke=1, fill=1)

    badge_w = 44 * mm
    badge_h = 6.8 * mm
    badge_x = margin + 5 * mm
    badge_y = card1_top - 12 * mm
    c.setFillColor(colors.HexColor(BORDER_COLOR))
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 2.5 * mm, stroke=0, fill=1)
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.white)
    c.drawCentredString(badge_x + badge_w / 2, badge_y + 2.2 * mm, "EMPLOYEE DETAILS")
    c.restoreState()

    half_w = (content_w - 20 * mm) / 2
    col1_x = margin + 10 * mm
    col2_x = col1_x + half_w + 6 * mm

    # Using SAME icons as other files for consistency, but layout exact as reference
    details_list = [
        (('id', 'EMPLOYEE CODE', employee.employee_code or '—'),
         ('person', 'EMPLOYEE NAME', employee.full_name or '—')),
        (('briefcase', 'DESIGNATION', employee.position or '—'),
         ('building', 'DEPARTMENT', employee.department or '—')),
        (('card', 'PAN NUMBER', employee.pan_number or '—'),
         ('mail', 'EMAIL', employee.email or '—')),
        (('calendar', 'DATE OF JOINING', str(employee.hire_date or '—')),
         ('rupee', 'CTC (ANNUAL)', str(ctc))),
        (('calendar-days', 'DAYS IN MONTH', _days(record.days_in_month)),
         ('calendar-check', 'WORKING DAYS', _days(record.actual_working_days))),
        (('plane', 'PAID LEAVE', _leave(record.paid_leave_days)),
         ('calendar-x', 'LOP DAYS', _leave(record.lop_days))),
    ]

    r_y = card1_top - 18 * mm
    step_y = 9.8 * mm

    for (i1, l1, v1), (i2, l2, v2) in details_list:
        _draw_icon(c, i1, col1_x, r_y - 2.5 * mm, 5.2 * mm, BORDER_COLOR)
        c.setFont(_BOLD, 6.5)
        c.setFillColor(colors.HexColor(TEXT_MUTED))
        c.drawString(col1_x + 8 * mm, r_y + 1 * mm, l1)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col1_x + 8 * mm, r_y - 3 * mm, str(v1))

        _draw_icon(c, i2, col2_x, r_y - 2.5 * mm, 5.2 * mm, BORDER_COLOR)
        c.setFont(_BOLD, 6.5)
        c.setFillColor(colors.HexColor(TEXT_MUTED))
        c.drawString(col2_x + 8 * mm, r_y + 1 * mm, l2)
        c.setFont(_BOLD, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col2_x + 8 * mm, r_y - 3 * mm, str(v2))

        r_y -= step_y

    # ----------------------------------------------------
    # Earnings & Deductions Tables - EXACT reference
    # ----------------------------------------------------
    tables_top = card1_y - 5 * mm
    table_h = 88 * mm
    table_y = tables_top - table_h
    card_gap = 5 * mm
    table_w = (content_w - card_gap) / 2

    earn_x = margin
    ded_x = margin + table_w + card_gap

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(earn_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)
    c.roundRect(ded_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(earn_x + 6 * mm, tables_top - 8 * mm, "EARNINGS")
    c.drawString(ded_x + 6 * mm, tables_top - 8 * mm, "DEDUCTIONS")

    c.setFont(_FONT, 8)
    c.drawRightString(earn_x + table_w - 6 * mm, tables_top - 8 * mm, "Amount (₹)")
    c.drawRightString(ded_x + table_w - 6 * mm, tables_top - 8 * mm, "Amount (₹)")

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
    curr_e_y = tables_top - 18 * mm
    for ename, evalue in earn_list:
        c.circle(earn_x + 7.5 * mm, curr_e_y + 1.2 * mm, 0.6 * mm, stroke=0, fill=1)
        c.setFont(_FONT, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(earn_x + 10 * mm, curr_e_y, ename)
        c.setFont(_BOLD, 8.5)
        c.drawRightString(earn_x + table_w - 6 * mm, curr_e_y, evalue)
        curr_e_y -= row_h

    curr_d_y = tables_top - 18 * mm
    for dname, dvalue in ded_list:
        c.circle(ded_x + 7.5 * mm, curr_d_y + 1.2 * mm, 0.6 * mm, stroke=0, fill=1)
        c.setFont(_FONT, 8.5)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(ded_x + 10 * mm, curr_d_y, dname)
        c.setFont(_BOLD, 8.5)
        c.drawRightString(ded_x + table_w - 6 * mm, curr_d_y, dvalue)
        curr_d_y -= row_h

    c.saveState()
    c.setStrokeColor(colors.HexColor('#9ca3af'))
    c.setLineWidth(0.6)
    c.setDash(2, 2)
    c.line(earn_x + 6 * mm, table_y + 26 * mm, earn_x + table_w - 6 * mm, table_y + 26 * mm)
    c.line(ded_x + 6 * mm, table_y + 26 * mm, ded_x + table_w - 6 * mm, table_y + 26 * mm)
    c.restoreState()

    pill_bottom_y = table_y + 5 * mm
    pill_w = table_w - 10 * mm

    gross_y = pill_bottom_y + 13 * mm
    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(earn_x + 6 * mm, gross_y, "GROSS SALARY")
    c.drawRightString(earn_x + table_w - 6 * mm, gross_y, _money(record.gross_salary) or '0.00')

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(earn_x + 5 * mm, pill_bottom_y, pill_w, 8.5 * mm, 2.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(earn_x + 9 * mm, pill_bottom_y + 2.7 * mm, "EARNED SALARY")
    c.drawRightString(earn_x + 5 * mm + pill_w - 4 * mm, pill_bottom_y + 2.7 * mm, _money(record.earned_salary) or '0.00')

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(ded_x + 5 * mm, pill_bottom_y, pill_w, 8.5 * mm, 2.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(ded_x + 9 * mm, pill_bottom_y + 2.7 * mm, "TOTAL DEDUCTIONS")
    c.drawRightString(ded_x + 5 * mm + pill_w - 4 * mm, pill_bottom_y + 2.7 * mm, _money(record.total_deductions) or '0.00')

    # ----------------------------------------------------
    # Net Salary Card - EXACT reference
    # ----------------------------------------------------
    net_top = table_y - 5 * mm
    net_h = 26 * mm
    net_y = net_top - net_h

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(margin, net_y, content_w, net_h, 3.5 * mm, stroke=1, fill=1)

    c.setFont(_BOLD, 46)
    c.setFillColor(colors.HexColor('#d1d5db'))
    c.drawRightString(W - margin - 12 * mm, net_y + 4 * mm, "₹")
    c.restoreState()

    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 8 * mm, net_top - 8 * mm, "N E T   S A L A R Y   ( T A K E - H O M E )")

    c.setFont(_BOLD, 23)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 8 * mm, net_y + 5.5 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    # ----------------------------------------------------
    # Amount in Words Card - EXACT reference
    # ----------------------------------------------------
    words_top = net_y - 5 * mm
    words_h = 16 * mm
    words_y = words_top - words_h

    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(BORDER_COLOR))
    c.setLineWidth(1.0)
    c.roundRect(margin, words_y, content_w, words_h, 3.5 * mm, stroke=1, fill=1)
    c.restoreState()

    c.setFont(_BOLD, 7.2)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 8 * mm, words_top - 5.5 * mm, "A M O U N T   I N   W O R D S")

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 8 * mm, words_y + 3.8 * mm, amount_in_words(record.net_salary))

    # ----------------------------------------------------
    # Footer - EXACT reference
    # ----------------------------------------------------
    fy = 11 * mm
    _draw_icon(c, 'lock', margin + 35 * mm, fy - 0.5 * mm, 4.5 * mm, BORDER_COLOR)

    c.setFont(_FONT, 7.2)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 42 * mm, fy, "This is a system-generated, password-protected salary slip and does not require a signature.")

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
    output = Path(media_root) / 'payslips_v8' / client_slug / str(record.batch.year) / month_folder
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