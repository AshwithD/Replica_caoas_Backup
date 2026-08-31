"""Design 7: Modern Geometric Purple Ribbon / Split Corporate payslip PDF renderer.

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


# --- Lucide SVG Icons (crisp) - SAME AS DESIGN 6 FINAL for consistency ---
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
    c.setFillColor(colors.HexColor(colour))
    c.setLineWidth(1.0)
    c.setLineCap(1)
    c.setLineJoin(1)
    q = size / 20.0

    if kind == 'id':
        c.roundRect(x + 2 * q, y + 3 * q, 16 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.circle(x + 7 * q, y + 10 * q, 2 * q, stroke=1, fill=0)
        c.line(x + 11 * q, y + 12 * q, x + 16 * q, y + 12 * q)
        c.line(x + 11 * q, y + 8 * q, x + 15 * q, y + 8 * q)
    elif kind == 'person':
        c.circle(x + 10 * q, y + 13 * q, 3.2 * q, stroke=1, fill=0)
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
    elif kind == 'rupee':
        c.setFont(_BOLD, size * 0.8)
        c.drawCentredString(x + 10 * q, y + 3 * q, '₹')
    elif kind == 'calendar-days':
        c.roundRect(x + 3 * q, y + 3 * q, 14 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 3 * q, y + 12 * q, x + 17 * q, y + 12 * q)
        c.line(x + 6.5 * q, y + 17 * q, x + 6.5 * q, y + 15 * q)
        c.line(x + 13.5 * q, y + 17 * q, x + 13.5 * q, y + 15 * q)
        c.circle(x + 7 * q, y + 8 * q, 0.8 * q, stroke=0, fill=1)
        c.circle(x + 13 * q, y + 8 * q, 0.8 * q, stroke=0, fill=1)
    elif kind == 'clock':
        c.circle(x + 10 * q, y + 10 * q, 7 * q, stroke=1, fill=0)
        c.line(x + 10 * q, y + 10 * q, x + 10 * q, y + 14 * q)
        c.line(x + 10 * q, y + 10 * q, x + 13 * q, y + 10 * q)
    elif kind == 'plane':
        p = c.beginPath()
        p.moveTo(x + 2 * q, y + 9 * q)
        p.lineTo(x + 18 * q, y + 17 * q)
        p.lineTo(x + 11 * q, y + 2 * q)
        p.close()
        c.drawPath(p, stroke=1, fill=0)
        c.line(x + 2 * q, y + 9 * q, x + 10 * q, y + 10.5 * q)
    elif kind == 'calendar-minus':
        c.roundRect(x + 3 * q, y + 3 * q, 14 * q, 14 * q, 1.5 * q, stroke=1, fill=0)
        c.line(x + 3 * q, y + 12 * q, x + 17 * q, y + 12 * q)
        c.line(x + 7 * q, y + 7 * q, x + 13 * q, y + 7 * q)
    elif kind == 'wallet':
        c.roundRect(x + 3 * q, y + 4 * q, 14 * q, 12 * q, 1.5 * q, stroke=1, fill=0)
        c.arc(x + 3 * q, y + 10 * q, x + 8 * q, y + 15 * q, 90, 180)
        c.rect(x + 12 * q, y + 7.5 * q, 5 * q, 4 * q, stroke=1, fill=0)
    elif kind == 'shield':
        p = c.beginPath()
        p.moveTo(x + 10 * q, y + 2 * q)
        p.lineTo(x + 17 * q, y + 5 * q)
        p.lineTo(x + 17 * q, y + 12 * q)
        p.curveTo(x + 17 * q, y + 16 * q, x + 14 * q, y + 18 * q, x + 10 * q, y + 19 * q)
        p.curveTo(x + 6 * q, y + 18 * q, x + 3 * q, y + 16 * q, x + 3 * q, y + 12 * q)
        p.lineTo(x + 3 * q, y + 5 * q)
        p.close()
        c.drawPath(p, stroke=1, fill=0)
    elif kind == 'map-pin':
        c.circle(x + 10 * q, y + 12 * q, 5 * q, stroke=1, fill=0)
        c.circle(x + 10 * q, y + 12 * q, 1.8 * q, stroke=0, fill=1)
        p = c.beginPath()
        p.moveTo(x + 6 * q, y + 9 * q)
        p.lineTo(x + 10 * q, y + 2 * q)
        p.lineTo(x + 14 * q, y + 9 * q)
        c.drawPath(p, stroke=1, fill=0)
    c.restoreState()


def _draw_dot_matrix(c, x, y, cols, rows, spacing=2.2 * mm, color='#94a3b8'):
    c.saveState()
    c.setFillColor(colors.HexColor(color))
    for r in range(rows):
        for col in range(cols):
            c.circle(x + col * spacing, y + r * spacing, 0.35 * mm, stroke=0, fill=1)
    c.restoreState()


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'

    buf = io.BytesIO()
    pagesize = A4
    W, H = pagesize
    c = canvas.Canvas(buf, pagesize=pagesize, encrypt=encryption)

    # Color Palette
    PAGE_BG = '#f8fafc'
    PURPLE_PRIMARY = '#47448e'
    RIBBON_PURPLE = '#625eb6'
    PALE_LAVENDER = '#f3f0fb'
    CARD_BG = '#ffffff'
    CARD_BORDER = '#e2e8f0'
    TEXT_MAIN = '#1f2937'
    SLATE_MUTED = '#64748b'

    TEAL_HEADER = '#e6f7f5'
    TEAL_ACCENT = '#0f766e'
    ROSE_HEADER = '#fef1f2'
    ROSE_ACCENT = '#be123c'

    BLUE_NET_BG = '#edf2fe'
    BLUE_NET_SHAPE = '#6985e9'
    BLUE_NET_TEXT = '#1e40af'

    # Fill Page Background
    c.setFillColor(colors.HexColor(PAGE_BG))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    margin = 11 * mm
    content_w = W - 2 * margin

    # ----------------------------------------------------
    # Header: Geometric Purple Split Banner
    # ----------------------------------------------------
    header_top = H - 8 * mm
    header_h = 28 * mm
    header_y = header_top - header_h

    # White Header Base Card
    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.8)
    c.roundRect(margin, header_y, content_w, header_h, 3.5 * mm, stroke=1, fill=1)

    # Clip inside header card for diagonal shapes
    p_clip = c.beginPath()
    p_clip.roundRect(margin, header_y, content_w, header_h, 3.5 * mm)
    c.clipPath(p_clip, stroke=0)

    # Top-left deep purple polygon
    p_purple = c.beginPath()
    p_purple.moveTo(margin, header_top)
    p_purple.lineTo(margin + 52 * mm, header_top)
    p_purple.lineTo(margin + 42 * mm, header_y)
    p_purple.lineTo(margin, header_y)
    p_purple.close()
    c.setFillColor(colors.HexColor(PURPLE_PRIMARY))
    c.drawPath(p_purple, stroke=0, fill=1)

    # Top-right faint lavender polygon
    p_lav = c.beginPath()
    p_lav.moveTo(W - margin - 50 * mm, header_top)
    p_lav.lineTo(W - margin, header_top)
    p_lav.lineTo(W - margin, header_y)
    p_lav.lineTo(W - margin - 62 * mm, header_y)
    p_lav.close()
    c.setFillColor(colors.HexColor(PALE_LAVENDER))
    c.drawPath(p_lav, stroke=0, fill=1)
    c.restoreState()

    # Client logo in top-left purple area
    logo_y = header_top - 16 * mm
    _profile = getattr(client, 'payroll_profile', None)
    logo = getattr(_profile, 'payroll_logo', None) if _profile else None
    drawn_logo = False
    logo_file = getattr(logo, 'path', None) if logo else None

    if logo_file and PILImage and Path(logo_file).exists():
        try:
            data = resized_logo_bytes(logo_file)
            if not data:
                raise ValueError('logo resize failed')
            with PILImage.open(io.BytesIO(data)) as im:
                iw, ih = im.size
            ratio = min(36 * mm / iw, 13 * mm / ih)
            lw, lh = iw * ratio, ih * ratio
            c.drawImage(ImageReader(io.BytesIO(data)), margin + 4 * mm, logo_y - lh + 2 * mm, lw, lh, mask='auto')
            drawn_logo = True
        except Exception:
            drawn_logo = False

    if not drawn_logo:
        client_name = (client.name or 'INFOSYS').strip()
        c.setFont(_BOLD, 20)
        c.setFillColor(colors.white)
        c.drawString(margin + 5 * mm, logo_y - 2 * mm, client_name)

    # Vertical divider REMOVED per user request - no line
    div_x = margin + 50 * mm

    # Client Title & Address next to divider
    c.setFont(_BOLD, 9)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(div_x + 6 * mm, header_top - 11 * mm, (client.name or 'INFOSYS').upper())

    _draw_icon(c, 'map-pin', div_x + 5.5 * mm, header_top - 20 * mm, 4 * mm, '#4b5563')
    address_line = (client.address or 'Banashankari, Bangalore').splitlines()[0]
    c.setFont(_FONT, 7.8)
    c.setFillColor(colors.HexColor('#4b5563'))
    c.drawString(div_x + 11 * mm, header_top - 18.5 * mm, address_line)

    # Right: SALARY SLIP & Month
    c.setFont(_BOLD, 13)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawRightString(W - margin - 8 * mm, header_top - 11 * mm, "SALARY SLIP")

    month_text = f"{calendar.month_name[batch.month].upper()} {batch.year}"
    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor('#4338ca'))
    c.drawRightString(W - margin - 8 * mm, header_top - 18 * mm, month_text)

    # Accent underline
    c.setStrokeColor(colors.HexColor('#4338ca'))
    c.setLineWidth(1.2)
    c.line(W - margin - 30 * mm, header_top - 21 * mm, W - margin - 8 * mm, header_top - 21 * mm)

    # Dot matrix top-right like reference (faint)
    _draw_dot_matrix(c, W - margin - 18 * mm, header_top - 6 * mm, 4, 3, spacing=2.2 * mm, color='#ede9fe')

    # ----------------------------------------------------
    # Employee Details Card with Vertical Purple Ribbon
    # ----------------------------------------------------
    card1_top = header_y - 5 * mm
    card1_h = 74 * mm
    card1_y = card1_top - card1_h
    ribbon_w = 14 * mm

    c.saveState()
    # White Card Body
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(margin, card1_y, content_w, card1_h, 3.5 * mm, stroke=1, fill=1)

    # Purple Left Ribbon
    c.saveState()
    p_ribbon = c.beginPath()
    p_ribbon.roundRect(margin, card1_y, ribbon_w, card1_h, 3.5 * mm)
    c.clipPath(p_ribbon, stroke=0)
    c.setFillColor(colors.HexColor(RIBBON_PURPLE))
    c.rect(margin, card1_y, ribbon_w, card1_h, stroke=0, fill=1)

    # Bow-tie / Badge icon at top of ribbon
    _draw_icon(c, 'briefcase', margin + 4.2 * mm, card1_top - 11 * mm, 5.5 * mm, '#ffffff')

    # Vertical text "EMPLOYEE DETAILS"
    c.saveState()
    c.setFont(_BOLD, 7.8)
    c.setFillColor(colors.white)
    c.translate(margin + 9.5 * mm, card1_y + 16 * mm)
    c.rotate(90)
    c.drawString(0, 0, "EMPLOYEE DETAILS")
    c.restoreState()

    # Dot matrix at bottom of ribbon
    _draw_dot_matrix(c, margin + 3.2 * mm, card1_y + 4 * mm, 3, 4, spacing=2.2 * mm, color='#8f8bc9')
    c.restoreState()
    c.restoreState()

    # 2 Columns of detail items with square icon tiles
    inner_x = margin + ribbon_w + 5 * mm
    inner_w = content_w - ribbon_w - 10 * mm
    half_w = inner_w / 2
    col1_x = inner_x
    col2_x = inner_x + half_w

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

    r_y = card1_top - 11 * mm
    step_y = 10.5 * mm

    for (i1, l1, v1), (i2, l2, v2) in details_list:
        # Col 1 icon tile
        c.saveState()
        c.setFillColor(colors.HexColor('#f5f3ff'))
        c.setStrokeColor(colors.HexColor('#ede9fe'))
        c.setLineWidth(0.5)
        c.roundRect(col1_x, r_y - 2 * mm, 6 * mm, 6 * mm, 1.4 * mm, stroke=1, fill=1)
        _draw_icon(c, i1, col1_x + 0.8 * mm, r_y - 1.2 * mm, 4.4 * mm, '#7c3aed')
        c.restoreState()

        c.setFont(_FONT, 7.8)
        c.setFillColor(colors.HexColor('#1e293b'))
        c.drawString(col1_x + 9 * mm, r_y, l1)
        c.setFont(_BOLD, 7.8)
        c.setFillColor(colors.HexColor('#0f172a'))
        c.drawString(col1_x + 38 * mm, r_y, str(v1)[:22])

        # Col 2 icon tile - reference light lavender
        c.saveState()
        c.setFillColor(colors.HexColor('#f5f3ff'))
        c.setStrokeColor(colors.HexColor('#ede9fe'))
        c.setLineWidth(0.5)
        c.roundRect(col2_x, r_y - 2 * mm, 6 * mm, 6 * mm, 1.4 * mm, stroke=1, fill=1)
        _draw_icon(c, i2, col2_x + 0.8 * mm, r_y - 1.2 * mm, 4.4 * mm, '#7c3aed')
        c.restoreState()

        c.setFont(_FONT, 8)
        c.setFillColor(colors.HexColor(TEXT_MAIN))
        c.drawString(col2_x + 9 * mm, r_y, l2)
        c.setFont(_BOLD, 8)
        c.drawString(col2_x + 42 * mm, r_y, str(v2))

        # Divider line between rows
        c.setStrokeColor(colors.HexColor('#f1f5f9'))
        c.setLineWidth(0.5)
        c.line(col1_x + 9 * mm, r_y - 4.5 * mm, col1_x + half_w - 4 * mm, r_y - 4.5 * mm)
        c.line(col2_x + 9 * mm, r_y - 4.5 * mm, col2_x + half_w - 4 * mm, r_y - 4.5 * mm)

        r_y -= step_y

    # ----------------------------------------------------
    # Earnings & Deductions Tables (Side by Side Cards) - DYNAMIC HEIGHT
    # ----------------------------------------------------
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
    max_rows = max(len(earn_list), len(ded_list), 1)
    table_h = 12 * mm + max_rows * row_h + 18 * mm
    tables_top = card1_y - 5 * mm
    table_y = tables_top - table_h
    card_gap = 5 * mm
    table_w = (content_w - card_gap) / 2

    earn_x = margin
    ded_x = margin + table_w + card_gap

    # Left Card (Earnings)
    c.saveState()
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor(CARD_BORDER))
    c.setLineWidth(0.8)
    c.roundRect(earn_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)
    # Right Card (Deductions)
    c.roundRect(ded_x, table_y, table_w, table_h, 3.5 * mm, stroke=1, fill=1)

    # Shaded Header Areas
    c.saveState()
    p_eh = c.beginPath()
    p_eh.roundRect(earn_x, tables_top - 12 * mm, table_w, 12 * mm, 3.5 * mm)
    c.clipPath(p_eh, stroke=0)
    c.setFillColor(colors.HexColor(TEAL_HEADER))
    c.rect(earn_x, tables_top - 12 * mm, table_w, 12 * mm, stroke=0, fill=1)
    c.restoreState()

    c.saveState()
    p_dh = c.beginPath()
    p_dh.roundRect(ded_x, tables_top - 12 * mm, table_w, 12 * mm, 3.5 * mm)
    c.clipPath(p_dh, stroke=0)
    c.setFillColor(colors.HexColor(ROSE_HEADER))
    c.rect(ded_x, tables_top - 12 * mm, table_w, 12 * mm, stroke=0, fill=1)
    c.restoreState()
    c.restoreState()

    # Earnings Header Content
    c.saveState()
    c.setFillColor(colors.HexColor(TEAL_ACCENT))
    c.circle(earn_x + 9 * mm, tables_top - 6 * mm, 4.5 * mm, stroke=0, fill=1)
    _draw_icon(c, 'wallet', earn_x + 6.2 * mm, tables_top - 8.8 * mm, 5.6 * mm, '#ffffff')
    c.restoreState()

    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(TEAL_ACCENT))
    c.drawString(earn_x + 16 * mm, tables_top - 7.2 * mm, "EARNINGS")
    c.setFont(_FONT, 7.5)
    c.drawRightString(earn_x + table_w - 6 * mm, tables_top - 7.2 * mm, "Amount (₹)")

    # Deductions Header Content
    c.saveState()
    c.setFillColor(colors.HexColor(ROSE_ACCENT))
    c.circle(ded_x + 9 * mm, tables_top - 6 * mm, 4.5 * mm, stroke=0, fill=1)
    _draw_icon(c, 'shield', ded_x + 6.2 * mm, tables_top - 8.8 * mm, 5.6 * mm, '#ffffff')
    c.restoreState()

    c.setFont(_BOLD, 8.8)
    c.setFillColor(colors.HexColor(ROSE_ACCENT))
    c.drawString(ded_x + 16 * mm, tables_top - 7.2 * mm, "DEDUCTIONS")
    c.setFont(_FONT, 7.5)
    c.drawRightString(ded_x + table_w - 6 * mm, tables_top - 7.2 * mm, "Amount (₹)")

        # rows already computed above with dynamic height
    curr_e_y = tables_top - 19 * mm
    for idx, (ename, evalue) in enumerate(earn_list):
        if idx > 0:
            c.setStrokeColor(colors.HexColor('#f1f5f9'))
            c.setDash(1, 1.5)
            c.setLineWidth(0.3)
            c.line(earn_x + 5 * mm, curr_e_y + 4.5 * mm, earn_x + table_w - 5 * mm, curr_e_y + 4.5 * mm)
            c.setDash()
        c.setFont(_FONT, 7.9)
        c.setFillColor(colors.HexColor('#1e293b'))
        c.drawString(earn_x + 6 * mm, curr_e_y, ename)
        c.setFont(_BOLD, 8)
        c.setFillColor(colors.HexColor('#0f172a'))
        c.drawRightString(earn_x + table_w - 6 * mm, curr_e_y, evalue)
        curr_e_y -= row_h

    curr_d_y = tables_top - 19 * mm
    for idx, (dname, dvalue) in enumerate(ded_list):
        if idx > 0:
            c.setStrokeColor(colors.HexColor('#fdf2f4'))
            c.setDash(1, 1.5)
            c.setLineWidth(0.3)
            c.line(ded_x + 5 * mm, curr_d_y + 4.5 * mm, ded_x + table_w - 5 * mm, curr_d_y + 4.5 * mm)
            c.setDash()
        c.setFont(_FONT, 7.9)
        c.setFillColor(colors.HexColor('#1e293b'))
        c.drawString(ded_x + 6 * mm, curr_d_y, dname)
        c.setFont(_BOLD, 8)
        c.setFillColor(colors.HexColor('#0f172a'))
        c.drawRightString(ded_x + table_w - 6 * mm, curr_d_y, dvalue)
        curr_d_y -= row_h

    # Gross Salary - directly above Earned pill, no gap (like Design 6)
    pill_h = 9 * mm
    pill_y = table_y
    gross_h = 8 * mm
    gross_y = pill_y + pill_h + 0.5 * mm
    pill_w = table_w

    c.saveState()
    c.setFillColor(colors.HexColor('#e6f7f5'))
    c.setStrokeColor(colors.HexColor('#b2dfdb'))
    c.setLineWidth(0.4)
    c.rect(earn_x, gross_y, table_w, gross_h, stroke=1, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEAL_ACCENT))
    c.drawString(earn_x + 6 * mm, gross_y + 2.5 * mm, "GROSS SALARY")
    c.drawRightString(earn_x + table_w - 6 * mm, gross_y + 2.5 * mm, _money(record.gross_salary) or '0.00')

    # Earned Salary & Total Deductions - SAME ROW at bottom
    c.saveState()
    c.setFillColor(colors.HexColor(TEAL_ACCENT))
    c.roundRect(earn_x, pill_y, pill_w, pill_h, 3 * mm, stroke=0, fill=1)
    c.rect(earn_x, pill_y + 3 * mm, pill_w, 3 * mm, stroke=0, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 8.2)
    c.setFillColor(colors.white)
    c.drawString(earn_x + 6 * mm, pill_y + 3 * mm, "EARNED SALARY")
    c.setFont(_BOLD, 9.5)
    c.drawRightString(earn_x + table_w - 6 * mm, pill_y + 3 * mm, _money(record.earned_salary) or '0.00')

    c.saveState()
    c.setFillColor(colors.HexColor('#ffe4e6'))
    c.roundRect(ded_x, pill_y, pill_w, pill_h, 3 * mm, stroke=0, fill=1)
    c.rect(ded_x, pill_y + 3 * mm, pill_w, 3 * mm, stroke=0, fill=1)
    c.restoreState()
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor(ROSE_ACCENT))
    c.drawString(ded_x + 6 * mm, pill_y + 3 * mm, "TOTAL DEDUCTIONS")
    c.setFont(_BOLD, 9.5)
    c.drawRightString(ded_x + table_w - 6 * mm, pill_y + 3 * mm, _money(record.total_deductions) or '0.00')

    # ----------------------------------------------------
    # Net Salary (Take-Home) Card (Split Geometric)
    # ----------------------------------------------------
    net_top = table_y - 5 * mm
    net_h = 26 * mm
    net_y = net_top - net_h

    c.saveState()
    c.setFillColor(colors.HexColor(BLUE_NET_BG))
    c.setStrokeColor(colors.HexColor('#dbeafe'))
    c.setLineWidth(0.8)
    c.roundRect(margin, net_y, content_w, net_h, 3.5 * mm, stroke=1, fill=1)

    # Right diagonal royal blue polygon
    c.saveState()
    p_blue_clip = c.beginPath()
    p_blue_clip.roundRect(margin, net_y, content_w, net_h, 3.5 * mm)
    c.clipPath(p_blue_clip, stroke=0)

    p_rblue = c.beginPath()
    p_rblue.moveTo(W - margin - 46 * mm, net_top)
    p_rblue.lineTo(W - margin, net_top)
    p_rblue.lineTo(W - margin, net_y)
    p_rblue.lineTo(W - margin - 60 * mm, net_y)
    p_rblue.close()
    c.setFillColor(colors.HexColor(BLUE_NET_SHAPE))
    c.drawPath(p_rblue, stroke=0, fill=1)

    # Blue polygon only - NOTE ICON REMOVED per user request (clean minimal)
    c.restoreState()

    # Blue Rupee badge on left - improved centered SVG
    badge_cx = margin + 12 * mm
    badge_cy = net_y + net_h / 2
    c.setFillColor(colors.HexColor('#c9c6ff'))
    c.circle(badge_cx + 0.6 * mm, badge_cy - 0.6 * mm, 5.2 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor('#2563eb'))
    c.circle(badge_cx, badge_cy, 5.2 * mm, stroke=0, fill=1)
    _draw_icon(c, 'rupee', badge_cx - 2.6 * mm, badge_cy - 2.6 * mm, 5.2 * mm, '#ffffff')

    # Divider line next to badge
    c.setStrokeColor(colors.HexColor('#bfdbfe'))
    c.setLineWidth(0.7)
    c.line(margin + 20 * mm, net_y + 4 * mm, margin + 20 * mm, net_top - 4 * mm)

    # Text content
    c.setFont(_BOLD, 7.5)
    c.setFillColor(colors.HexColor(BLUE_NET_TEXT))
    c.drawString(margin + 25 * mm, net_top - 8.5 * mm, "NET SALARY (TAKE-HOME)")

    c.setFont(_BOLD, 22)
    c.setFillColor(colors.HexColor(BLUE_NET_TEXT))
    c.drawString(margin + 25 * mm, net_y + 5.5 * mm, f"₹{_money(record.net_salary) or '0.00'}")

    # Dot matrix in center
    _draw_dot_matrix(c, margin + 85 * mm, net_y + 5 * mm, 5, 5, spacing=2.5 * mm, color='#93c5fd')
    c.restoreState()

    # ----------------------------------------------------
    # Amount in Words Card (Warm Cream)
    # ----------------------------------------------------
    words_top = net_y - 5 * mm
    words_h = 16 * mm
    words_y = words_top - words_h

    c.saveState()
    c.setFillColor(colors.HexColor('#fef9ed'))
    c.setStrokeColor(colors.HexColor('#fde68a'))
    c.setLineWidth(0.8)
    c.roundRect(margin, words_y, content_w, words_h, 3.5 * mm, stroke=1, fill=1)

    # Amber badge with Rupee sign - improved SVG centered
    w_badge_cx = margin + 10 * mm
    w_badge_cy = words_y + words_h / 2
    c.setFillColor(colors.HexColor('#fde68a'))
    c.circle(w_badge_cx + 0.5 * mm, w_badge_cy - 0.5 * mm, 4.7 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor('#f59e0b'))
    c.circle(w_badge_cx, w_badge_cy, 4.7 * mm, stroke=0, fill=1)
    _draw_icon(c, 'rupee', w_badge_cx - 2.35 * mm, w_badge_cy - 2.35 * mm, 4.7 * mm, '#ffffff')

    # Divider line
    c.setStrokeColor(colors.HexColor('#fde68a'))
    c.setLineWidth(0.7)
    c.line(margin + 18 * mm, words_y + 3 * mm, margin + 18 * mm, words_top - 3 * mm)

    c.setFont(_BOLD, 6.8)
    c.setFillColor(colors.HexColor('#b45309'))
    c.drawString(margin + 22 * mm, words_top - 5.5 * mm, "AMOUNT IN WORDS")

    c.setFont(_BOLD, 8.5)
    c.setFillColor(colors.HexColor(TEXT_MAIN))
    c.drawString(margin + 22 * mm, words_y + 3.8 * mm, amount_in_words(record.net_salary))
    c.restoreState()

    # ----------------------------------------------------
    # Footer
    # ----------------------------------------------------
    fy = 11 * mm
    c.saveState()
    c.setFillColor(colors.HexColor('#f1f5f9'))
    c.roundRect(margin, fy - 2 * mm, content_w, 11 * mm, 2.5 * mm, stroke=0, fill=1)

    # Purple shield badge with outer ring like reference
    c.setFillColor(colors.HexColor('#ede9fe'))
    c.circle(margin + 6 * mm, fy + 3.5 * mm, 5 * mm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor(RIBBON_PURPLE))
    c.circle(margin + 6 * mm, fy + 3.5 * mm, 3.8 * mm, stroke=0, fill=1)
    _draw_icon(c, 'shield', margin + 3.8 * mm, fy + 1.2 * mm, 4.4 * mm, '#ffffff')

    c.setFont(_FONT, 6.8)
    c.setFillColor(colors.HexColor(SLATE_MUTED))
    c.drawString(margin + 14 * mm, fy + 4 * mm, "This is a system-generated, password-protected salary slip")
    c.drawString(margin + 14 * mm, fy + 0.8 * mm, "and does not require a signature.")

    # Dot matrix on the right
    _draw_dot_matrix(c, W - margin - 22 * mm, fy - 0.5 * mm, 5, 3, spacing=2.5 * mm, color='#94a3b8')
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
    output = Path(media_root) / 'payslips_v7' / client_slug / str(record.batch.year) / month_folder
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