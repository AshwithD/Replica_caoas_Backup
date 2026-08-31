"""hrms_backend/payroll/models.py"""

from decimal import Decimal

from django.conf import settings
from django.db import models

from .mixins import AuditableMixin


PDF_DESIGN_CHOICES = [(i, f"Design {i}") for i in range(1, 9)]


class ClientProfile(models.Model):
    """
    Payroll-specific extension of the master `clients.Client` — the single
    source of truth for client identity lives in the Client module.

    Only payroll-owned concerns live here:
      * payroll_logo           → payslip letterhead logo (renamed from `logo`)
      * payroll_email          → payroll-only email override; empty = fall
                                 back to `client.email`
      * pdf_design             → which payslip layout (1-8) to render
      * pf_establishment_code  → PF establishment code for payslips
      * payroll_is_active      → payroll-service on/off toggle. The master
                                 `client.is_active` acts as a hard kill-switch.

    The existence of a profile row IS payroll enrollment: a client in the
    master list without a ClientProfile row is not a payroll client.
    """

    client = models.OneToOneField(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="payroll_profile",
    )

    payroll_logo = models.ImageField(upload_to="payroll/client_logos/", null=True, blank=True)
    payroll_email = models.EmailField(blank=True)
    pdf_design = models.PositiveSmallIntegerField(choices=PDF_DESIGN_CHOICES, default=1)
    pf_establishment_code = models.CharField(max_length=40, blank=True)
    payroll_is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payroll_client_profiles"

    @property
    def email(self) -> str:
        """Payroll email override with fallback to the master client email."""
        return self.payroll_email or self.client.email

    @property
    def is_effectively_active(self) -> bool:
        """Master client must be active AND the payroll toggle on."""
        return bool(self.client.is_active and self.payroll_is_active)

    def __str__(self) -> str:
        return self.client.name


class Employee(models.Model):
    """
    Payroll-local Employee record. Deliberately self-contained — payroll
    has no visibility into (and no FK to) any Employee model from another
    app. Every field here is one payroll itself actually reads.

    This will not automatically stay in sync with any HR-side employee
    record elsewhere in CAOAS — name changes, department transfers, exits
    recorded in HR won't propagate here. It's kept up to date the same way
    monthly batch records already are: via Excel upload (see
    excel_parser.py's employee-master import), not by mirroring another
    model.
    """

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    ]

    employee_code = models.CharField(max_length=50)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    pan_number = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    client = models.ForeignKey(
        "clients.Client", on_delete=models.PROTECT, related_name="payroll_employees",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payroll_employees"
        ordering = ["employee_code"]
        unique_together = ("client", "employee_code")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self) -> str:
        return f"{self.employee_code} — {self.full_name}"


