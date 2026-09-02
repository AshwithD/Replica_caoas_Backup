"""
payroll/portal/models.py

Portal-owned tables. These are registered under the `payroll` app (see the
`app_label` in each Meta and the import at the bottom of payroll/models.py),
so they live in the payroll module's own database namespace and migrate
together with the rest of payroll.

Cross-module foreign keys use string references ("payroll.Employee",
"clients.Client", settings.AUTH_USER_MODEL) to avoid import cycles with
payroll/models.py.
"""

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models

from ..mixins import AuditableMixin


class PortalUser(models.Model):
    """
    Client-side portal login, owned entirely by the payroll module.

    The main project's AUTH_USER_MODEL (account.User) is for internal staff
    only. Client portal credentials live here so they never touch — and can
    never log into — the internal app. Passwords are stored hashed via
    Django's make_password(); a login issues a random token whose SHA-256
    digest is kept in auth_token_hash (see payroll.portal.auth).
    """

    ROLE_EDITOR = "editor"
    ROLE_CLIENT_ADMIN = "client_admin"
    ROLE_CHOICES = [
        (ROLE_EDITOR, "Editor"),
        (ROLE_CLIENT_ADMIN, "Client Admin"),
    ]

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="portal_users",
    )
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # hashed via make_password()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EDITOR)
    is_active = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=True)
    auth_token_hash = models.CharField(max_length=64, blank=True, default="")
    last_login = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_users_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_users"
        ordering = ["email"]

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

    def __str__(self) -> str:
        return f"{self.email} ({self.client_id})"


class PortalSubmission(AuditableMixin, models.Model):
    """
    One client's monthly payroll input, staged in the portal.

    The portal writes nothing straight into payroll tables; the client's HR
    records this month's changes as PortalSubmissionItems against a draft
    submission. Submitting locks the month for admin review; approving
    applies the items (see payroll.portal.services.apply_submission).
    Unique per (client, month, year) — the portal twin of a PayrollBatch.
    """

    STATUS_DRAFT = "DRAFT"
    STATUS_SUBMITTED = "SUBMITTED"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]
    # A month is editable while DRAFT or REJECTED. APPROVED is also listed
    # for backwards-compatibility with months approved before the
    # multi-round behaviour (approval now reopens to DRAFT); treating it as
    # editable lets clients add more to those older months too.
    EDITABLE_STATUSES = (STATUS_DRAFT, STATUS_REJECTED, "APPROVED")

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="portal_submissions",
    )
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_submissions",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_portal_submissions",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_submissions"
        unique_together = [("client", "month", "year")]
        ordering = ["-year", "-month"]

    def __str__(self) -> str:
        return f"{self.client_id} {self.month:02d}/{self.year} ({self.status})"


class PortalSubmissionItem(AuditableMixin, models.Model):
    """
    A single change recorded inside a PortalSubmission.

    `payload` is a JSON dict whose shape depends on `item_type`; the apply
    step validates and turns each item into real payroll rows (Employee /
    EmployeeSalaryStructure / SalaryAdvance / PortalAdjustment). Keeping the
    staged data here means a client can draft, edit and re-submit a month
    without the approved payroll data being touched until you approve.
    """

    TYPE_NEW_EMPLOYEE = "NEW_EMPLOYEE"
    TYPE_REVISION = "REVISION"
    TYPE_EXIT = "EXIT"
    TYPE_SALARY_HOLD = "SALARY_HOLD"
    TYPE_ADVANCE = "ADVANCE"
    TYPE_ONE_TIME_EARNING = "ONE_TIME_EARNING"
    TYPE_ONE_TIME_DEDUCTION = "ONE_TIME_DEDUCTION"
    TYPE_NOTE = "NOTE"
    TYPE_CHOICES = [
        (TYPE_NEW_EMPLOYEE, "New employee"),
        (TYPE_REVISION, "Salary revision"),
        (TYPE_EXIT, "Exit / resignation"),
        (TYPE_SALARY_HOLD, "Salary hold"),
        (TYPE_ADVANCE, "Advance / loan"),
        (TYPE_ONE_TIME_EARNING, "One-time earning"),
        (TYPE_ONE_TIME_DEDUCTION, "One-time deduction"),
        (TYPE_NOTE, "Note / instruction"),
    ]

    STATUS_PENDING = "PENDING"
    STATUS_APPLIED = "APPLIED"
    STATUS_SKIPPED = "SKIPPED"
    STATUS_FAILED = "FAILED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPLIED, "Applied"),
        (STATUS_SKIPPED, "Skipped"),
        (STATUS_FAILED, "Failed"),
    ]

    submission = models.ForeignKey(
        PortalSubmission,
        on_delete=models.CASCADE,
        related_name="items",
    )
    item_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    error = models.TextField(blank=True)
    sort = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_submission_items",
    )

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_submission_items"
        ordering = ["sort", "id"]

    def __str__(self) -> str:
        return f"{self.submission} — {self.item_type}"


