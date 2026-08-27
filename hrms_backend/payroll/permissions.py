"""
payroll/permissions.py

Local replacement for the missing apps.core.permissions.IsAdminOrManagerRole,
built against this project's actual account.User.role choices
(Admin, Founder, HR, Manager, Team Lead, Employee, Intern). Kept inside the
payroll module only.
"""

from rest_framework import permissions

ADMIN_MANAGER_ROLES = ["Admin", "Founder", "HR", "Manager"]


class IsAdminOrManagerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in ADMIN_MANAGER_ROLES)
        )