class PayrollBatch(AuditableMixin, models.Model):
    AUDIT_ACTION_CREATE = "BATCH_UPLOADED"
    AUDIT_ACTION_UPDATE = "BATCH_UPDATED"

    STATUS_UPLOADED = "UPLOADED"
    STATUS_REVIEWED = "REVIEWED"
    STATUS_SENDING = "SENDING"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = [
        (STATUS_UPLOADED, "Uploaded"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_SENDING, "Sending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="payroll_batches",
    )
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPLOADED)
    source_file = models.FileField(upload_to="payroll/excel/%Y/%m/", null=True, blank=True)
    total_records = models.IntegerField(default=0)
    email_sent = models.IntegerField(default=0)
    email_failed = models.IntegerField(default=0)
    error_log = models.TextField(null=True, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payroll_batches_uploaded",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="payroll_batches_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="payroll_batches_sent",
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payroll_batches"
        unique_together = [("client", "month", "year")]
        ordering = ["-year", "-month", "-created_at"]

    def __str__(self) -> str:
        return f"{self.client} {self.month:02d}/{self.year}"


class CompOffAdjustment(AuditableMixin, models.Model):
    """
    Manual correction to an employee's comp-off balance, layered on top
    of the auto-carried PayslipRecord ledger rather than editing it in
    place — PayslipRecord.comp_off_closing_balance stays an immutable,
    auto-computed value (see PayslipRecord docstring / batch generation).

    An adjustment is "pending" until the next payroll batch is generated
    for this employee, at which point its amount is folded into that
    batch's comp_off_opening_balance and `applied_in_record` is set —
    see PayrollUploadView. Once applied, an adjustment is historical
    and no longer affects future opening-balance calculations.
    """

    AUDIT_ACTION_CREATE = "COMP_OFF_ADJUSTMENT_CREATED"
    AUDIT_TRACKED_FIELDS = ["employee_id", "amount", "reason"]

    employee = models.ForeignKey(
        "payroll.Employee", on_delete=models.CASCADE, related_name="comp_off_adjustments",
    )
    amount = models.DecimalField(
        max_digits=6, decimal_places=2,
        help_text="Signed number of days — positive to grant extra comp-off, "
                   "negative to correct/deduct.",
    )
    reason = models.TextField()
    applied_in_record = models.ForeignKey(
        "payroll.PayslipRecord", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="comp_off_adjustments_applied",
        help_text="Set once this adjustment has been folded into a payroll "
                   "batch's opening balance — null means still pending.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="comp_off_adjustments_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comp_off_adjustments"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.employee} — {self.amount:+} days"


class SalaryAdvance(AuditableMixin, models.Model):
    """
    An EMI-style salary advance plan: employee borrows `total_amount` and
    it's auto-recovered from payroll in equal-ish monthly installments
    over `tenure_months`, with no manual monthly adjustment required.

    Deliberately additive alongside SalaryAdvanceAdjustment rather than a
    replacement for it — the actual rupee movement (both the initial
    lump-sum disbursement and each month's EMI recovery) still happens as
    ordinary SalaryAdvanceAdjustment rows, which is what
    salary_advance_opening/closing_balance and batch generation already
    key off of (see PayrollUploadView). This model only tracks the plan
    itself (total, tenure, computed EMI, progress) and links back to the
    adjustments it generated via SalaryAdvanceAdjustment.advance.

    A plan is fully recovered once months_recovered == tenure_months —
    see is_active property. Manual one-off advances/recoveries unrelated
    to any EMI plan continue to work exactly as before, as
    SalaryAdvanceAdjustment rows with advance=None.
    """

    AUDIT_ACTION_CREATE = "SALARY_ADVANCE_CREATED"
    AUDIT_TRACKED_FIELDS = ["employee_id", "total_amount", "tenure_months", "reason"]

    employee = models.ForeignKey(
        "payroll.Employee", on_delete=models.CASCADE, related_name="salary_advances",
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Total lump-sum amount advanced to the employee.",
    )
    tenure_months = models.PositiveIntegerField(
        help_text="Number of months over which total_amount is auto-recovered.",
    )
    emi_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Computed at creation as total_amount / tenure_months (rounded to "
                   "2dp). Each month's auto-recovery uses this amount, except the "
                   "final installment which is adjusted for any rounding remainder "
                   "so the sum of all recoveries exactly equals total_amount.",
    )
    months_recovered = models.PositiveIntegerField(
        default=0,
        help_text="How many EMI installments have actually been applied to a "
                   "payroll batch so far. Incremented alongside "
                   "SalaryAdvanceAdjustment.applied_in_record being set for this "
                   "plan's recovery adjustments — see PayrollUploadView.",
    )
    disbursement_adjustment = models.OneToOneField(
        "payroll.SalaryAdvanceAdjustment", on_delete=models.PROTECT,
        related_name="disbursement_for_advance",
        help_text="The +total_amount SalaryAdvanceAdjustment representing this "
                   "plan's initial lump-sum disbursement. Created together with "
                   "this plan; folds into salary_advance_disbursed the same way "
                   "any manual advance would.",
    )
    reason = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="salary_advances_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "salary_advances"
        ordering = ["-created_at"]

    @property
    def is_active(self) -> bool:
        return self.months_recovered < self.tenure_months

    def __str__(self) -> str:
        return f"{self.employee} — advance of {self.total_amount} over {self.tenure_months}mo"


class SalaryAdvanceAdjustment(AuditableMixin, models.Model):
    """
    Manual correction to an employee's salary-advance balance, layered on
    top of the auto-carried PayslipRecord ledger rather than editing it in
    place — PayslipRecord.salary_advance_closing_balance stays an
    immutable, auto-computed value (see PayslipRecord docstring / batch
    generation). Same pattern as CompOffAdjustment.

    Purely adjustment-driven: there is no monthly excel column for this,
    so a positive amount records a new advance given to the employee and
    a negative amount records an amount recovered from their salary — the
    balance only moves via these adjustments, not via any attendance
    figure.

    An adjustment is "pending" until the next payroll batch is generated
    for this employee, at which point its amount is folded into that
    batch's salary_advance_opening_balance and `applied_in_record` is set
    — see PayrollUploadView. Once applied, an adjustment is historical and
    no longer affects future opening-balance calculations.

    `advance` is set when this row belongs to a SalaryAdvance EMI plan
    (either its initial disbursement or one of its auto-generated monthly
    recoveries) — null for ordinary manual one-off adjustments, exactly
    as before this field was added.
    """

    AUDIT_ACTION_CREATE = "SALARY_ADVANCE_ADJUSTMENT_CREATED"
    AUDIT_TRACKED_FIELDS = ["employee_id", "amount", "reason"]

    employee = models.ForeignKey(
        "payroll.Employee", on_delete=models.CASCADE, related_name="salary_advance_adjustments",
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Signed rupee amount — positive to record a new advance given, "
                   "negative to record an amount recovered/corrected.",
    )
    reason = models.TextField()
    advance = models.ForeignKey(
        "payroll.SalaryAdvance", on_delete=models.CASCADE,
        null=True, blank=True, related_name="adjustments",
        help_text="Set when this adjustment belongs to an EMI-style SalaryAdvance "
                   "plan (its disbursement or one of its auto-recoveries). Null for "
                   "ordinary manual one-off advances/recoveries.",
    )
    applied_in_record = models.ForeignKey(
        "payroll.PayslipRecord", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="salary_advance_adjustments_applied",
        help_text="Set once this adjustment has been folded into a payroll "
                   "batch's opening balance — null means still pending.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="salary_advance_adjustments_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "salary_advance_adjustments"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.employee} — {self.amount:+} salary advance"


class OnHoldAdjustment(AuditableMixin, models.Model):
    """
    Manual correction to an employee's on-hold-payable balance, layered on
    top of the auto-carried PayslipRecord ledger rather than editing it in
    place — PayslipRecord.on_hold_closing_balance stays an immutable,
    auto-computed value (see PayslipRecord docstring / batch generation).
    Same pattern as CompOffAdjustment.

    Purely adjustment-driven: there is no monthly excel column for this,
    so a positive amount records a new amount put on hold and a negative
    amount records an amount released back to the employee — the balance
    only moves via these adjustments, not via any attendance figure.

    An adjustment is "pending" until the next payroll batch is generated
    for this employee, at which point its amount is folded into that
    batch's on_hold_opening_balance and `applied_in_record` is set — see
    PayrollUploadView. Once applied, an adjustment is historical and no
    longer affects future opening-balance calculations.
    """

    AUDIT_ACTION_CREATE = "ON_HOLD_ADJUSTMENT_CREATED"
    AUDIT_TRACKED_FIELDS = ["employee_id", "amount", "reason"]

    employee = models.ForeignKey(
        "payroll.Employee", on_delete=models.CASCADE, related_name="on_hold_adjustments",
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Signed rupee amount — positive to put an amount on hold, "
                   "negative to release/correct.",
    )
    reason = models.TextField()
    applied_in_record = models.ForeignKey(
        "payroll.PayslipRecord", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="on_hold_adjustments_applied",
        help_text="Set once this adjustment has been folded into a payroll "
                   "batch's opening balance — null means still pending.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="on_hold_adjustments_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "on_hold_adjustments"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.employee} — {self.amount:+} on-hold"


class PayslipRecord(AuditableMixin, models.Model):
    AUDIT_ACTION_CREATE = "PAYSLIP_CREATED"
    AUDIT_ACTION_UPDATE = "PAYSLIP_UPDATED"

    STATUS_DRAFT = "DRAFT"
    STATUS_APPROVED = "APPROVED"
    STATUS_EMAIL_SENT = "EMAIL_SENT"
    STATUS_EMAIL_FAILED = "EMAIL_FAILED"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_EMAIL_SENT, "Email sent"),
        (STATUS_EMAIL_FAILED, "Email failed"),
    ]

    AUDIT_TRACKED_FIELDS = [
        "batch_id", "employee_id", "salary_structure_snapshot_id",
        "days_in_month", "actual_working_days", "extra_working_days",
        "comp_off_opening_balance", "comp_off_days_used", "comp_off_closing_balance",
        "leave_opening_balance", "leave_accrued", "leave_used", "leave_closing_balance",
        "salary_advance_opening_balance", "salary_advance_disbursed", "salary_advance_recovered",
        "salary_advance_closing_balance",
        "on_hold_opening_balance", "on_hold_deducted", "on_hold_released", "on_hold_closing_balance",
        "paid_leave_days", "lop_days",
        "basic_da", "basic_for_pf", "hra", "lta", "special_allowance",
        "nps_allowance_earned", "gross_salary", "variable_pay",
        "commission_other", "arrears", "reimbursements", "night_shift", "earned_salary", "tds", "epf", "vpf",
        "professional_tax", "nps_deduction", "vpf_arrears",
        "nps_deduction_arrears", "loan_deduction", "lwf", "other_deduction",
        "total_deductions", "net_salary", "pdf_path", "status", "edit_count",
    ]

    batch = models.ForeignKey(PayrollBatch, on_delete=models.PROTECT, related_name="records")
    employee = models.ForeignKey("payroll.Employee", on_delete=models.PROTECT, related_name="payslip_records")
    salary_structure_snapshot = models.ForeignKey(
        "payroll.EmployeeSalaryStructure",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="payslip_records",
    )

    days_in_month = models.PositiveSmallIntegerField(default=31)
    actual_working_days = models.PositiveSmallIntegerField(default=0)
    extra_working_days = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Raw days worked beyond normal, from the monthly excel. "
                   "Credits comp_off_opening_balance -> comp_off_closing_balance "
                   "(see below), which can then offset LOP in a later month.",
    )
    comp_off_opening_balance = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="Read-only — auto-carried from this employee's PREVIOUS "
                   "month's comp_off_closing_balance. Not uploaded, not "
                   "editable; do not set this directly.",
    )
    comp_off_days_used = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="How many banked comp-off days were consumed this month "
                   "to cover LOP without reducing pay. "
                   "= min(lop_days, comp_off_opening_balance + extra_working_days).",
    )
    comp_off_closing_balance = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="= comp_off_opening_balance + extra_working_days - comp_off_days_used. "
                   "Becomes next month's comp_off_opening_balance.",
    )
    leave_opening_balance = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="Read-only — auto-carried from this employee's PREVIOUS "
                   "month's leave_closing_balance (plus any pending manual "
                   "LeaveAdjustment, e.g. a cashout). Not uploaded, not "
                   "editable; do not set this directly. General CL/SL/EL "
                   "leave pool — separate from the comp_off_* ledger above.",
    )
    leave_accrued = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="This month's accrual = 22/12 days, or 0 if the employee "
                   "is still within their 6-month probation period.",
    )
    leave_used = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="How many days of lop_days were covered by this leave "
                   "balance (after probation-check), before any remaining "
                   "LOP falls to comp-off. 0 for probation employees, since "
                   "their LOP is always a direct salary deduction.",
    )
    leave_closing_balance = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text="= leave_opening_balance + leave_accrued - leave_used. "
                   "Becomes next month's leave_opening_balance. Allowed to "
                   "go negative (displayed as-is) — this is informational "
                   "only and never reduces earned_salary/net_salary.",
    )
    paid_leave_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    lop_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    salary_advance_opening_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Read-only — auto-carried from this employee's PREVIOUS "
                   "month's salary_advance_closing_balance. Not uploaded, "
                   "not editable; do not set this directly.",
    )
    salary_advance_disbursed = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="This month's new advance(s) given to the employee (from "
                   "SalaryAdvanceAdjustment amounts >= 0 applied to this "
                   "record) — feeds into earned_salary as a real earning line.",
    )
    salary_advance_recovered = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="This month's amount recovered from the employee's pay "
                   "(from SalaryAdvanceAdjustment amounts < 0 applied to this "
                   "record) — feeds into total_deductions as a real deduction line.",
    )
    salary_advance_closing_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="= salary_advance_opening_balance + salary_advance_disbursed "
                   "- salary_advance_recovered (computed in save()). Becomes "
                   "next month's salary_advance_opening_balance.",
    )
    on_hold_opening_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Read-only — auto-carried from this employee's PREVIOUS "
                   "month's on_hold_closing_balance. Not uploaded, not "
                   "editable; do not set this directly.",
    )
    on_hold_deducted = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="This month's new amount(s) put on hold (from "
                   "OnHoldAdjustment amounts >= 0 applied to this record) — "
                   "feeds into total_deductions as a real deduction line.",
    )
    on_hold_released = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="This month's amount(s) released back to the employee "
                   "(from OnHoldAdjustment amounts < 0 applied to this "
                   "record) — feeds into earned_salary as a real earning line.",
    )
    on_hold_closing_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="= on_hold_opening_balance + on_hold_deducted - "
                   "on_hold_released (computed in save()). Becomes next "
                   "month's on_hold_opening_balance.",
    )

    basic_da = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    basic_for_pf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_allowance_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Raw this-month-only extra/top-up as uploaded in Excel, kept separate
    # from the fields above (which hold the FINAL paid amount = salary
    # structure's prorated baseline + this extra). Needed so that a later
    # attendance edit can re-run calculate_payslip_fields() and re-derive
    # the combined figure from the baseline + this raw extra, without
    # double-adding the baseline on top of an already-combined value.
    lta_upload = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    special_allowance_upload = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_allowance_upload = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    variable_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_other = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    arrears = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reimbursements = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Raw pass-through from the monthly excel upload. Deliberately "
                   "excluded from earned_salary/net_salary — paid out on top of "
                   "Net Salary as its own 'Total Payable' line on the payslip, "
                   "not blended into taxable earnings.",
    )
    night_shift = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="DEPRECATED — no longer uploaded or computed (night-shift pay "
                   "is now expected to be folded into another field before "
                   "upload). Kept for historical payslips only; not used in "
                   "earned_salary for new records.",
    )
    earned_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    tds = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    epf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vpf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vpf_arrears = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_deduction_arrears = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    loan_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lwf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    pdf_path = models.CharField(max_length=500, null=True, blank=True)
    pdf_password = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    raw_row_data = models.JSONField(null=True, blank=True)
    edit_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payslip_records"
        unique_together = [("batch", "employee")]
        ordering = ["employee__employee_code"]

    def save(self, *args, **kwargs) -> None:
        self.earned_salary = sum(
            [
                self.basic_da,
                self.hra,
                self.lta,
                self.special_allowance,
                self.nps_allowance_earned,
                self.variable_pay,
                self.commission_other,
                self.arrears,
                self.salary_advance_disbursed,
                self.on_hold_released,
            ],
            Decimal("0"),
        )
        self.total_deductions = sum(
            [
                self.tds,
                self.epf,
                self.vpf,
                self.professional_tax,
                self.nps_deduction,
                self.vpf_arrears,
                self.nps_deduction_arrears,
                self.loan_deduction,
                self.lwf,
                self.other_deduction,
                self.salary_advance_recovered,
                self.on_hold_deducted,
            ],
            Decimal("0"),
        )
        self.net_salary = self.earned_salary - self.total_deductions
        self.salary_advance_closing_balance = (
            self.salary_advance_opening_balance + self.salary_advance_disbursed - self.salary_advance_recovered
        )
        self.on_hold_closing_balance = (
            self.on_hold_opening_balance + self.on_hold_deducted - self.on_hold_released
        )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.employee.employee_code} - {self.batch.month:02d}/{self.batch.year}"


