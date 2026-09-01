"""
payroll/portal/urls.py

URLs for the client portal. These hang off /api/portal/ and are protected
by payroll's own PortalUserAuthentication (not the main project's auth).
"""

from django.urls import path

from . import views

urlpatterns = [
    # Auth
    path("login/", views.PortalLoginView.as_view(), name="portal-login"),
    path("logout/", views.PortalLogoutView.as_view(), name="portal-logout"),
    path("me/", views.PortalMeView.as_view(), name="portal-me"),
    path("change-password/", views.PortalChangePasswordView.as_view(), name="portal-change-password"),

    # Current payroll data (read-only, scoped to the client)
    path("employees/", views.PortalEmployeeListView.as_view(), name="portal-employees"),
    path("employees/<int:pk>/", views.PortalEmployeeDetailView.as_view(), name="portal-employee-detail"),
    path("salary-structures/", views.PortalStructureListView.as_view(), name="portal-structures"),
    path("advances/", views.PortalAdvanceListView.as_view(), name="portal-advances"),

    # Monthly submissions + their items
    path("submissions/", views.PortalSubmissionListCreateView.as_view(), name="portal-submissions"),
    path("submissions/<int:pk>/submit/", views.PortalSubmissionSubmitView.as_view(), name="portal-submission-submit"),
    path("submissions/<int:pk>/notes/", views.PortalSubmissionNotesView.as_view(), name="portal-submission-notes"),
    path("submissions/<int:pk>/items/", views.PortalItemListCreateView.as_view(), name="portal-submission-items"),
    path(
        "submissions/<int:pk>/items/<int:item_pk>/",
        views.PortalItemDetailView.as_view(),
        name="portal-submission-item-detail",
    ),
]
