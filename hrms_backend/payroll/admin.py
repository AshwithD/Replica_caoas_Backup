"""apps/payroll/admin.py"""

from django.contrib import admin

from .models import (
    Client, CompOffAdjustment, EmailLog, Employee, EmployeeSalaryStructure, LeaveAdjustment,
    OnHoldAdjustment, PayrollBatch, PayslipRecord, PayslipRecordEdit, SalaryAdvanceAdjustment,
)


class PayslipRecordInline(admin.TabularInline):
    model = PayslipRecord
    extra = 0
    can_delete = False
    readonly_fields = [field.name for field in PayslipRecord._meta.fields]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(PayrollBatch)
class PayrollBatchAdmin(admin.ModelAdmin):
    list_display = ("client", "month", "year", "status", "total_records", "email_sent", "email_failed")
    list_filter = ("status", "year", "month", "client")
    search_fields = ("client__name",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [PayslipRecordInline]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CompOffAdjustment)
class CompOffAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("employee", "amount", "applied_in_record", "created_by", "created_at")
    list_filter = ("applied_in_record",)
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code", "reason")


@admin.register(LeaveAdjustment)
class LeaveAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("employee", "amount", "applied_in_record", "created_by", "created_at")
    list_filter = ("applied_in_record",)
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code", "reason")


@admin.register(SalaryAdvanceAdjustment)
class SalaryAdvanceAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("employee", "amount", "applied_in_record", "created_by", "created_at")
    list_filter = ("applied_in_record",)
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code", "reason")


@admin.register(OnHoldAdjustment)
class OnHoldAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("employee", "amount", "applied_in_record", "created_by", "created_at")
    list_filter = ("applied_in_record",)
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code", "reason")


@admin.register(PayslipRecord)
class PayslipRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "batch", "gross_salary", "net_salary", "status", "edit_count")
    list_filter = ("status", "batch__year", "batch__month", "batch__client")
    search_fields = ("employee__employee_code", "employee__first_name", "employee__last_name", "employee__email")
    readonly_fields = ("total_deductions", "net_salary", "pdf_path", "pdf_password", "raw_row_data", "created_at", "updated_at")

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PayslipRecordEdit)
class PayslipRecordEditAdmin(admin.ModelAdmin):
    list_display = ("payslip_record", "field_name", "edited_by", "created_at")
    search_fields = ("payslip_record__employee__employee_code", "field_name")
    readonly_fields = [field.name for field in PayslipRecordEdit._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ("payslip_record", "recipient_email", "success", "attempt_number", "sent_at")
    list_filter = ("success", "sent_at")
    search_fields = ("recipient_email", "payslip_record__employee__employee_code")
    readonly_fields = [field.name for field in EmailLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(EmployeeSalaryStructure)
class EmployeeSalaryStructureAdmin(admin.ModelAdmin):
    list_display = ("employee", "effective_from", "ctc_annual", "monthly_gross", "pf_opted", "created_at")
    list_filter = ("pf_opted", "effective_from")
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "gstin", "updated_at")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "full_name", "client", "department", "position", "status")
    list_filter = ("status", "client", "department")
    search_fields = ("employee_code", "first_name", "last_name", "email")