class LeaveAdjustment(AuditableMixin, models.Model):
    """
    Manual correction to an employee's general leave balance, layered on
    top of the auto-carried PayslipRecord ledger rather than editing it
    in place — same pattern as CompOffAdjustment above (see that model's
    docstring). Used for HR-initiated leave cashouts (negative amount —
    HR just records how many days were cashed out; no rupee amount is
    tracked here, since payout calculation happens outside CAOAS and is
    deliberately not shown on the payslip) as well as ordinary manual
    grants/corrections to the leave balance.

    An adjustment is "pending" until the next payroll batch is generated
    for this employee, at which point its amount is folded into that
    batch's leave_opening_balance and `applied_in_record` is set — same
    fold-in point as CompOffAdjustment in PayrollUploadView.
    """

    AUDIT_ACTION_CREATE = "LEAVE_ADJUSTMENT_CREATED"
    AUDIT_TRACKED_FIELDS = ["employee_id", "amount", "reason"]

    employee = models.ForeignKey(
        "payroll.Employee", on_delete=models.CASCADE, related_name="leave_adjustments",
    )
    amount = models.DecimalField(
        max_digits=6, decimal_places=2,
        help_text="Signed number of days — positive to grant extra leave, "
                   "negative for a cashout or correction/deduction.",
    )
    reason = models.TextField()
    applied_in_record = models.ForeignKey(
        "payroll.PayslipRecord", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="leave_adjustments_applied",
        help_text="Set once this adjustment has been folded into a payroll "
                   "batch's opening balance — null means still pending.",
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="leave_adjustments_created")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "leave_adjustments"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.employee.employee_code} {self.amount:+}"