class PortalSubmissionEvent(models.Model):
    """One lifecycle event in a month's submission — the round history a
    client sees in the portal.

    PortalSubmission is unique per (client, month, year) and its `status`
    only ever holds the *current* state (it reopens as DRAFT after every
    approval), so without this log the submitted/approved rounds would be
    lost. Each submit / approve / reject appends a row here.
    """

    TYPE_SUBMITTED = "SUBMITTED"
    TYPE_APPROVED = "APPROVED"
    TYPE_REJECTED = "REJECTED"
    TYPE_CHOICES = [
        (TYPE_SUBMITTED, "Submitted"),
        (TYPE_APPROVED, "Approved"),
        (TYPE_REJECTED, "Rejected"),
    ]

    submission = models.ForeignKey(
        PortalSubmission,
        on_delete=models.CASCADE,
        related_name="history",
    )
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    item_count = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True)  # rejection reason / summary
    actor_portal = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_events",
    )
    actor_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_review_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_events"
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return f"{self.submission} — {self.event_type}"


class PortalAdjustment(models.Model):
    """
    A one-time earning or deduction approved from the portal, materialized
    so the batch/payslip step can pick it up later.

    One-time items (retention bonus, other allowance, loan installment
    recovery, etc.) don't fit an existing payroll table, so approve-time
    writes them here — one row per employee per month per item. The
    batch-generation step reads rows where applied_in_record is null for
    the month and folds them into the payslip (then sets applied_in_record).
    """

    DIRECTION_EARNING = "earning"
    DIRECTION_DEDUCTION = "deduction"
    DIRECTION_CHOICES = [
        (DIRECTION_EARNING, "Earning"),
        (DIRECTION_DEDUCTION, "Deduction"),
    ]

    employee = models.ForeignKey(
        "payroll.Employee",
        on_delete=models.CASCADE,
        related_name="portal_adjustments",
    )
    item = models.ForeignKey(
        PortalSubmissionItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_adjustments",
    )
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    applied_in_record = models.ForeignKey(
        "payroll.PayslipRecord",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_adjustments_applied",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_adjustments"
        ordering = ["year", "month", "id"]

    def __str__(self) -> str:
        return f"{self.employee} — {self.direction} {self.amount} ({self.month:02d}/{self.year})"


class PortalHold(models.Model):
    """
    A salary amount put on hold from the portal, scheduled to auto-release
    in a month the client chooses.

    Approving a SALARY_HOLD item writes two things:
      * hold_adjustment — a positive OnHoldAdjustment, folded into the NEXT
        batch generated for the employee (normally the submitted month) as
        `on_hold_deducted`, so the amount reduces that month's net pay and
        parks in the on-hold closing balance.
      * this PortalHold row, which remembers the release month.

    When a batch is generated for the release month (Excel upload or
    Proceed → generate-from-portal), materialize_due_hold_releases() creates
    the matching negative OnHoldAdjustment (release_adjustment) so the held
    amount is paid back in that month. Splitting EXIT (resignation → inactive)
    from SALARY_HOLD (money held, released later) keeps the two concepts
    independent.
    """

    item = models.ForeignKey(
        PortalSubmissionItem,
        on_delete=models.CASCADE,
        related_name="portal_holds",
    )
    employee = models.ForeignKey(
        "payroll.Employee",
        on_delete=models.CASCADE,
        related_name="portal_holds",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True)
    release_month = models.PositiveSmallIntegerField()
    release_year = models.PositiveSmallIntegerField()
    hold_adjustment = models.ForeignKey(
        "payroll.OnHoldAdjustment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_holds_held",
    )
    release_adjustment = models.ForeignKey(
        "payroll.OnHoldAdjustment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portal_holds_released",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "payroll"
        db_table = "payroll_portal_holds"
        ordering = ["release_year", "release_month", "id"]

    @property
    def is_released(self) -> bool:
        return self.release_adjustment_id is not None

    def __str__(self) -> str:
        return (
            f"{self.employee} — hold {self.amount} "
            f"(release {self.release_month:02d}/{self.release_year})"
        )

