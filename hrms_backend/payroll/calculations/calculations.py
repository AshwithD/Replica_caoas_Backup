"""apps/payroll/calculations/calculations.py

Computes the salary-component fields (basic_da, hra, basic_for_pf, epf,
vpf, professional_tax, gross_salary, earned_salary) that used
to be expected as columns in the monthly payroll excel. The real sheet
only carries attendance figures and a handful of allowances/deductions
(see excel_parser.VARIABLE_COLUMN_MAPPING) — everything else is derived
here from the employee's EmployeeSalaryStructure (static/contracted
values) plus that month's attendance.

Formulas confirmed with the user, reusing the logic from the retired
frontend PayrollTable.jsx, adapted to read from EmployeeSalaryStructure
instead of raw employee fields:

  - basic_da / hra: prorated by
  (effective_present_days / days_in_month) against the
  structure's contracted (static) value.

  effective_present_days consists of:
    - actual_working_days
    - approved paid_leave_days
    - leave days automatically used to cover LOP
    - comp-off days automatically used to cover any remaining LOP

  Only LOP that cannot be covered by leave or comp-off reduces
  effective_present_days (and therefore salary).
  - basic_for_pf: PF wage base, capped at the statutory EPF wage ceiling
    (currently Rs 15,000/month — see PF_WAGE_CEILING below; this ceiling
    is reportedly under revision to Rs 25,000 as of 2026, hence the named
    constant rather than a scattered magic number).
  - epf: if the structure's pf_opted flag is True, 12% of the structure's
    CONTRACTED (unprorated) basic_da, capped at 12% of PF_WAGE_CEILING
    (currently Rs 1,800/month) — this is the EMPLOYEE's own share and is
    a real monthly deduction; only the EMPLOYER's matching Rs 1,800
    share was carved out of Special Allowance/HRA/Basic+DA at
    CTC-structuring time (see EmployeeSalaryStructure.pf_opted), so
    charging this here does not double-count anything. If pf_opted is
    False, epf is 0 — no reserve was carved out anywhere for this
    employee and nothing is deducted from them either.
  - vpf: flat value from EmployeeSalaryStructure.vpf, not prorated — no
    longer needs to come from the excel at all.
  - professional_tax: Karnataka PT Amendment Act 2025 (effective 1 Apr
    2025). Nil if monthly_gross < Rs 25,000 (contracted/unprorated salary
    decides the bracket, not this month's LOP-reduced payout — an
    employee's PT liability shouldn't flip month to month because of
    unpaid leave). If monthly_gross >= Rs 25,000: Rs 300 in February,
    Rs 200 every other month (Apr-Jan, Mar) — totals the statutory
    Rs 2,500/year cap.
  - gross_salary: EmployeeSalaryStructure.monthly_gross, unprorated (the
    "if fully present" figure).
  - night_shift: DEPRECATED, no longer computed. Night-shift pay is now
    expected to be folded into another field before upload.
  - earned_salary: sum of prorated basic_da + hra, plus lta, special
    allowance, nps_allowance_earned, variable_pay, commission_other,
    and arrears.

General leave ledger (CL/SL/EL — separate from the Comp-Off ledger):

  - Employees accrue 22/12 leave days every month after probation.
    Employees in probation accrue no leave.

  - Approved Paid Leave (paid_leave_days):
      * is entered by HR through the monthly payroll upload.
      * reduces the employee's leave balance.
      * counts as paid attendance and therefore does NOT reduce salary.

  - Leave balance is used automatically to cover any uploaded LOP
    (Leave Without Pay). This automatic adjustment is stored as
    leave_used.

  - If LOP still remains after consuming the available leave balance,
    the remaining LOP is automatically covered using the employee's
    available Comp-Off balance (comp_off_days_used).

  - Only LOP that remains after both leave and Comp-Off are exhausted
    reduces effective_present_days and therefore reduces salary.

  - Leave closing balance:
        opening_leave
      + monthly_accrual
      - approved_paid_leave
      - leave_used

  - Comp-Off closing balance:
        opening_comp_off
      + extra_working_days
      - comp_off_days_used

  - Leave cashout is handled separately through LeaveAdjustment and is
    outside the scope of this calculation.
"""

from datetime import date
from decimal import Decimal

