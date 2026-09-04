"""Shared text-fitting helpers for payslip PDF headers.

WHY THIS EXISTS
---------------
Every payslip design draws the client's name and address with a fixed font
size at a fixed x/y. That is fine for "Acme Pvt Ltd", but real client data
looks like:

    Global Logistics and Supply Chain Solutions International Limited
    No.423 "Krishna", 8th Cross, 5, Main, 60 Feet Rd, NGEF Layout,
    Mallathahalli, Bengaluru, Karnataka 560056

At a hardcoded 22-24pt that name runs off the page (or straight through the
"SALARY SLIP" label / the month pill / the vertical divider), and the address
— drawn as a single unwrapped line, sometimes hard-sliced with ``[:50]`` —
either overflows the sheet or gets silently truncated mid-word. Both make the
PDF look different for every client, which is exactly the inconsistency we
need to remove.

THE SOLUTION (three rules, applied by every design through these helpers)
-------------------------------------------------------------------------
1. **Never draw text wider than its box.** ``fit_font_size()`` measures the
   string with ``canvas.stringWidth`` and shrinks the font (down to a floor)
   until it fits — the layout box stays identical for every client, only the
   type size flexes.
2. **Wrap, don't slice.** ``wrap_lines()`` breaks on word boundaries into at
   most N lines, and only ellipsizes ("…") if the text still doesn't fit at
   the smallest allowed size — so an address degrades gracefully instead of
   being cut mid-word.
3. **Reserve the box up-front.** Because the caller passes an explicit
   ``max_width`` (and, for blocks, ``max_lines``), the header height never
   changes: nothing below it can be pushed off the page.

All helpers are pure ReportLab canvas operations — no new dependencies, no
model access — so any design module can import them.
"""
from __future__ import annotations

ELLIPSIS = "\u2026"


def fit_font_size(c, text, font, max_size, max_width, min_size=6.0, step=0.25):
    """Largest size in [min_size, max_size] at which `text` fits `max_width`."""
    if not text:
        return max_size
    size = float(max_size)
    while size > min_size and c.stringWidth(text, font, size) > max_width:
        size -= step
    return max(size, min_size)


def truncate_to_width(c, text, font, size, max_width):
    """Hard-truncate with an ellipsis — last resort when even wrapping fails."""
    if not text or c.stringWidth(text, font, size) <= max_width:
        return text
    trimmed = text
    while trimmed and c.stringWidth(trimmed + ELLIPSIS, font, size) > max_width:
        trimmed = trimmed[:-1]
    return (trimmed.rstrip() + ELLIPSIS) if trimmed else ""


def wrap_lines(c, text, font, size, max_width, max_lines=2):
    """Word-wrap `text` into at most `max_lines` lines of `max_width`.

    Honours any newlines already present in the stored address, then wraps
    each of those on word boundaries. Overflow is ellipsized on the last
    line rather than dropped silently.
    """
    if not text:
        return []
    words = []
    for chunk in str(text).splitlines():
        words.extend(chunk.split())
    if not words:
        return []

    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if c.stringWidth(candidate, font, size) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
            if len(lines) == max_lines:
                break
    if len(lines) < max_lines and current:
        lines.append(current)

    # Anything that didn't fit gets folded onto the final line as an ellipsis.
    consumed = " ".join(lines)
    if len(" ".join(words)) > len(consumed):
        lines[-1] = truncate_to_width(c, lines[-1] + " " + ELLIPSIS, font, size, max_width)
    return [truncate_to_width(c, ln, font, size, max_width) for ln in lines]


def draw_fitted(c, x, y, text, font, max_size, max_width, min_size=6.0, align="left"):
    """Draw one line, auto-shrunk (then ellipsized) to fit `max_width`.

    `align` is "left" | "center" | "right"; for center/right, `x` is the
    centre/right edge of the box. Returns the font size actually used, so
    callers can advance their cursor consistently.
    """
    text = (text or "").strip()
    if not text:
        return max_size
    size = fit_font_size(c, text, font, max_size, max_width, min_size)
    text = truncate_to_width(c, text, font, size, max_width)
    c.setFont(font, size)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)
    return size


def draw_block(c, x, y, text, font, max_size, max_width, max_lines=2,
               min_size=6.0, leading_ratio=1.25, align="left",
               single_line_ratio=0.62):
    """Draw a wrapped text block that always fits its reserved box.

    Tries the largest font size at which the text wraps into `max_lines`
    lines; falls back to `min_size` with an ellipsis. Returns the y of the
    baseline *below* the block so the caller's layout stays deterministic
    regardless of how long the client's address is.
    """
    text = (text or "").strip()
    if not text:
        return y

    # Prefer ONE line when a modest shrink is enough — "Acme Pvt Ltd" should
    # stay on a single line rather than wrapping just because it is 2mm wide
    # at the maximum size. Only genuinely long strings fall through to
    # wrapping. This is what keeps short and long clients looking alike.
    single = fit_font_size(c, text, font, max_size, max_width,
                           min_size=max_size * single_line_ratio)
    if c.stringWidth(text, font, single) <= max_width:
        c.setFont(font, single)
        if align == "center":
            c.drawCentredString(x, y, text)
        elif align == "right":
            c.drawRightString(x, y, text)
        else:
            c.drawString(x, y, text)
        return y - single * leading_ratio

    size = float(max_size)
    lines = wrap_lines(c, text, font, size, max_width, max_lines)
    # Shrink until the whole string genuinely fits within max_lines
    # (i.e. wrapping no longer needs to ellipsize anything).
    while size > min_size and any(ELLIPSIS in ln for ln in lines):
        size -= 0.25
        lines = wrap_lines(c, text, font, size, max_width, max_lines)

    c.setFont(font, size)
    leading = size * leading_ratio
    cursor = y
    for line in lines:
        if align == "center":
            c.drawCentredString(x, cursor, line)
        elif align == "right":
            c.drawRightString(x, cursor, line)
        else:
            c.drawString(x, cursor, line)
        cursor -= leading
    return cursor
