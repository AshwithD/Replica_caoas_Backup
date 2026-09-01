"""
payroll/portal/serializers

Portal serializers, split by concern:
    auth.py        login / self / change-password
    data.py        read-only views of current payroll data
    submissions.py monthly submissions + items
    admin.py       internal management of portal credentials
"""

from .admin import PortalUserAdminSerializer
from .auth import (
    PortalChangePasswordSerializer,
    PortalLoginSerializer,
    PortalUserSelfSerializer,
)
from .data import (
    PortalAdvanceSerializer,
    PortalEmployeeSerializer,
    PortalStructureSerializer,
)
from .submissions import PortalSubmissionItemSerializer, PortalSubmissionSerializer

__all__ = [
    "PortalLoginSerializer",
    "PortalUserSelfSerializer",
    "PortalChangePasswordSerializer",
    "PortalEmployeeSerializer",
    "PortalStructureSerializer",
    "PortalAdvanceSerializer",
    "PortalSubmissionSerializer",
    "PortalSubmissionItemSerializer",
    "PortalUserAdminSerializer",
]