# Statutory EPF wage ceiling. Currently Rs 15,000/month; reportedly under
# government revision toward Rs 25,000 as of 2026 — kept as one named
# constant so that change is a one-line edit, not a hunt through the code.
PF_WAGE_CEILING = Decimal("15000")
EPF_RATE = Decimal("0.12")

PT_HIGH = Decimal("300")  # charged in PT_HIGH_MONTH only
PT_OTHER = Decimal("200")
PT_HIGH_MONTH = 2  # February — Karnataka PT Amendment Act 2025 puts the Rs 300 charge here, not March
PT_THRESHOLD = Decimal("25000")  # monthly_gross below this is PT-exempt

# General leave accrual: 22 annual leave days / 12 months. Kept as an
# exact Decimal fraction (not pre-rounded to e.g. 1.83 or 1.8) so
# leave_closing_balance never drifts from rounding error month to month.
LEAVE_ANNUAL_DAYS = Decimal("22")
LEAVE_MONTHLY_ACCRUAL = LEAVE_ANNUAL_DAYS / Decimal("12")


def is_in_probation(date_of_joining, year: int, month: int) -> bool:
    """
    Whether an employee is still within their 6-month probation period
    for the given payroll month/year. A whole payroll month counts as
    POST-probation once the 6-month mark falls on/before the 1st of that
    month — no partial-month/prorated accrual, matching how every other
    ledger in this app already works on whole-calendar-month granularity
    (proration, PT bracket, comp-off). date_of_joining may be None (not
    every Employee record has one set) — treated as "not on probation"
    since there's nothing to check against.
    """
    if date_of_joining is None:
        return False

    # date_of_joining + 6 months, done without a dateutil dependency.
    import calendar

    total_months = date_of_joining.month - 1 + 6
    end_year = date_of_joining.year + total_months // 12
    end_month = total_months % 12 + 1
    end_day = min(date_of_joining.day, calendar.monthrange(end_year, end_month)[1])
    probation_end = date(end_year, end_month, end_day)

    first_of_payroll_month = date(year, month, 1)
    return first_of_payroll_month < probation_end


