"""payroll/portal/views/data.py — read-only payroll data scoped to the client."""

from rest_framework import generics

from payroll.models import Employee, EmployeeSalaryStructure, SalaryAdvance

from ..serializers import (
    PortalAdvanceSerializer,
    PortalEmployeeSerializer,
    PortalStructureSerializer,
)
from .base import PortalScopeBase


class PortalEmployeeListView(PortalScopeBase, generics.ListAPIView):
    serializer_class = PortalEmployeeSerializer

    def get_queryset(self):
        return Employee.objects.filter(client=self.get_client()).order_by("employee_code")


class PortalEmployeeDetailView(PortalScopeBase, generics.RetrieveAPIView):
    serializer_class = PortalEmployeeSerializer

    def get_queryset(self):
        return Employee.objects.filter(client=self.get_client())


class PortalStructureListView(PortalScopeBase, generics.ListAPIView):
    serializer_class = PortalStructureSerializer

    def get_queryset(self):
        return (
            EmployeeSalaryStructure.objects.filter(employee__client=self.get_client())
            .select_related("employee")
            .order_by("-effective_from", "-created_at")
        )


class PortalAdvanceListView(PortalScopeBase, generics.ListAPIView):
    serializer_class = PortalAdvanceSerializer

    def get_queryset(self):
        return (
            SalaryAdvance.objects.filter(employee__client=self.get_client())
            .select_related("employee")
            .order_by("-created_at")
        )
