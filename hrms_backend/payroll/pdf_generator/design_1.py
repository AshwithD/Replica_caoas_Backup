"""One-page, field-faithful payslip PDF renderer.

The renderer deliberately reads only fields already present on PayslipRecord,
Employee, Batch, Client and EmployeeSalaryStructure.  It uses ReportLab canvas
primitives so every icon remains crisp and consistently weighted in the PDF.
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
except ImportError:  # pragma: no cover
    PILImage = None

_NAVY, _NAVY2, _NAVY3 = '#102b56', '#183d73', '#0c2345'
_GREEN, _GREEN_T = '#087a35', '#edf8f0'
_RED, _RED_T = '#c61721', '#fff0f1'
_TEXT, _MUTED, _GRID = '#12213b', '#526277', '#e8edf4'
_FONT, _BOLD = 'Helvetica', 'Helvetica-Bold'

# Lucide icons (ISC), embedded for crisp, consistent PDF vector rendering.
# They are all sourced from the same 24px outline family.
_LUCIDE_SVG = {'employee-details': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-contact"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M16 2v2" />\n  <path d="M7 21v-2a2 2 0 012-2h6a2 2 0 012 2v2" />\n  <path d="M8 2v2" />\n  <circle cx="12" cy="10" r="3" />\n  <rect x="3" y="3" width="18" height="18" rx="2" />\n</svg>\n', 'days-in-month': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-calendar-days"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M8 2v3" />\n  <path d="M16 2v3" />\n  <rect x="3" y="3" width="18" height="18" rx="2" />\n  <path d="M3 9h18" />\n  <path d="M8 13h.01" />\n  <path d="M12 13h.01" />\n  <path d="M16 13h.01" />\n  <path d="M8 17h.01" />\n  <path d="M12 17h.01" />\n  <path d="M16 17h.01" />\n</svg>\n', 'lop-days': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-calendar-minus-2"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M8 2v3" />\n  <path d="M16 2v3" />\n  <rect x="3" y="3" width="18" height="18" rx="2" />\n  <path d="M3 9h18" />\n  <path d="M10 15h4" />\n</svg>\n', 'id': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-id-card"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M16 10h2" />\n  <path d="M16 14h2" />\n  <path d="M6.17 15a3 3 0 0 1 5.66 0" />\n  <circle cx="9" cy="11" r="2" />\n  <rect x="2" y="5" width="20" height="14" rx="2" />\n</svg>\n', 'person': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-user-round"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <circle cx="12" cy="8" r="5" />\n  <path d="M20 21a8 8 0 0 0-16 0" />\n</svg>\n', 'briefcase': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-briefcase-business"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M12 12h.01" />\n  <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />\n  <path d="M22 13a18.15 18.15 0 0 1-20 0" />\n  <rect width="20" height="14" x="2" y="6" rx="2" />\n</svg>\n', 'building': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-building-2"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M10 12h4" />\n  <path d="M10 8h4" />\n  <path d="M14 21v-3a2 2 0 0 0-4 0v3" />\n  <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />\n  <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />\n</svg>\n', 'card': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-credit-card"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <rect width="20" height="14" x="2" y="5" rx="2" />\n  <line x1="2" x2="22" y1="10" y2="10" />\n</svg>\n', 'mail': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-mail"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />\n  <rect x="2" y="4" width="20" height="16" rx="2" />\n</svg>\n', 'calendar': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-calendar"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M8 2v3" />\n  <path d="M16 2v3" />\n  <rect x="3" y="3" width="18" height="18" rx="2" />\n  <path d="M3 9h18" />\n</svg>\n', 'rupee': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-indian-rupee"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M6 3h12" />\n  <path d="M6 8h12" />\n  <path d="m6 13 8.5 8" />\n  <path d="M6 13h3" />\n  <path d="M9 13c6.667 0 6.667-10 0-10" />\n</svg>\n', 'calendar-clock': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-calendar-clock"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M16 14v2.2l1.6 1" />\n  <path d="M16 2v3" />\n  <path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" />\n  <path d="M3 9h5.859" />\n  <path d="M8 2v3" />\n  <circle cx="16" cy="16" r="6" />\n</svg>\n', 'plane': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-send"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />\n  <path d="m21.854 2.147-10.94 10.939" />\n</svg>\n', 'calendar-minus': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-calendar-minus"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M16 18h6" />\n  <path d="M16 2v3" />\n  <path d="M21 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3" />\n  <path d="M3 9h18" />\n  <path d="M8 2v3" />\n</svg>\n', 'wallet': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-wallet"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />\n  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />\n</svg>\n', 'shield': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-shield-check"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />\n  <path d="m9 12 2 2 4-4" />\n</svg>\n', 'shield-lock': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-shield-lock"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M20 9.807V6a1 1 0 00-1-1c-2 0-4.49-1.19-6.24-2.72a1.17 1.17 0 00-1.52 0C9.5 3.8 7 5 5 5a1 1 0 00-1 1v7c0 3.88 2.107 6.254 5 7.796" />\n  <path d="M19 17v-2a2 2 0 00-4 0v2" />\n  <rect x="13" y="17" width="8" height="5" rx="1" />\n</svg>\n', 'map-pin': '<!-- @license lucide-static v1.33.0 - ISC -->\n<svg\n  class="lucide lucide-map-pin"\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />\n  <circle cx="12" cy="10" r="3" />\n</svg>\n'}

try:
    from svglib.svglib import svg2rlg
except Exception:  # pragma: no cover - optional rendering enhancement
    svg2rlg = None


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


# Kept as a public helper because email_service imports it to embed the same
# client logo in outgoing payslip emails.
def resized_logo_bytes(logo_path, max_px: int = 420) -> bytes | None:
    """Return a compact PNG/JPEG version of an uploaded logo.

    This preserves the original public API used by ``email_service.py`` while
    preventing large uploaded logos from inflating PDF or email attachments.
    """
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
    """Render the net amount in whole rupees only; the payslip omits paise."""
    rupees = int(Decimal(str(amount)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    return 'Rupees ' + _words(rupees) + ' Only'


def _draw_lucide(c, kind, x, y, size, colour):
    """Draw the embedded Lucide SVG at an exact square size."""
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


# ---- Consistent outline icon system -------------------------------------------------
# All 24px icons use rounded 1.55pt strokes; each is optically centred in its box.
def _icon(c, kind, x, y, size, colour, stroke=1.55):
    """Draw a semantic, professional outline icon in a size×size box."""
    # Prefer exact Lucide SVGs.  The manual vector branches below are only a
    # no-dependency fallback for deployments without svglib.
    if _draw_lucide(c, kind, x, y, size, colour):
        return
    kind = {'days-in-month': 'calendar', 'lop-days': 'calendar-minus', 'employee-details': 'person'}.get(kind, kind)
    s, q = size, size / 24.0
    c.saveState(); c.setStrokeColor(colors.HexColor(colour)); c.setFillColor(colors.HexColor(colour))
    c.setLineWidth(stroke * q); c.setLineCap(1); c.setLineJoin(1)
    def line(a,b,d,e): c.line(x+a*q, y+b*q, x+d*q, y+e*q)
    def rect(a,b,w,h,r=2): c.roundRect(x+a*q, y+b*q, w*q, h*q, r*q, stroke=1, fill=0)
    def circle(a,b,r): c.circle(x+a*q, y+b*q, r*q, stroke=1, fill=0)
    def dot(a,b,r=1): c.circle(x+a*q, y+b*q, r*q, stroke=0, fill=1)
    if kind == 'person':
        circle(12, 16.5, 3.5); c.arc(x+4*q,y+2*q,x+20*q,y+14*q,0,180)
    elif kind == 'id':
        rect(2,3,20,18); circle(8,14.2,2.2); c.arc(x+5.1*q,y+7*q,x+10.9*q,y+12.6*q,0,180); line(14,15,19,15); line(14,11,19,11)
    elif kind == 'briefcase':
        rect(2,6,20,14); rect(8,3,8,4); line(2,12,22,12); line(10,12,14,12)
    elif kind == 'building':
        rect(4,2,16,20); line(9,2,9,7); line(15,2,15,7)
        for yy in (10,14,18):
            for xx in (8,12,16): dot(xx,yy,.65)
    elif kind == 'card':
        rect(1.5,4,21,16); line(1.5,10,22.5,10); line(5,15,10,15)
    elif kind == 'mail':
        rect(2,4,20,16); line(2,18,12,11); line(22,18,12,11)
    elif kind == 'map-pin':
        # Compact location pin for the header address; same rounded outline
        # language as every other icon on the sheet.
        c.circle(x+12*q, y+14*q, 7*q, stroke=1, fill=0)
        p = c.beginPath(); p.moveTo(x+5*q, y+14*q); p.curveTo(x+5*q,y+8*q,x+9*q,y+4*q,x+12*q,y+1.5*q); p.curveTo(x+15*q,y+4*q,x+19*q,y+8*q,x+19*q,y+14*q); c.drawPath(p,stroke=1,fill=0)
        dot(12,14,1.75)
    elif kind in ('calendar', 'calendar-minus'):
        rect(3,3,18,18); line(3,16,21,16); line(8,21,8,18); line(16,21,16,18)
        if kind == 'calendar-minus': line(8,10,16,10)
        else:
            for yy in (12,8):
                for xx in (8,12,16): dot(xx,yy,.65)
    elif kind == 'calendar-clock':
        rect(3,3,13,18); line(3,16,16,16); line(7,21,7,18); line(12,21,12,18); circle(18,8,4); line(18,8,18,10.5); line(18,8,20.2,7)
    elif kind == 'plane':
        p = c.beginPath(); p.moveTo(x+2*q,y+10*q); p.lineTo(x+22*q,y+21*q); p.lineTo(x+14*q,y+2*q); p.close(); c.drawPath(p,stroke=1,fill=0); line(2,10,12,12); line(12,12,22,21)
    elif kind == 'rupee':
        c.setFont(_BOLD, size*.77); c.drawCentredString(x+12*q, y+4*q, '₹')
    elif kind == 'wallet':
        rect(2,5,19,15); c.arc(x+2*q,y+14*q,x+8*q,y+20*q,90,180); rect(15,10,7,6,2); dot(18,13,.65)
    elif kind == 'shield':
        p=c.beginPath(); p.moveTo(x+12*q,y+2*q); p.lineTo(x+20*q,y+6*q); p.lineTo(x+20*q,y+14*q); p.curveTo(x+20*q,y+19*q,x+16*q,y+21*q,x+12*q,y+23*q); p.curveTo(x+8*q,y+21*q,x+4*q,y+19*q,x+4*q,y+14*q); p.lineTo(x+4*q,y+6*q); p.close(); c.drawPath(p,stroke=1,fill=0)
    elif kind == 'shield-lock':
        _icon(c,'shield',x,y,size,colour,stroke); rect(8,7,8,7,1); c.arc(x+9.5*q,y+12*q,x+14.5*q,y+17*q,0,180); dot(12,10,.75)
    elif kind == 'money':
        circle(12,12,9); c.setFont(_BOLD,size*.62); c.drawCentredString(x+12*q,y+5*q,'₹')
    c.restoreState()


def _badge(c, kind, x, y, diameter, background, glyph='#ffffff', ring=None):
    c.saveState(); c.setFillColor(colors.HexColor(background)); c.setStrokeColor(colors.HexColor(ring or background)); c.setLineWidth(1 if ring else 0)
    c.circle(x+diameter/2,y+diameter/2,diameter/2-0.5,stroke=1 if ring else 0,fill=1); c.restoreState()
    _icon(c,kind,x+diameter*.16,y+diameter*.16,diameter*.68,glyph,1.75)


def _round(c, x, y, w, h, fill, stroke='#d9e1ea', radius=4*mm, width=.7):
    c.setFillColor(colors.HexColor(fill)); c.setStrokeColor(colors.HexColor(stroke)); c.setLineWidth(width); c.roundRect(x,y,w,h,radius,stroke=1,fill=1)


def _logo(c, client, x, y, max_w, max_h):
    _profile = getattr(client, 'payroll_profile', None)
    logo = getattr(_profile, 'payroll_logo', None) if _profile else None
    if logo and PILImage:
        try:
            data = resized_logo_bytes(logo.path)
            if data:
                with PILImage.open(io.BytesIO(data)) as im:
                    iw, ih = im.size
                ratio = min(max_w/iw, max_h/ih); w,h=iw*ratio,ih*ratio
                c.drawImage(ImageReader(io.BytesIO(data)),x+(max_w-w)/2,y+(max_h-h)/2,w,h,mask='auto'); return
        except Exception: pass
    c.setFillColor(colors.white); draw_fitted(c, x+max_w/2, y+max_h/2-4, (client.name or 'COMPANY').upper(), _BOLD, 12, max_w-4, min_size=6, align='center')


def _structure(record):
    try:
        from ..models import EmployeeSalaryStructure
    except (ImportError, ValueError):
        from models import EmployeeSalaryStructure
    reference = date(record.batch.year, record.batch.month, 1)
    obj = EmployeeSalaryStructure.objects.filter(employee=record.employee, effective_from__lte=reference).order_by('-effective_from').first()
    return obj, bool(obj.pf_opted) if obj else bool(record.epf)


def _draw_detail_row(c, y, left, right, icon, label, value):
    # Each detail icon sits in the same quiet 8 mm keyline tile.  This makes
    # the larger outline glyphs legible while preserving the fixed columns,
    # label start point and row height on both sides of the grid.
    tile = 8.0 * mm
    c.saveState()
    c.setFillColor(colors.HexColor('#f8fafc'))
    c.setStrokeColor(colors.HexColor('#d9e3ef'))
    c.setLineWidth(.65)
    c.roundRect(left, y + 2.65 * mm, tile, tile, 1.5 * mm, stroke=1, fill=1)
    c.restoreState()
    _icon(c, icon, left + 1.0 * mm, y + 3.65 * mm, 6.0 * mm, '#173862', 1.8)
    # Baselines are deliberately centred on the icon tile's optical centre;
    # both label and value therefore sit level with their icon in every row.
    baseline = y + 6.0 * mm
    c.setFont(_BOLD,8.15); c.setFillColor(colors.HexColor('#1b355d')); c.drawString(left+9.5*mm, baseline, label)
    # Value cell is fitted to the remaining column width, so long employee
    # names / emails shrink instead of running into the next column.
    c.setFillColor(colors.HexColor(_TEXT))
    draw_block(c, left + 44 * mm, baseline, str(value), _FONT, 8.35,
               max(right - (left + 44 * mm), 10), max_lines=2, min_size=6,
               leading_ratio=1.05)
    # The separator is centred in the whitespace between rows—not below the
    # following row's text—and begins after the icon tile.
    c.setStrokeColor(colors.HexColor(_GRID)); c.setLineWidth(.55)
    c.line(left + 9.5 * mm, y + 1.3 * mm, right, y + 1.3 * mm)


def _draw_money_card(c, x, y, w, h, accent, tint, title, icon, rows):
    _round(c,x,y,w,h,'#ffffff'); header=12*mm
    c.setFillColor(colors.HexColor(tint)); c.roundRect(x+.4,y+h-header,w-.8,header,4*mm,stroke=0,fill=1); c.rect(x+.4,y+h-header,w-.8,header-4*mm,stroke=0,fill=1)
    # Header icons use their section accent directly—no competing round badge.
    _icon(c, icon, x + 5 * mm, y + h - header + 2 * mm, 8 * mm, accent, 1.8)
    c.setFont(_BOLD,10); c.setFillColor(colors.HexColor(accent)); c.drawString(x+15*mm,y+h-header/2-3,title)
    c.setFont(_BOLD,7.6); c.drawRightString(x+w-5*mm,y+h-header/2-2.5,'Amount (₹)')
    row_h=(h-header)/len(rows); yy=y+h-header
    for label,value,kind in rows:
        yy-=row_h
        if kind == 'total':
            # Preserve the money card's rounded lower corners.  A plain rect
            # would square them off, which is especially noticeable on the
            # EARNED SALARY and TOTAL DEDUCTIONS rows.
            c.setFillColor(colors.HexColor(tint))
            bottom_radius = min(4 * mm, row_h / 2)
            c.roundRect(x + .5, yy, w - 1, row_h, bottom_radius, stroke=0, fill=1)
            # Square only the top of the final row; its bottom stays rounded.
            c.rect(x + .5, yy + row_h - bottom_radius, w - 1, bottom_radius, stroke=0, fill=1)
        c.setStrokeColor(colors.HexColor(_GRID)); c.setLineWidth(.55); c.line(x+.5,yy+row_h,x+w-.5,yy+row_h)
        c.setFont(_BOLD if kind else _FONT,8.5); c.setFillColor(colors.HexColor(accent if kind else '#263850')); c.drawString(x+6*mm,yy+row_h/2-3,label)
        c.drawRightString(x+w-6*mm,yy+row_h/2-3,value)


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


def _build_pdf_bytes(record: PayslipRecord, encryption=None) -> bytes:  # noqa: ARG001
    employee, client, batch = record.employee, record.batch.client, record.batch
    structure, pf_opted = _structure(record)
    ctc = _money(structure.ctc_annual) if structure else '—'
    buf=io.BytesIO()
    # ReportLab applies this at document creation, so the returned bytes are
    # password-protected without depending on a separate post-processing tool.
    c=canvas.Canvas(buf, pagesize=A4, encrypt=encryption)
    W,H=A4; margin=8*mm; content=W-2*margin

    # Header: unchanged content, refined presentation.
    c.setFillColor(colors.HexColor(_NAVY)); c.rect(0,H-32*mm,W,32*mm,stroke=0,fill=1)
    c.setFillColor(colors.HexColor(_NAVY2)); p=c.beginPath(); p.moveTo(W*.62,H);p.lineTo(W,H);p.lineTo(W,H-32*mm);p.lineTo(W*.76,H-32*mm);p.close();c.drawPath(p,stroke=0,fill=1)
    _logo(c,client,10*mm,H-26*mm,42*mm,17*mm); c.setStrokeColor(colors.HexColor('#6680a4')); c.line(58*mm,H-27*mm,58*mm,H-7*mm)
    # Header text is fitted, never hardcoded: a very long client name (or a
    # long address) must shrink/wrap inside its own box instead of running
    # under the right-hand "SALARY SLIP" block or off the sheet.
    _right_block_w = max(
        c.stringWidth('SALARY SLIP', _BOLD, 19),
        c.stringWidth(f'{calendar.month_name[batch.month].upper()} {batch.year}', _BOLD, 10.5),
    )
    _hdr_x = 68 * mm
    _hdr_w = (W - 10 * mm - _right_block_w - 6 * mm) - _hdr_x
    c.setFillColor(colors.white)
    # Wraps to a second line before it shrinks, so a 60-character company
    # name stays readable instead of being ellipsized down to nothing.
    draw_block(c, _hdr_x, H - 13 * mm, (client.name or '').upper(), _BOLD, 14,
               _hdr_w, max_lines=2, min_size=8.5, leading_ratio=1.15)
    _icon(c, 'map-pin', 68 * mm, H - 25 * mm, 5 * mm, '#cfe0fa')
    c.setFillColor(colors.HexColor('#e3ecfa'))
    draw_block(
        c, 75 * mm, H - 22.5 * mm, (client.address or 'Chartered Accountants'),
        _FONT, 8.5, _hdr_w - 7 * mm, max_lines=2, min_size=6.2,
    )
    c.setFont(_BOLD,19);c.setFillColor(colors.white);c.drawRightString(W-10*mm,H-14*mm,'SALARY SLIP');c.setFont(_BOLD,10.5);c.setFillColor(colors.HexColor('#72b2ff'));c.drawRightString(W-10*mm,H-22*mm,f'{calendar.month_name[batch.month].upper()} {batch.year}')

    # Employee details card.
    y=H-37*mm; dh=82*mm; _round(c,margin,y-dh,content,dh,'#ffffff')
    c.setFillColor(colors.HexColor('#f4f7fc'));c.roundRect(margin+.5,y-12*mm,content-1,12*mm,4*mm,stroke=0,fill=1);c.rect(margin+.5,y-12*mm,content-1,8*mm,stroke=0,fill=1)
    # Direct navy outline icon, consistent with the other section headings.
    _icon(c, 'employee-details', margin + 5 * mm, y - 10.3 * mm, 8.5 * mm, _NAVY, 1.8)
    c.setFont(_BOLD,10.5);c.setFillColor(colors.HexColor(_NAVY));c.drawString(margin+16*mm,y-7.4*mm,'EMPLOYEE DETAILS')
    gx=margin+5*mm; mid=margin+content/2; c.setStrokeColor(colors.HexColor('#dce5f0'));c.line(mid,y-15*mm,mid,y-dh+5*mm)
    pairs=[('id','Employee Code',employee.employee_code,'person','Employee Name',employee.full_name),('briefcase','Designation',employee.position or '—','building','Department',employee.department or '—'),('card','PAN Number',employee.pan_number or '—','mail','Email',employee.email or '—'),('calendar','Date of Joining',str(employee.hire_date or '—'),'rupee','CTC (Annual)',ctc),('days-in-month','Days in Month',_days(record.days_in_month),'calendar-clock','Working Days',_days(record.actual_working_days)),('plane','Paid Leave',_leave(record.paid_leave_days),'lop-days','LOP Days',_leave(record.lop_days))]
    ry=y-25*mm
    for a,b,d,e,f,g in pairs:
        _draw_detail_row(c,ry,gx,mid-4*mm,a,b,d);_draw_detail_row(c,ry,mid+5*mm,margin+content-5*mm,e,f,g);ry-=9.25*mm

    # Earnings / deductions: same fields and calculations as the original renderer.
    def rows(spec): return [(name,_money(value) or '0.00',None) for name,value,optional in spec if not(optional and value==0)]
    earn=rows([('Basic + DA',record.basic_da,False),('HRA',record.hra,False),('Leave Travel Allowance',record.lta,True),('Special Allowance',record.special_allowance,False),('NPS Allowance',record.nps_allowance_earned,True),('Variable Pay',record.variable_pay,True),('Commission / Other',record.commission_other,True),('Salary Advance Given',record.salary_advance_disbursed,True),('On Hold Released',record.on_hold_released,True),('Reimbursement',record.reimbursements,True),('Arrears',record.arrears,True)])
    ded=rows([('EPF',record.epf,not pf_opted),('VPF',record.vpf,True),('VPF Arrears',record.vpf_arrears,True),('Professional Tax',record.professional_tax,False),('TDS',record.tds,False),('NPS Deduction',record.nps_deduction,True),('NPS Deduction – Arrears',record.nps_deduction_arrears,True),('Loan Deduction',record.loan_deduction,True),('Salary Advance Recovered',record.salary_advance_recovered,True),('On Hold Deducted',record.on_hold_deducted,True),('LWF',record.lwf,True),('Other Deduction',record.other_deduction,True)])
    earn += [('GROSS SALARY',_money(record.gross_salary) or '0.00','bold'),('EARNED SALARY',_money(record.earned_salary) or '0.00','total')]
    while len(ded)<len(earn)-1: ded.append(('', '', None))
    ded += [('TOTAL DEDUCTIONS',_money(record.total_deductions) or '0.00','total')]
    cy=y-dh-5*mm; card_w=(content-6*mm)/2; card_h=12*mm+len(earn)*8*mm
    _draw_money_card(c,margin,cy-card_h,card_w,card_h,_GREEN,_GREEN_T,'EARNINGS','wallet',earn);_draw_money_card(c,margin+card_w+6*mm,cy-card_h,card_w,card_h,_RED,_RED_T,'DEDUCTIONS','shield',ded)

    # Net, amount words and security cards retain the reference hierarchy.
    # Net salary is a single calm take-home panel instead of a heavy banner.
    _employer_pf_note(c, structure, W/2, cy-card_h-8*mm)
    ny=cy-card_h-12*mm; nh=25*mm
    _round(c, margin, ny-nh, content, nh, '#ffffff', '#d7e3ef', 5*mm, .8)
    c.setFillColor(colors.HexColor('#edf8f0'))
    c.roundRect(margin+4*mm, ny-nh+4*mm, content-8*mm, nh-8*mm, 3*mm, stroke=0, fill=1)
    c.setFont(_FONT,8.8);c.setFillColor(colors.HexColor('#397053'))
    c.drawString(margin+10*mm,ny-8*mm,'NET SALARY (TAKE-HOME)')
    c.setFont(_BOLD,22);c.setFillColor(colors.HexColor(_GREEN))
    c.drawString(margin+10*mm,ny-19*mm,'₹'+(_money(record.net_salary) or '0.00'))
    wy=ny-nh-5*mm; wh=20*mm;_round(c,margin,wy-wh,content,wh,'#ffffff')
    # Keep the currency mark light: no circular container, only the section's
    # green ₹ outline.  This removes the competing round background.
    _icon(c, 'rupee', margin + 6.5 * mm, wy - 14.5 * mm, 9.5 * mm, _GREEN, 1.8)
    c.setFont(_BOLD,8.6);c.setFillColor(colors.HexColor(_GREEN));c.drawString(margin+25*mm,wy-8*mm,'AMOUNT IN WORDS');c.setFont(_BOLD,9.5);c.setFillColor(colors.HexColor(_TEXT));c.drawString(margin+25*mm,wy-14*mm,amount_in_words(record.net_salary))
    # The system-generated note is supporting commentary, not a separate
    # card—keep its space but deliberately omit a surrounding border.
    fy=wy-wh-4*mm;fh=20*mm
    # Centre the icon + note as a single supporting-message group.
    note = 'This is a system-generated, password-protected salary slip and does not require a signature.'
    note_size, note_icon, note_gap = 7.7, 5.8 * mm, 2.2 * mm
    note_width = pdfmetrics.stringWidth(note, _FONT, note_size)
    note_x = margin + (content - note_icon - note_gap - note_width) / 2
    _icon(c, 'shield-lock', note_x, fy - 12.7 * mm, note_icon, _NAVY, 1.65)
    c.setFont(_FONT, note_size);c.setFillColor(colors.HexColor('#475569'))
    c.drawString(note_x + note_icon + note_gap, fy-10*mm, note)
    c.showPage();c.save();return buf.getvalue()


def _encrypt_pdf_inplace(path: Path, password: str) -> None:
    try:
        from pypdf import PdfReader, PdfWriter
        reader=PdfReader(str(path)); writer=PdfWriter()
        for page in reader.pages: writer.add_page(page)
        writer.encrypt(password)
        with path.open('wb') as file: writer.write(file)
    except ImportError: return


def generate_payslip_pdf(record: PayslipRecord) -> str:
    client, employee = record.batch.client, record.employee
    client_slug = slugify(client.name) or f"client-{client.id}"
    month_folder = f"{record.batch.month:02d}-{calendar.month_name[record.batch.month]}"
    media_root = getattr(settings, 'MEDIA_ROOT', '/tmp/media') if settings.configured else '/tmp/media'
    output = Path(media_root) / 'payslips' / client_slug / str(record.batch.year) / month_folder
    output.mkdir(parents=True,exist_ok=True)
    path=output/f'{employee.employee_code}.pdf'
    # Password = first four letters of first name (uppercase) + PAN digits.
    # Example: Rahul Sharma / AFDHP1234S → RAHU1234.
    password=_password_for(record)
    encryption=StandardEncryption(userPassword=password, ownerPassword=password,
                                  canPrint=1, canModify=0, canCopy=0, canAnnotate=0)
    path.write_bytes(_build_pdf_bytes(record, encryption=encryption))
    record.pdf_path=str(path);record.pdf_password=password;record.status=PayslipRecord.STATUS_APPROVED;record.save(update_fields=['pdf_path','pdf_password','status','updated_at'])
    return str(path)