def calculate_payslip_fields(
    structure, row: dict, month: int, days_in_month: int,
    comp_off_opening_balance=Decimal("0"),
    leave_opening_balance=Decimal("0"),
    is_probation=False,
) -> dict:
    """


          Attendance calculation order (non-probation):

      1. Start with Actual Working Days.
      2. Paid Leave Days + LOP Days are UNCONDITIONALLY paid — added in
         full to effective_present_days. Neither ever reduces salary for
         a non-probation employee; any real pay deduction is a deliberate
         manual edit, never automatic.
      3. That combined pool is still tracked against the ledger for
         bookkeeping: drawn from Leave Balance first, then Comp-Off.
      4. Whatever neither can cover becomes a NEGATIVE leave balance
         (a tracked debt) — correctable later by granting extra Comp-Off
         days (extra_working_days).
      5. AUTOMATIC SETTLEMENT: if, after step 3-4, comp-off still has any
         SPARE balance left over (comp_off_closing_balance > 0) and leave
         is in debt (leave_closing_balance < 0) — whether that debt is
         from this month's shortfall or carried over from a prior month —
         the spare comp-off automatically pays it down, no human step
         required. Runs every calculation, not just when a deficit and a
         spare happen to land in the same month.

      Probation employees cannot use leave or Comp-Off to offset LOP —
      every day of Paid Leave/LOP is a genuine, real deduction from pay
      for them (only Actual Working Days counts).


    structure: the employee's EmployeeSalaryStructure (may be None).
    row:       parsed excel row (attendance figures + uploaded allowances/deductions).
    month:     payroll month (1-12), for the PT rule.
    days_in_month: calendar days in the payroll month.
    comp_off_opening_balance: this employee's comp_off_closing_balance from
               their MOST RECENT PRIOR PayslipRecord (0 if none exists yet).
               Caller looks this up via a DB query before calling — kept
               out of this function so it stays a pure calculation with no
               DB access of its own.
    leave_opening_balance: this employee's leave_closing_balance from their
               MOST RECENT PRIOR PayslipRecord (0 if none exists yet),
               same caller-resolved pattern as comp_off_opening_balance.
    is_probation: whether this employee is within their 6-month probation
               period THIS payroll month. Caller resolves this from
               employee.date_of_joining (a whole payroll month counts as
               post-probation once the 6-month mark falls on/before the
               1st of that month) — kept out of this function for the
               same DB-free-calculation reason as the two balances above.

    Returns a dict of the computed fields, ready to spread into
    PayslipRecord.objects.create(**row, **computed).

    Comp-off ledger (separate from any general CL/SL/EL leave pool — this
    is specifically for "extra days worked" banking, confirmed against a
    real payroll sheet screenshot which has a dedicated "Comp-Off
    Available" column distinct from the general leave balance):
      - comp_off_days_used = min(lop_days, opening_balance + extra_working_days)
        i.e. banked comp-off first covers this month's LOP, up to what's
        available.
      - comp_off_closing_balance = opening + extra_working_days - days_used
        (becomes next month's opening balance).
      - Those covered LOP days are added back into the proration
        numerator (effective_present_days) so the employee is actually
        PAID for them, not just informationally "not deducted" — this is
        what makes "salary will not be deducted" literally true rather
        than a cosmetic label.
    """
    days_in_month = Decimal(days_in_month)
    actual_working_days = Decimal(row.get("actual_working_days", 0))
    lop_days = Decimal(row.get("lop_days", 0))
    extra_working_days = Decimal(row.get("extra_working_days", 0))
    paid_leave_days = Decimal(row.get("paid_leave_days", 0))

    if is_probation:
        # Probation employees accrue no leave and cannot offset LOP with
        # either the leave balance or comp-off — every LOP day is a real
        # deduction. The leave balance just sits there untouched (opening
        # carries forward with 0 accrued, 0 used). Comp-off is frozen the
        # same way: any extra_working_days uploaded during probation is
        # discarded outright, not banked for later — the closing balance
        # equals the opening balance every month until probation ends.
        leave_accrued = Decimal("0")
        leave_used = Decimal("0")
        leave_closing_balance = leave_opening_balance
        # extra_working_days is discarded during probation — comp-off
        # ledger stays frozen at the opening balance until probation ends.
        comp_off_days_used = Decimal("0")
        comp_off_closing_balance = comp_off_opening_balance
        effective_present_days = min(actual_working_days, days_in_month)
    else:
        leave_accrued = LEAVE_MONTHLY_ACCRUAL
        leave_available = leave_opening_balance + leave_accrued

        # Paid Leave Days and uploaded LOP Days are, for a non-probation
        # employee, UNCONDITIONALLY paid — neither ever reduces salary.
        # "Paid Leave" is paid because it was approved, and this firm's
        # policy is that the system never auto-applies a pay cut for LOP
        # either; any real deduction is a deliberate human decision (a
        # manual edit), not something calculate_payslip_fields does on
        # its own. What DOES happen is bookkeeping: both draw from a
        # single combined pool, leave balance first, then comp-off, and
        # whatever neither can cover simply becomes a NEGATIVE balance
        # (tracked as debt) rather than a deduction. That negative balance
        # can be corrected later by granting extra comp-off days
        # (extra_working_days), which offsets it directly.
        total_days_to_cover = paid_leave_days + lop_days
        leave_used = min(total_days_to_cover, max(leave_available, Decimal("0")))
        remaining_after_leave = total_days_to_cover - leave_used

        comp_off_available = comp_off_opening_balance + extra_working_days
        comp_off_days_used = min(remaining_after_leave, max(comp_off_available, Decimal("0")))
        comp_off_closing_balance = comp_off_available - comp_off_days_used

        # Whatever's left after both leave and comp-off is a shortfall
        # neither ledger could absorb — it rolls back onto the leave
        # balance as additional debt (comp-off's own closing balance
        # above is never pushed negative by this; only leave's is).
        remaining_after_comp_off = remaining_after_leave - comp_off_days_used
        leave_closing_balance = (leave_available - leave_used) - remaining_after_comp_off

        # Automatic settlement: if there's any SPARE comp-off left over
        # after covering this month's own shortfall (comp_off_closing_balance
        # > 0) AND leave is sitting in debt (leave_closing_balance < 0) —
        # whether that debt came from this month's shortfall above or was
        # carried over from a prior month via leave_opening_balance — the
        # spare comp-off automatically pays it down. No manual step: this
        # runs every calculation, not just when the deficit and the spare
        # happen to occur in the same month. Comp-off's own leave_used /
        # comp_off_days_used bookkeeping above is untouched by this — this
        # is a separate top-level transfer of whatever's left over.
        if comp_off_closing_balance > 0 and leave_closing_balance < 0:
            settlement = min(comp_off_closing_balance, -leave_closing_balance)
            comp_off_closing_balance -= settlement
            leave_closing_balance += settlement

        # Effective paid days used for salary proration. Every Paid Leave
        # Day and every uploaded LOP Day counts as paid, unconditionally —
        # only Actual Working Days + the full combined pool, capped at
        # days_in_month.
        effective_present_days = min(
            actual_working_days + total_days_to_cover,
            days_in_month,
        )

    if structure is None:
        # No salary structure set up for this employee yet — nothing to
        # prorate from. Zero out the derived fields rather than guessing;
        # the reviewer will see zeros and know to set up the structure
        # before approving, and every one of these fields is editable
        # afterward anyway.
        original_basic_da = Decimal("0")
        original_hra = Decimal("0")
        original_special_allowance = Decimal("0")
        original_lta = Decimal("0")
        original_nps_allowance = Decimal("0")
        monthly_gross = Decimal("0")
        vpf = Decimal("0")
        pf_opted = True
    else:
        original_basic_da = structure.original_basic_da
        original_hra = structure.original_hra
        original_special_allowance = structure.original_special_allowance
        original_lta = structure.original_lta
        original_nps_allowance = structure.nps_allowance
        monthly_gross = structure.monthly_gross
        vpf = structure.vpf
        pf_opted = structure.pf_opted

    proration_ratio = (effective_present_days / days_in_month) if days_in_month else Decimal("0")

    basic_da = (original_basic_da * proration_ratio).quantize(Decimal("0.01"))
    hra = (original_hra * proration_ratio).quantize(Decimal("0.01"))
    basic_for_pf = min(basic_da, PF_WAGE_CEILING)

    epf = (
        min(original_basic_da * EPF_RATE, PF_WAGE_CEILING * EPF_RATE).quantize(Decimal("0.01"))
        if pf_opted
        else Decimal("0")
    )
    if monthly_gross < PT_THRESHOLD:
        professional_tax = Decimal("0")
    else:
        professional_tax = PT_HIGH if month == PT_HIGH_MONTH else PT_OTHER

    variable_pay = Decimal("0")  # not in the real excel; editable later if needed

    # Special Allowance / LTA / NPS Allowance each have TWO possible
    # sources: a recurring baseline configured on the salary structure
    # (prorated by attendance, same as Basic DA/HRA), and an optional
    # this-month-only extra/top-up uploaded in the Excel sheet (NOT
    # prorated — treated like Arrears/Commission, a one-off addition on
    # top of the baseline). The two are additive, not either/or — an
    # employee with a structure baseline AND an Excel figure this month
    # gets both.
    special_allowance = (
        (original_special_allowance * proration_ratio).quantize(Decimal("0.01"))
        + row.get("special_allowance", Decimal("0"))
    )
    lta = (
        (original_lta * proration_ratio).quantize(Decimal("0.01"))
        + row.get("lta", Decimal("0"))
    )
    nps_allowance_earned = (
        (original_nps_allowance * proration_ratio).quantize(Decimal("0.01"))
        + row.get("nps_allowance_earned", Decimal("0"))
    )

    earned_salary = (
        basic_da + hra
        + lta
        + special_allowance
        + nps_allowance_earned
        + variable_pay
        + row.get("commission_other", Decimal("0"))
        + row.get("arrears", Decimal("0"))
    ).quantize(Decimal("0.01"))

    return {
        "basic_da": basic_da,
        "hra": hra,
        "lta": lta,
        "special_allowance": special_allowance,
        "nps_allowance_earned": nps_allowance_earned,
        "basic_for_pf": basic_for_pf,
        "epf": epf,
        "vpf": vpf,
        "professional_tax": professional_tax,
        "gross_salary": monthly_gross,
        "variable_pay": variable_pay,
        "earned_salary": earned_salary,
        "comp_off_opening_balance": comp_off_opening_balance,
        "comp_off_days_used": comp_off_days_used,
        "comp_off_closing_balance": comp_off_closing_balance,
        "leave_opening_balance": leave_opening_balance,
        "leave_accrued": leave_accrued,
        "leave_used": leave_used,
        "leave_closing_balance": leave_closing_balance,
    }