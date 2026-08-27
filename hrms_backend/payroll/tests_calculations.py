"""
Tests for apps.payroll.calculations: is_in_probation() and
calculate_payslip_fields().

calculate_payslip_fields() is a pure function — no DB access, per its own
docstring — so `structure` is stood in here with a plain object rather
than a real EmployeeSalaryStructure, and comp_off/leave opening balances
are passed directly instead of being looked up. This deliberately does
NOT test the caller code that resolves those balances/probation status
from the DB (that lives in views.py / the batch-processing code, not
here) — only the calculation itself.

Run with: python manage.py test apps.payroll
"""

import datetime
from decimal import Decimal

from django.test import SimpleTestCase

from payroll.calculations import calculate_payslip_fields, is_in_probation


class FakeStructure:
    """Stand-in for EmployeeSalaryStructure — only the attributes
    calculate_payslip_fields() actually reads."""

    def __init__(
        self,
        original_basic_da=Decimal("20000"),
        original_hra=Decimal("10000"),
        original_special_allowance=Decimal("0"),
        original_lta=Decimal("0"),
        nps_allowance=Decimal("0"),
        monthly_gross=Decimal("40000"),
        vpf=Decimal("0"),
        pf_opted=True,
    ):
        self.original_basic_da = original_basic_da
        self.original_hra = original_hra
        self.original_special_allowance = original_special_allowance
        self.original_lta = original_lta
        self.nps_allowance = nps_allowance
        self.monthly_gross = monthly_gross
        self.vpf = vpf
        self.pf_opted = pf_opted


class IsInProbationTests(SimpleTestCase):
    def test_none_date_of_joining_is_not_probation(self):
        self.assertFalse(is_in_probation(None, 2026, 6))

    def test_well_within_probation(self):
        # Joined 1 Jan 2026 — 2 months in, still on probation.
        self.assertTrue(is_in_probation(datetime.date(2026, 1, 1), 2026, 3))

    def test_well_past_probation(self):
        # Joined 1 Jan 2026 — 10 months in, long past 6-month mark.
        self.assertFalse(is_in_probation(datetime.date(2026, 1, 1), 2026, 11))

    def test_probation_ends_exactly_on_boundary_month(self):
        # Joined 1 Jan 2026 -> 6-month mark is 1 Jul 2026. The payroll
        # month whose 1st falls exactly on that date counts as
        # POST-probation (per the "on/before" rule in the docstring).
        self.assertFalse(is_in_probation(datetime.date(2026, 1, 1), 2026, 7))

    def test_month_immediately_before_boundary_is_still_probation(self):
        self.assertTrue(is_in_probation(datetime.date(2026, 1, 1), 2026, 6))

    def test_joining_day_31_rolls_into_shorter_month_correctly(self):
        # Joined 31 Jan 2026 -> +6 months = 31 Jul 2026 (Jul has 31 days,
        # no clamping needed here, but this guards the calendar.monthrange
        # clamp logic doesn't break a normal case).
        self.assertTrue(is_in_probation(datetime.date(2026, 1, 31), 2026, 7))
        self.assertFalse(is_in_probation(datetime.date(2026, 1, 31), 2026, 8))

    def test_joining_day_31_clamps_in_shorter_target_month(self):
        # Joined 31 Aug 2026 -> +6 months lands in February 2027, which
        # only has 28 days — end_day must clamp to 28, not raise.
        self.assertFalse(is_in_probation(datetime.date(2026, 8, 31), 2027, 3))
        self.assertTrue(is_in_probation(datetime.date(2026, 8, 31), 2027, 2))