class PayslipRecordEdit(models.Model):
    payslip_record = models.ForeignKey(PayslipRecord, on_delete=models.PROTECT, related_name="edits")
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payslip_edits")
    field_name = models.CharField(max_length=50)
    old_value = models.CharField(max_length=500)
    new_value = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payslip_record_edits"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.payslip_record_id} {self.field_name}"


class EmailLog(models.Model):
    payslip_record = models.ForeignKey(PayslipRecord, on_delete=models.PROTECT, related_name="email_logs")
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payslip_email_logs")
    recipient_email = models.EmailField()
    cc_email = models.EmailField(null=True, blank=True)
    subject = models.CharField(max_length=500)
    success = models.BooleanField()
    error_message = models.TextField(null=True, blank=True)
    attempt_number = models.IntegerField(default=1)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payslip_email_logs"
        ordering = ["-sent_at"]

    def __str__(self) -> str:
        return f"{self.recipient_email} attempt {self.attempt_number}"

class EmployeeSalaryStructure(models.Model):
    """
    Versioned CTC/salary structure for an employee, used to compute each
    month's PayslipRecord (see calculations.py). This model does not exist
    anywhere else in the project, so it lives here in the payroll module
    (new feature requirement: any new model needed by payroll is created
    inside the payroll app only).

    Multiple rows per employee are allowed (effective_from-dated history);
    calculations.py / views.py always resolve the latest one as-of a given
    date via get_latest_salary_structure() below.
    """

    employee = models.ForeignKey(
        "payroll.Employee",
        on_delete=models.PROTECT,
        related_name="salary_structures",
    )
    effective_from = models.DateField()

    ctc_annual = models.DecimalField(max_digits=12, decimal_places=2)

    original_basic_da = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    original_hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    original_special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    original_lta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fbp = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_gross = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vpf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_opted = models.BooleanField(default=True)
    employer_pf = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Employer's PF contribution (12% of Basic, capped at Rs 1,800). "
                  "Computed automatically when the structure is built from CTC "
                  "(build_from_ctc) — informational on the payslip, never part of net pay.",
    )

    change_reason = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="salary_structures_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payroll_employee_salary_structures"
        ordering = ["-effective_from", "-created_at"]

    def __str__(self) -> str:
        return f"{self.employee} — structure effective {self.effective_from}"

    @classmethod
    def build_from_ctc(cls, ctc_annual: Decimal, pf_opted: bool = True, current_lta: Decimal = Decimal("0")):
        """
        Auto-derives Basic+DA, HRA, Special Allowance and Monthly Gross
        from annual CTC using the firm's confirmed structuring rule
        (mirrors the frontend's computeFromCTC() in SalaryStructureModal.jsx
        exactly, so a server-side recompute — e.g. from excel_parser.py
        bulk import — always agrees with what the UI would have shown):

          Basic+DA = 50% of Monthly Gross, floored to Rs 25,000 ONLY once
                     Monthly Gross itself reaches Rs 25,000 (below that,
                     Basic stays a plain 50% — the floor can't apply if
                     Gross itself is smaller than it).
          HRA      = 50% of Basic — capped to whatever's left of the pool
                     after Basic + LTA (LTA is never auto-touched).
          SA       = MonthlyGross - Basic - HRA - LTA, floored at 0.

        If pf_opted: the employer's PF reserve (Rs 1,800 flat once Basic
        >= the Rs 15,000 wage ceiling, else 12% of Basic) is carved out
        of SA first, then HRA, then Basic+DA if neither can cover it.
        Monthly Gross itself is never reduced by this carve-out — it's a
        cost within CTC, not a cut to the employee's stated gross.

        Returns a dict of field values ready to spread into
        EmployeeSalaryStructure.objects.create(employee=..., effective_from=..., **build_from_ctc(...)).
        """
        PF_WAGE_CEILING = Decimal("15000")
        PF_FLAT_RESERVE = Decimal("1800")

        def pf_reserve(basic_da):
            if not pf_opted:
                return Decimal("0")
            return PF_FLAT_RESERVE if basic_da >= PF_WAGE_CEILING else basic_da * Decimal("0.12")

        ctc_annual = Decimal(ctc_annual)
        current_lta = Decimal(current_lta or 0)
        monthly_pool = (ctc_annual / Decimal("12")).quantize(Decimal("0.01"))
        half = monthly_pool * Decimal("0.5")

        floor_applies = monthly_pool >= Decimal("25000") and half < Decimal("25000")
        basic = Decimal("25000") if floor_applies else half

        hra = max(Decimal("0"), min(basic * Decimal("0.5"), monthly_pool - basic - current_lta))
        special_allowance = max(Decimal("0"), monthly_pool - basic - hra - current_lta)

        # Employer PF reserve — computed BEFORE the carve-out so the value
        # reflects what was reserved, not what survived the carve.
        reserve = pf_reserve(basic)
        if pf_opted:
            from_sa = min(special_allowance, reserve)
            special_allowance -= from_sa
            shortfall = reserve - from_sa
            if shortfall > 0:
                from_hra = min(hra, shortfall)
                hra -= from_hra
                shortfall -= from_hra
            if shortfall > 0:
                basic = max(Decimal("0"), basic - shortfall)

        q = Decimal("0.01")
        return {
            "ctc_annual": ctc_annual,
            "monthly_gross": monthly_pool.quantize(q),
            "original_basic_da": basic.quantize(q),
            "original_hra": hra.quantize(q),
            "original_special_allowance": special_allowance.quantize(q),
            "original_lta": current_lta.quantize(q),
            "nps_allowance": Decimal("0"),
            "fbp": Decimal("0"),
            "vpf": Decimal("0"),
            "pf_opted": pf_opted,
            "employer_pf": reserve.quantize(q),
        }


def get_latest_salary_structure(employee, as_of=None):
    """
    Resolves the salary structure that was in effect for `employee` as of
    `as_of` (defaults to today). Returns None if none exists yet.
    Local replacement for the missing `employee.latest_salary_structure`
    property referenced by the original payroll views.py.
    """
    from django.utils import timezone

    as_of = as_of or timezone.now().date()
    return (
        employee.salary_structures.filter(effective_from__lte=as_of)
        .order_by("-effective_from", "-created_at")
        .first()
    )