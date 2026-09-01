"""payroll/portal/views/base.py — shared portal view base."""

from ..auth import IsPortalUser, PortalUserAuthentication


class PortalScopeBase:
    """Base for all client-facing portal views: portal auth + client scoping."""

    authentication_classes = [PortalUserAuthentication]
    permission_classes = [IsPortalUser]

    def get_client(self):
        return self.request.user.client
