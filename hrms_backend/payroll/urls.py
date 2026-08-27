"""hrms_backend/payroll/urls.py"""

from rest_framework.routers import DefaultRouter

from .views import (
    ClientViewSet, CompOffAdjustmentViewSet, EmailLogViewSet, EmployeeSalaryStructureViewSet,
    EmployeeViewSet, LeaveAdjustmentViewSet, OnHoldAdjustmentViewSet, PayrollBatchViewSet,
    PayrollTemplateViewSet, PayslipRecordViewSet, SalaryAdvanceAdjustmentViewSet,
    SalaryAdvanceViewSet,
)

router = DefaultRouter()
router.register(r"batches", PayrollBatchViewSet, basename="payroll-batch")
router.register(r"records", PayslipRecordViewSet, basename="payslip-record")
router.register(r"email-logs", EmailLogViewSet, basename="email-log")
router.register(r"template", PayrollTemplateViewSet, basename="payroll-template")
router.register(r"comp-off-adjustments", CompOffAdjustmentViewSet, basename="comp-off-adjustment")
router.register(r"leave-adjustments", LeaveAdjustmentViewSet, basename="leave-adjustment")
router.register(r"on-hold-adjustments", OnHoldAdjustmentViewSet, basename="on-hold-adjustment")
router.register(r"salary-advance-adjustments", SalaryAdvanceAdjustmentViewSet, basename="salary-advance-adjustment")
router.register(r"salary-advances", SalaryAdvanceViewSet, basename="salary-advance")
router.register(r"clients", ClientViewSet, basename="payroll-client")
router.register(r"employees", EmployeeViewSet, basename="payroll-employee")
router.register(r"salary-structures", EmployeeSalaryStructureViewSet, basename="salary-structure")

urlpatterns = router.urls