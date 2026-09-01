"""
payroll/portal/validators.py

Payload schema validation for portal submission items. Shared by the
serializers (client-side checks) and the apply pipeline (authoritative
server-side checks) so the two never drift apart.
"""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation

# Required payload keys per item type.
REQUIRED_KEYS = {
    "NEW_EMPLOYEE": ["employee_code", "first_name", "ctc_annual"],
    "REVISION": ["employee_id", "effective_from", "ctc_annual"],
    "EXIT": ["employee_id", "last_working_date"],
    "SALARY_HOLD": ["employee_id", "amount", "release_month", "release_year"],
    "ADVANCE": ["employee_id", "total_amount", "tenure_months"],
    "ONE_TIME_EARNING": ["employee_id", "amount"],
    "ONE_TIME_DEDUCTION": ["employee_id", "amount"],
    "NOTE": ["text"],
}


def required_keys(item_type: str) -> list:
    return REQUIRED_KEYS.get(item_type, [])


def parse_date(value) -> date:
    """Accepts a date, datetime, or string (YYYY-MM-DD / DD/MM/YYYY / DD-MM-YYYY)."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        value = value.strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
    raise ValueError(f"Invalid date: {value!r} (expected YYYY-MM-DD).")


def to_decimal(value, field_name: str) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number, got {value!r}.")


def to_positive_int(value, field_name: str) -> int:
    try:
        result = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a whole number, got {value!r}.")
    if result < 1:
        raise ValueError(f"{field_name} must be at least 1.")
    return result
