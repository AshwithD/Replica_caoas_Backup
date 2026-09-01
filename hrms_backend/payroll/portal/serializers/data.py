"""payroll/portal/serializers/data.py — read-only payroll data for the portal."""

from rest_framework import serializers

from payroll.models import (
    Employee,
    EmployeeSalaryStructure,
    SalaryAdvance,
    get_latest_salary_structure,
)


class PortalEmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    latest_ctc_annual = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_code", "first_name", "last_name", "full_name",
            "email", "pan_number", "department", "position", "hire_date",
            "ctc", "status", "latest_ctc_annual",
        ]

    def get_latest_ctc_annual(self, obj):
        structure = get_latest_salary_structure(obj)
        return structure.ctc_annual if structure else None


class PortalStructureSerializer(serializers.ModelSerializer):
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = EmployeeSalaryStructure
        fields = [
            "id", "employee", "employee_code", "employee_name", "effective_from",
            "ctc_annual", "monthly_gross", "original_basic_da", "original_hra",
            "original_special_allowance", "original_lta", "nps_allowance", "fbp",
            "vpf", "pf_opted", "employer_pf", "change_reason",
        ]


class PortalAdvanceSerializer(serializers.ModelSerializer):
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = SalaryAdvance
        fields = [
            "id", "employee", "employee_code", "employee_name",
            "total_amount", "tenure_months", "emi_amount", "reason", "created_at",
        ]
