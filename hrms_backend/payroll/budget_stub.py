"""
payroll/budget_stub.py

The original payroll module read firm-wide revenue for the current period
from an `apps.budget` app that isn't present in this project backup.
This stub keeps the API response shape (period, revenue) intact — both
values simply come back None until a real budget module is wired in,
instead of the request failing.
"""


def get_budget_period_revenue():
    return None, None
