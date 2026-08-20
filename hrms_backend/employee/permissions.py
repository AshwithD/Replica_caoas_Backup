

from rest_framework import permissions

class IsHRorAdmin(permissions.BasePermission):
    """
    Custom permission: Allow only HR, Admin, or superusers for write actions.
    Read (safe) methods are open for all.
    """

    def has_permission(self, request, view):
        # Allow all users (authenticated or not) to perform safe methods (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow write actions only for authenticated HR, Admin, or superusers
        return (
            request.user and request.user.is_authenticated and (
                request.user.is_superuser or
                request.user.role in ['HR', 'Admin', 'Founder']
            )
        )


class IsEmployeeOrHRorAdmin(permissions.BasePermission):
    """
    Custom permission: 
    - Allow employees to manage their own objects.
    - HR, Admin, and superusers can manage any object.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Always allow safe methods (GET, HEAD, OPTIONS) for HR, Admin, superuser, or the object owner
        if request.method in permissions.SAFE_METHODS:
            return (
                user.is_authenticated and (
                    user.is_superuser or
                    user.role in ['hr', 'Admin'] or
                    self.is_object_owner(obj, user)
                )
            )

        # For write actions (POST, PUT, PATCH, DELETE):
        # - HR, Admin, and superusers can manage any object
        # - Employees can only modify their own object
        return (
            user.is_authenticated and (
                user.is_superuser or
                user.role in ['hr', 'Admin'] or
                self.is_object_owner(obj, user)
            )
        )

    def is_object_owner(self, obj, user):
        """
        Check if the given user is the owner of the object.
        Handles cases where:
        - obj has an `employee` field linked to a user
        - obj is a `User` itself
        """

        # If object has an employee (e.g., Payroll, LeaveRequest, etc.)
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'user'):
            return obj.employee.user == user

        # If object directly has a `user` field (e.g., User model, or models directly linked to user)
        if hasattr(obj, 'user'):
            return obj.user == user

        return False


class IsAdminOrFounder(permissions.BasePermission):
    """
    Custom permission: Allow only Admin, Founder, or superusers.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role in ['Admin', 'Founder']
            )
        )
