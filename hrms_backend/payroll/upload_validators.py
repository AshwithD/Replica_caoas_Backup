"""
payroll/upload_validators.py

Local replacement for the missing apps.core.upload_validators module.
Kept inside the payroll module only.
"""

MAX_EXCEL_ROWS = 2000


class ExcelTooLargeError(Exception):
    pass


def enforce_max_rows(worksheet, max_rows: int = MAX_EXCEL_ROWS):
    row_count = worksheet.max_row or 0
    if row_count > max_rows:
        raise ExcelTooLargeError(
            f"Excel file has {row_count} rows, which exceeds the maximum of {max_rows} allowed rows."
        )
