"""hrms_backend /payroll/serializers.py"""

from decimal import Decimal

from rest_framework import serializers

from .calculations import is_in_probation
from clients.models import Client as MasterClient
from .models import (
    ClientProfile, CompOffAdjustment, EmailLog, Employee, EmployeeSalaryStructure, LeaveAdjustment,
    OnHoldAdjustment, PayrollBatch, PayslipRecord, PayslipRecordEdit, SalaryAdvance,
    SalaryAdvanceAdjustment, get_latest_salary_structure,
)


PAYSLIP_EDITABLE_FIELDS = [
    "days_in_month", "actual_working_days", "extra_working_days", "paid_leave_days", "lop_days",
    "basic_da", "basic_for_pf", "hra", "lta", "special_allowance",
    "nps_allowance_earned", "gross_salary", "variable_pay", "commission_other",
    "arrears", "reimbursements", "earned_salary", "tds", "epf", "vpf", "professional_tax",
    "nps_deduction", "vpf_arrears", "nps_deduction_arrears", "loan_deduction",
    "lwf", "other_deduction",
]


class PayrollBatchSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    uploaded_by_display = serializers.SerializerMethodField()
    reviewed_by_display = serializers.SerializerMethodField()
    sent_by_display = serializers.SerializerMethodField()
    # Firm-wide (not client-scoped) cash collected within the CURRENT
    # FirmBudgetPeriod — same single source of truth as the Company
    # Detail revenue card (apps.budget.services.get_budget_period_revenue).
    # Shown for context alongside payroll cost during batch review.
    budget_period_revenue = serializers.SerializerMethodField()
    budget_period_revenue_label = serializers.SerializerMethodField()

    class Meta:
        model = PayrollBatch
        fields = [
            "id", "client", "client_name", "month", "year", "status",
            "source_file", "total_records", "email_sent", "email_failed",
            "error_log", "uploaded_by", "uploaded_by_display", "reviewed_by",
            "reviewed_by_display", "reviewed_at", "sent_by", "sent_by_display",
            "sent_at", "created_at", "updated_at",
            "budget_period_revenue", "budget_period_revenue_label",
        ]
        read_only_fields = [
            "id", "status", "total_records", "email_sent", "email_failed",
            "error_log", "uploaded_by", "uploaded_by_display", "reviewed_by",
            "reviewed_by_display", "reviewed_at", "sent_by", "sent_by_display",
            "sent_at", "created_at", "updated_at",
            "budget_period_revenue", "budget_period_revenue_label",
        ]

    def _current_budget_period_revenue(self, obj):
        # Cached on the instance for the duration of this serialization —
        # both method fields need it and it involves a DB aggregate.
        if not hasattr(obj, "_budget_period_revenue_cache"):
            from .budget_stub import get_budget_period_revenue
            obj._budget_period_revenue_cache = get_budget_period_revenue()
        return obj._budget_period_revenue_cache

    def get_budget_period_revenue(self, obj):
        _period, revenue = self._current_budget_period_revenue(obj)
        return revenue

    def get_budget_period_revenue_label(self, obj):
        period, _revenue = self._current_budget_period_revenue(obj)
        return period.revenue_label if period else None

    def validate_client(self, client):
        # Multi-client now — nothing to validate beyond the FK itself
        # resolving to a real Client row (handled by the FK field).
        return client

    def _display_user(self, user) -> str | None:
        if not user:
            return None
        return getattr(user, "full_name", "") or user.get_username()

    def get_uploaded_by_display(self, obj):
        return self._display_user(obj.uploaded_by)

    def get_reviewed_by_display(self, obj):
        return self._display_user(obj.reviewed_by)

    def get_sent_by_display(self, obj):
        return self._display_user(obj.sent_by)


class PayrollBatchListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = PayrollBatch
        fields = [
            "id", "client", "client_name", "month", "year", "status",
            "total_records", "email_sent", "email_failed", "created_at",
            "reviewed_at", "sent_at",
        ]


class CompOffAdjustmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = CompOffAdjustment
        fields = [
            "id", "employee", "amount", "reason",
            "applied_in_record", "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "applied_in_record", "created_by", "created_by_name", "created_at"]

    def create(self, validated_data: dict) -> CompOffAdjustment:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class LeaveAdjustmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = LeaveAdjustment
        fields = [
            "id", "employee", "amount", "reason",
            "applied_in_record", "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "applied_in_record", "created_by", "created_by_name", "created_at"]

    def create(self, validated_data: dict) -> LeaveAdjustment:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class SalaryAdvanceAdjustmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)
    # Which payroll batch (if any) this row's rupee movement actually landed
    # in — this is the true "month" a disbursement/recovery took effect,
    # since a row can sit pending for a while before a batch picks it up.
    applied_month = serializers.IntegerField(source="applied_in_record.batch.month", read_only=True, default=None)
    applied_year = serializers.IntegerField(source="applied_in_record.batch.year", read_only=True, default=None)
    # Plan tenure/EMI context for rows generated by a SalaryAdvance EMI
    # plan (disbursement or auto-recovery) — null for ordinary manual
    # one-off advances/recoveries, exactly matching SalaryAdvanceAdjustment.advance.
    advance_tenure_months = serializers.IntegerField(source="advance.tenure_months", read_only=True, default=None)
    advance_emi_amount = serializers.DecimalField(source="advance.emi_amount", max_digits=12, decimal_places=2, read_only=True, default=None)

    class Meta:
        model = SalaryAdvanceAdjustment
        fields = [
            "id", "employee", "amount", "reason", "advance",
            "advance_tenure_months", "advance_emi_amount",
            "applied_in_record", "applied_month", "applied_year",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = [
            "id", "advance", "advance_tenure_months", "advance_emi_amount",
            "applied_in_record", "applied_month", "applied_year",
            "created_by", "created_by_name", "created_at",
        ]

    def create(self, validated_data: dict) -> SalaryAdvanceAdjustment:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class SalaryAdvanceSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)
    months_remaining = serializers.SerializerMethodField()
    # The month this plan's lump-sum actually landed in a payslip — null
    # until the disbursement adjustment is applied to a batch, in which
    # case the plan is shown as "pending since created_at" on the frontend.
    disbursement_month = serializers.IntegerField(
        source="disbursement_adjustment.applied_in_record.batch.month", read_only=True, default=None,
    )
    disbursement_year = serializers.IntegerField(
        source="disbursement_adjustment.applied_in_record.batch.year", read_only=True, default=None,
    )

    class Meta:
        model = SalaryAdvance
        fields = [
            "id", "employee", "total_amount", "tenure_months", "emi_amount",
            "months_recovered", "months_remaining", "reason",
            "disbursement_adjustment", "disbursement_month", "disbursement_year",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = [
            "id", "emi_amount", "months_recovered", "months_remaining",
            "disbursement_adjustment", "disbursement_month", "disbursement_year",
            "created_by", "created_by_name", "created_at",
        ]

    def get_months_remaining(self, obj: SalaryAdvance) -> int:
        return obj.tenure_months - obj.months_recovered

    def validate_tenure_months(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("tenure_months must be at least 1.")
        return value

    def validate_total_amount(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("total_amount must be greater than 0.")
        return value

    def create(self, validated_data: dict) -> SalaryAdvance:
        """
        A SalaryAdvance plan always creates its lump-sum disbursement as an
        ordinary SalaryAdvanceAdjustment (amount=+total_amount) — the same
        row type/mechanism a manual one-off advance uses — so it folds into
        salary_advance_disbursed via the exact same existing code path in
        PayrollUploadView / _current_open_record, with no special-casing
        needed there for disbursement. Only the auto-recovery installments
        (created later, in PayrollUploadView) are specific to this plan.

        disbursement_adjustment is a required (non-null) OneToOneField on
        SalaryAdvance, but SalaryAdvanceAdjustment.advance is nullable — so
        the adjustment has to exist first (created with advance=None), then
        the plan is created referencing it, then the adjustment is updated
        to point back at the plan.
        """
        employee = validated_data["employee"]
        total_amount = validated_data["total_amount"]
        tenure_months = validated_data["tenure_months"]
        reason = validated_data["reason"]
        created_by = validated_data["created_by"]

        emi_amount = (total_amount / tenure_months).quantize(Decimal("0.01"))

        disbursement_adjustment = SalaryAdvanceAdjustment.objects.create(
            employee=employee,
            amount=total_amount,
            reason=f"Salary advance disbursement ({tenure_months}-month EMI plan): {reason}",
            created_by=created_by,
        )
        advance = SalaryAdvance.objects.create(
            employee=employee,
            total_amount=total_amount,
            tenure_months=tenure_months,
            emi_amount=emi_amount,
            reason=reason,
            disbursement_adjustment=disbursement_adjustment,
            created_by=created_by,
        )
        disbursement_adjustment.advance = advance
        disbursement_adjustment.save(update_fields=["advance"])
        return advance


class OnHoldAdjustmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)
    # Which payroll batch (if any) this row's amount actually landed in —
    # null while still pending (see applied_in_record docstring).
    applied_month = serializers.IntegerField(source="applied_in_record.batch.month", read_only=True, default=None)
    applied_year = serializers.IntegerField(source="applied_in_record.batch.year", read_only=True, default=None)

    class Meta:
        model = OnHoldAdjustment
        fields = [
            "id", "employee", "amount", "reason",
            "applied_in_record", "applied_month", "applied_year",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = [
            "id", "applied_in_record", "applied_month", "applied_year",
            "created_by", "created_by_name", "created_at",
        ]

    def create(self, validated_data: dict) -> OnHoldAdjustment:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class PayslipRecordSerializer(serializers.ModelSerializer):
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_email = serializers.EmailField(source="employee.email", read_only=True, default=None)
    employee_designation = serializers.CharField(source="employee.position", read_only=True, default=None)
    batch_month = serializers.IntegerField(source="batch.month", read_only=True)
    batch_year = serializers.IntegerField(source="batch.year", read_only=True)
    ctc_annual = serializers.SerializerMethodField()
    # Derived, not stored — this payslip's own figures are the ground truth
    # for whether PF/PT actually applied this month, rather than a separate
    # flag on Employee/EmployeeSalaryStructure that could drift out of sync.
    pf_applicable = serializers.SerializerMethodField()
    pt_applicable = serializers.SerializerMethodField()
    # Anchored to THIS payslip's own batch month/year, not today — a
    # payslip is a historical record, so it must reflect whether the
    # employee was on probation in that specific month, not now.
    is_probation = serializers.SerializerMethodField()

    class Meta:
        model = PayslipRecord
        fields = [
            "id", "batch", "batch_month", "batch_year", "employee", "employee_code",
            "employee_name", "employee_email", "employee_designation",
            "salary_structure_snapshot", "ctc_annual", "pf_applicable", "pt_applicable",
            "is_probation",
            "days_in_month", "actual_working_days", "extra_working_days",
            "comp_off_opening_balance", "comp_off_days_used", "comp_off_closing_balance",
            "leave_opening_balance", "leave_accrued", "leave_used", "leave_closing_balance",
            "salary_advance_opening_balance", "salary_advance_disbursed", "salary_advance_recovered",
            "salary_advance_closing_balance",
            "on_hold_opening_balance", "on_hold_deducted", "on_hold_released", "on_hold_closing_balance",
            "paid_leave_days", "lop_days",
            "basic_da", "basic_for_pf", "hra", "lta", "special_allowance",
            "nps_allowance_earned", "gross_salary", "variable_pay", "commission_other",
            "arrears", "reimbursements", "earned_salary", "tds", "epf", "vpf", "professional_tax",
            "nps_deduction", "vpf_arrears", "nps_deduction_arrears", "loan_deduction",
            "lwf", "other_deduction", "total_deductions", "net_salary", "pdf_path",
            "status", "raw_row_data", "edit_count", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "batch", "employee", "employee_code", "employee_name",
            "employee_email", "employee_designation", "salary_structure_snapshot",
            "ctc_annual", "pf_applicable", "pt_applicable", "is_probation", "total_deductions",
            "net_salary", "pdf_path", "raw_row_data", "edit_count", "created_at",
            "updated_at", "batch_month", "batch_year",
            "comp_off_opening_balance", "comp_off_days_used", "comp_off_closing_balance",
            "leave_opening_balance", "leave_accrued", "leave_used", "leave_closing_balance",
            "salary_advance_opening_balance", "salary_advance_disbursed", "salary_advance_recovered",
            "salary_advance_closing_balance",
            "on_hold_opening_balance", "on_hold_deducted", "on_hold_released", "on_hold_closing_balance",
        ]

    def get_ctc_annual(self, obj):
        return obj.salary_structure_snapshot.ctc_annual if obj.salary_structure_snapshot_id else None

    def get_pf_applicable(self, obj) -> bool:
        # NOT bool(obj.epf or obj.basic_for_pf) — basic_for_pf is computed
        # unconditionally (min(basic_da, PF_WAGE_CEILING)) regardless of
        # whether the employee opted into PF at all, so it's always
        # truthy whenever basic_da > 0. That made this always show True.
        # The real source of truth is the snapshot's pf_opted flag;
        # epf > 0 is only a fallback for records with no snapshot linked.
        if obj.salary_structure_snapshot_id:
            return bool(obj.salary_structure_snapshot.pf_opted)
        return bool(obj.epf)

    def get_pt_applicable(self, obj) -> bool:
        return bool(obj.professional_tax)

    def get_is_probation(self, obj) -> bool:
        if not obj.employee_id or not obj.employee.hire_date:
            return False
        return is_in_probation(obj.employee.hire_date, obj.batch.year, obj.batch.month)

    def validate(self, attrs):
        for field_name, value in attrs.items():
            if field_name in PAYSLIP_EDITABLE_FIELDS and value < Decimal("0"):
                raise serializers.ValidationError({field_name: "Value must be greater than or equal to 0."})
        return attrs


class PayslipRecordEditSerializer(serializers.ModelSerializer):
    edited_by_display = serializers.SerializerMethodField()

    class Meta:
        model = PayslipRecordEdit
        fields = [
            "id", "payslip_record", "edited_by", "edited_by_display",
            "field_name", "old_value", "new_value", "created_at",
        ]
        read_only_fields = fields

    def get_edited_by_display(self, obj):
        if not obj.edited_by:
            return None
        return getattr(obj.edited_by, "full_name", "") or obj.edited_by.get_username()


class EmailLogSerializer(serializers.ModelSerializer):
    sent_by_display = serializers.SerializerMethodField()
    employee_code = serializers.CharField(source="payslip_record.employee.employee_code", read_only=True)
    employee_name = serializers.CharField(source="payslip_record.employee.full_name", read_only=True)
    client_name = serializers.CharField(source="payslip_record.batch.client.name", read_only=True)
    batch_month = serializers.IntegerField(source="payslip_record.batch.month", read_only=True)
    batch_year = serializers.IntegerField(source="payslip_record.batch.year", read_only=True)

    class Meta:
        model = EmailLog
        fields = [
            "id", "payslip_record", "sent_by", "sent_by_display", "recipient_email",
            "cc_email", "subject", "success", "error_message", "attempt_number",
            "sent_at", "employee_code", "employee_name", "client_name", "batch_month",
            "batch_year",
        ]
        read_only_fields = fields

    def get_sent_by_display(self, obj):
        if not obj.sent_by:
            return None
        return getattr(obj.sent_by, "full_name", "") or obj.sent_by.get_username()

# ── Ledger adjustments (Comp-Off / Leave) ─────────────────────────────────
# CompOffAdjustmentSerializer / LeaveAdjustmentSerializer (with
# created_by_name) are defined earlier in this file, alongside the other
# ledger adjustment serializers — see SalaryAdvanceAdjustmentSerializer /
# OnHoldAdjustmentSerializer above.

# ── Client profile ─────────────────────────────────────────────────────────

class ClientSerializer(serializers.ModelSerializer):
    """
    Payroll "client" as the frontend knows it — a flat object that merges
    the master identity (clients.Client) with the payroll-only extension
    (ClientProfile). The JSON shape is unchanged (name/email/phone/pan/tan/
    gstin/address/logo/pdf_design/is_active), so the existing payroll
    frontend keeps working without modification.

    IMPORTANT: the serializer's model is the MASTER client (that's also
    what ClientViewSet.queryset returns), so identity fields map 1:1 onto
    clients.Client while the payroll-only fields read/write through the
    related ClientProfile via dotted ``payroll_profile.*`` sources. `id`
    is therefore the master client id — the same id Employee.client and
    PayrollBatch.client now reference.
    """

    # ── Identity (master clients.Client) — direct model fields ──
    name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    address = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    pan = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    tan = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")
    gstin = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="")

    # ── Payroll-only (ClientProfile), via the reverse OneToOne ──
    logo = serializers.ImageField(source="payroll_profile.payroll_logo", required=False, allow_null=True)
    payroll_email = serializers.EmailField(source="payroll_profile.payroll_email", required=False, allow_null=True, allow_blank=True)
    is_active = serializers.BooleanField(source="payroll_profile.payroll_is_active", required=False, default=True)
    pdf_design = serializers.IntegerField(source="payroll_profile.pdf_design", required=False, default=1)
    pf_establishment_code = serializers.CharField(source="payroll_profile.pf_establishment_code", required=False, allow_null=True, allow_blank=True, default="")

    class Meta:
        model = MasterClient
        fields = [
            "id", "name", "logo", "payroll_email", "address", "email", "phone",
            "pan", "tan", "gstin", "pf_establishment_code", "is_active",
            "pdf_design", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @staticmethod
    def _split(validated_data):
        """Split validated_data into {master identity fields} and {profile fields}.

        Payroll fields use dotted ``source="payroll_profile.*"``, so DRF
        nests them under a ``payroll_profile`` key in validated_data;
        identity fields stay flat on the master client.
        """
        identity = {}
        for field in ("name", "email", "phone", "address", "pan", "tan", "gstin"):
            if field in validated_data:
                identity[field] = validated_data[field]
        profile = dict(validated_data.get("payroll_profile") or {})
        return identity, profile

    @staticmethod
    def _norm_email(value):
        return (value or "").strip() or None

    def to_representation(self, instance):
        """Normalise payroll-only fields for clients that have no profile yet
        (a client added in the Client module): the reverse OneToOne raises
        RelatedObjectDoesNotExist, which DRF swallows to None before the
        field defaults run — so fill the sane defaults here instead."""
        data = super().to_representation(instance)
        if data.get("is_active") is None:
            data["is_active"] = True
        if data.get("pdf_design") is None:
            data["pdf_design"] = 1
        if data.get("payroll_email") is None:
            data["payroll_email"] = ""
        if data.get("pf_establishment_code") is None:
            data["pf_establishment_code"] = ""
        return data

    def create(self, validated_data):
        identity, profile = self._split(validated_data)
        name = (identity.get("name") or "").strip()
        # If the master client already exists (e.g. it was added in the
        # Client module), reuse it instead of violating the unique name
        # constraint — just create/update its payroll profile.
        existing = MasterClient.objects.filter(name__iexact=name).first() if name else None
        if existing:
            prof, _ = ClientProfile.objects.get_or_create(client=existing)
            for field, value in profile.items():
                setattr(prof, field, value)
            prof.save()
            return existing
        client = MasterClient.objects.create(
            name=name,
            email=self._norm_email(identity.get("email")),
            phone=(identity.get("phone") or "")[:30],
            address=identity.get("address") or "",
            pan=(identity.get("pan") or "")[:10],
            tan=(identity.get("tan") or "")[:10],
            gstin=(identity.get("gstin") or "")[:15],
        )
        ClientProfile.objects.create(client=client, **profile)
        # Return the MASTER client so serializer.data can re-serialize it
        # (identity fields are direct attributes on the master model).
        return client

    def update(self, instance, validated_data):
        identity, profile = self._split(validated_data)
        for field, value in identity.items():
            if field == "email":
                value = self._norm_email(value)
            setattr(instance, field, value)
        instance.save()
        if profile:
            # Lazily create the profile on first payroll-settings save — a
            # client added in the Client module has none yet.
            prof, _ = ClientProfile.objects.get_or_create(client=instance)
            for field, value in profile.items():
                setattr(prof, field, value)
            prof.save()
        return instance


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id", "employee_code", "first_name", "last_name", "full_name",
            "email", "pan_number", "department", "position", "hire_date",
            "ctc", "status", "client", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "full_name", "created_at", "updated_at"]


# ── Salary structure ───────────────────────────────────────────────────────

class EmployeeSalaryStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSalaryStructure
        fields = [
            "id", "employee", "effective_from", "ctc_annual", "monthly_gross",
            "original_basic_da", "original_hra", "original_special_allowance",
            "original_lta", "nps_allowance", "fbp", "vpf", "pf_opted", "change_reason",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class EmployeeSalaryStructureAutoCalcSerializer(serializers.Serializer):
    """POST body for the /salary-structures/auto-calc/ helper endpoint."""
    ctc_annual = serializers.DecimalField(max_digits=12, decimal_places=2)
    pf_opted = serializers.BooleanField(default=True)
    current_lta = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))


# ── Employee (read-only, payroll's own view of employee + structure) ──────

class EmployeeWithStructureSerializer(serializers.Serializer):
    """
    Read-only combined view of a payroll.Employee row and their latest
    EmployeeSalaryStructure, for the payroll "Employees" screen. Not a
    ModelSerializer since it spans two models — see
    views.EmployeeSalaryStructureViewSet.list_employees().
    """
    id = serializers.IntegerField()
    employee_code = serializers.CharField(allow_null=True)
    first_name = serializers.CharField(allow_null=True)
    last_name = serializers.CharField(allow_null=True)
    full_name = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    pan_number = serializers.CharField(allow_null=True)
    department = serializers.CharField(allow_null=True)
    position = serializers.CharField(allow_null=True)
    hire_date = serializers.DateField(allow_null=True)
    status = serializers.CharField()
    ctc = serializers.DecimalField(max_digits=10, decimal_places=2)
    client = serializers.IntegerField(allow_null=True)
    salary_structure = EmployeeSalaryStructureSerializer(allow_null=True)