class CalculatePayslipFieldsTests(SimpleTestCase):
    def _row(self, **overrides):
        base = {
            "actual_working_days": Decimal("30"),
            "lop_days": Decimal("0"),
            "extra_working_days": Decimal("0"),
            "paid_leave_days": Decimal("0"),
        }
        base.update(overrides)
        return base

    def test_full_attendance_no_lop_prorates_to_full_amount(self):
        result = calculate_payslip_fields(
            FakeStructure(), self._row(), month=5, days_in_month=30,
        )
        self.assertEqual(result["basic_da"], Decimal("20000.00"))
        self.assertEqual(result["hra"], Decimal("10000.00"))
        self.assertEqual(result["leave_closing_balance"], Decimal("22") / Decimal("12"))
        self.assertEqual(result["comp_off_closing_balance"], Decimal("0"))

    def test_structure_none_zeroes_derived_fields(self):
        result = calculate_payslip_fields(
            None, self._row(), month=5, days_in_month=30,
        )
        self.assertEqual(result["basic_da"], Decimal("0.00"))
        self.assertEqual(result["hra"], Decimal("0.00"))
        self.assertEqual(result["gross_salary"], Decimal("0"))

    # ---- Probation: every LOP/paid-leave day is a REAL deduction ----

    def test_probation_lop_reduces_effective_present_days(self):
        # 2 LOP days out of a 30-day month, probation -> actual_working_days
        # only (28), no leave/comp-off offset at all.
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(actual_working_days=Decimal("28"), lop_days=Decimal("2")),
            month=5, days_in_month=30, is_probation=True,
        )
        # 28/30 of basic_da 20000 = 18666.666... -> 18666.67
        self.assertEqual(result["basic_da"], Decimal("18666.67"))
        self.assertEqual(result["leave_accrued"], Decimal("0"))
        self.assertEqual(result["comp_off_closing_balance"], Decimal("0"))

    def test_probation_discards_extra_working_days_instead_of_banking(self):
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(extra_working_days=Decimal("3")),
            month=5, days_in_month=30, is_probation=True,
            comp_off_opening_balance=Decimal("1"),
        )
        # Frozen at opening balance — the 3 extra days are NOT banked.
        self.assertEqual(result["comp_off_closing_balance"], Decimal("1"))

    # ---- Non-probation: LOP is unconditionally paid, ledger absorbs it ----

    def test_non_probation_lop_covered_by_leave_balance_no_pay_cut(self):
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(actual_working_days=Decimal("29"), lop_days=Decimal("1")),
            month=5, days_in_month=30,
            leave_opening_balance=Decimal("5"),
        )
        # Full pay despite 1 LOP day — leave balance absorbs it.
        self.assertEqual(result["basic_da"], Decimal("20000.00"))
        self.assertEqual(result["leave_used"], Decimal("1"))
        # 5 opening + 22/12 accrued - 1 used
        expected_closing = Decimal("5") + (Decimal("22") / Decimal("12")) - Decimal("1")
        self.assertEqual(result["leave_closing_balance"], expected_closing)

    def test_lop_exceeding_leave_falls_through_to_comp_off(self):
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(actual_working_days=Decimal("25"), lop_days=Decimal("5")),
            month=5, days_in_month=30,
            leave_opening_balance=Decimal("2"),
            comp_off_opening_balance=Decimal("10"),
        )
        # leave_available = 2 + 22/12 ≈ 3.833; leave_used = min(5, 3.833) = 3.833
        # remaining_after_leave ≈ 1.1667, comp_off covers it fully (10 available)
        self.assertEqual(result["basic_da"], Decimal("20000.00"))  # still fully paid
        self.assertEqual(result["comp_off_days_used"], Decimal("5") - result["leave_used"])
        self.assertEqual(result["comp_off_closing_balance"], Decimal("10") - result["comp_off_days_used"])

    def test_lop_exceeding_both_ledgers_becomes_negative_leave_balance(self):
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(actual_working_days=Decimal("20"), lop_days=Decimal("10")),
            month=5, days_in_month=30,
            leave_opening_balance=Decimal("0"),
            comp_off_opening_balance=Decimal("0"),
        )
        # Almost nothing to draw on — most of the 10 LOP days become debt.
        self.assertLess(result["leave_closing_balance"], Decimal("0"))
        self.assertEqual(result["comp_off_closing_balance"], Decimal("0"))
        # Still fully paid — non-probation LOP is never a real deduction.
        self.assertEqual(result["basic_da"], Decimal("20000.00"))

    def test_automatic_settlement_spare_comp_off_pays_down_leave_debt(self):
        # Prior month already left leave at -3 (carried in via opening
        # balance). This month has ample spare comp-off and no new LOP —
        # settlement should fire and clear/reduce the debt automatically.
        result = calculate_payslip_fields(
            FakeStructure(),
            self._row(actual_working_days=Decimal("30")),
            month=5, days_in_month=30,
            leave_opening_balance=Decimal("-3"),
            comp_off_opening_balance=Decimal("10"),
        )
        # leave_available = -3 + 22/12; used=0 (no LOP/paid leave this month)
        # leave_closing before settlement = leave_available (still negative)
        # settlement = min(comp_off=10, -leave_closing) -> clears it fully
        self.assertGreaterEqual(result["leave_closing_balance"], Decimal("0"))
        self.assertLess(result["comp_off_closing_balance"], Decimal("10"))

    # ---- Professional tax bracket ----

    def test_pt_zero_below_threshold(self):
        result = calculate_payslip_fields(
            FakeStructure(monthly_gross=Decimal("24999")),
            self._row(), month=4, days_in_month=30,
        )
        self.assertEqual(result["professional_tax"], Decimal("0"))

    def test_pt_february_charges_high_rate(self):
        result = calculate_payslip_fields(
            FakeStructure(monthly_gross=Decimal("30000")),
            self._row(), month=2, days_in_month=28,
        )
        self.assertEqual(result["professional_tax"], Decimal("300"))

    def test_pt_other_months_charge_low_rate(self):
        result = calculate_payslip_fields(
            FakeStructure(monthly_gross=Decimal("30000")),
            self._row(), month=4, days_in_month=30,
        )
        self.assertEqual(result["professional_tax"], Decimal("200"))

    def test_pt_uses_contracted_gross_not_lop_reduced_payout(self):
        # Gross is above threshold on paper, even though this month's LOP
        # would reduce actual payout — PT bracket must NOT flip because of
        # LOP (per docstring: contracted/unprorated salary decides).
        result = calculate_payslip_fields(
            FakeStructure(monthly_gross=Decimal("30000")),
            self._row(actual_working_days=Decimal("10"), lop_days=Decimal("20")),
            month=4, days_in_month=30,
            leave_opening_balance=Decimal("0"), comp_off_opening_balance=Decimal("0"),
        )
        self.assertEqual(result["professional_tax"], Decimal("200"))

    # ---- EPF ----

    def test_epf_opted_out_is_zero(self):
        result = calculate_payslip_fields(
            FakeStructure(pf_opted=False), self._row(), month=5, days_in_month=30,
        )
        self.assertEqual(result["epf"], Decimal("0"))

    def test_epf_capped_at_ceiling_rate_even_with_high_basic_da(self):
        result = calculate_payslip_fields(
            FakeStructure(original_basic_da=Decimal("50000"), pf_opted=True),
            self._row(), month=5, days_in_month=30,
        )
        # 12% of 15000 ceiling = 1800, not 12% of 50000 = 6000
        self.assertEqual(result["epf"], Decimal("1800.00"))

    def test_epf_uses_contracted_basic_da_not_prorated(self):
        # Half attendance still charges EPF on the full contracted basic_da
        # (per docstring: "CONTRACTED (unprorated) basic_da").
        result = calculate_payslip_fields(
            FakeStructure(original_basic_da=Decimal("10000"), pf_opted=True),
            self._row(actual_working_days=Decimal("15")),
            month=5, days_in_month=30,
        )
        self.assertEqual(result["epf"], Decimal("1200.00"))  # 12% of 10000, unprorated

    # ---- Special allowance / LTA / NPS: baseline + excel top-up, additive ----

    def test_special_allowance_baseline_and_excel_topup_are_additive(self):
        result = calculate_payslip_fields(
            FakeStructure(original_special_allowance=Decimal("2000")),
            self._row(special_allowance=Decimal("500")),
            month=5, days_in_month=30,
        )
        self.assertEqual(result["special_allowance"], Decimal("2500.00"))
        