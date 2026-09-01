"""
payroll/portal

The client-facing payroll portal: portal credentials, monthly input
submissions, and the apply-on-approve pipeline. Everything lives inside
the payroll module — portal logins are completely separate from the main
project's users (account.User).

Layout:
    models/          portal-owned tables (registered under the payroll app)
    auth.py          token auth + permission (PortalUserAuthentication)
    validators.py    item payload schema validation
    serializers/     auth / data / submissions / admin serializers
    views/           auth / data / submissions / admin endpoints
    services.py      apply_submission — turns approved items into payroll rows
    urls.py          /api/portal/* routes
"""

from . import auth, models, services, urls, validators  # noqa: F401
from .auth import IsPortalUser, PortalUserAuthentication  # noqa: F401
from .models import (  # noqa: F401
    PortalAdjustment,
    PortalSubmission,
    PortalSubmissionItem,
    PortalUser,
)
