"""
payroll/portal/views

Portal endpoints, split by concern:
    base.py        PortalScopeBase (auth + client scoping)
    auth.py        login / logout / me / change-password
    data.py        read-only employees / structures / advances
    submissions.py monthly submissions + items
    admin.py       internal staff endpoints (credentials + approval)
"""

from .admin import PortalSubmissionAdminViewSet, PortalUserAdminViewSet
from .auth import (
    PortalChangePasswordView,
    PortalLoginView,
    PortalLogoutView,
    PortalMeView,
)
from .base import PortalScopeBase
from .data import (
    PortalAdvanceListView,
    PortalEmployeeDetailView,
    PortalEmployeeListView,
    PortalStructureListView,
)
from .submissions import (
    PortalItemDetailView,
    PortalItemListCreateView,
    PortalSubmissionListCreateView,
    PortalSubmissionNotesView,
    PortalSubmissionSubmitView,
)

__all__ = [
    "PortalScopeBase",
    "PortalLoginView",
    "PortalLogoutView",
    "PortalMeView",
    "PortalChangePasswordView",
    "PortalEmployeeListView",
    "PortalEmployeeDetailView",
    "PortalStructureListView",
    "PortalAdvanceListView",
    "PortalSubmissionListCreateView",
    "PortalSubmissionSubmitView",
    "PortalSubmissionNotesView",
    "PortalItemListCreateView",
    "PortalItemDetailView",
    "PortalUserAdminViewSet",
    "PortalSubmissionAdminViewSet",
]
