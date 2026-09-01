"""
payroll/portal/auth.py

Authentication for the client portal. Portal credentials live in the
payroll module (payroll.portal.models.PortalUser), completely separate
from the main project's AUTH_USER_MODEL — a portal login can never reach
the internal app and vice versa.

A successful login mints a random 64-hex token; only its SHA-256 digest is
stored on the user row (auth_token_hash), so the token value itself is not
persisted. Portal endpoints authenticate via:

    Authorization: Token <token>
"""

import hashlib
import secrets

from rest_framework import authentication, exceptions, permissions

from .models import PortalUser


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def issue_token(user: PortalUser) -> str:
    """Generates a fresh login token for `user` and returns the raw value."""
    raw = secrets.token_hex(32)
    user.auth_token_hash = _hash_token(raw)
    user.save(update_fields=["auth_token_hash", "updated_at"])
    return raw


def revoke_token(user: PortalUser) -> None:
    """Logs `user` out by clearing the stored token hash."""
    user.auth_token_hash = ""
    user.save(update_fields=["auth_token_hash", "updated_at"])


class PortalUserAuthentication(authentication.BaseAuthentication):
    """Resolves a PortalUser from ``Authorization: Token <token>``."""

    keyword = "Token"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).split()
        if not header or header[0].lower() != self.keyword.lower().encode():
            return None

        if len(header) == 1:
            raise exceptions.AuthenticationFailed("Invalid token header. No credentials provided.")
        if len(header) > 2:
            raise exceptions.AuthenticationFailed(
                "Invalid token header. Token string should not contain spaces."
            )

        raw_token = header[1].decode()
        if not raw_token:
            raise exceptions.AuthenticationFailed("Empty token.")

        digest = _hash_token(raw_token)
        try:
            user = PortalUser.objects.select_related("client").get(
                auth_token_hash=digest, is_active=True
            )
        except PortalUser.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or expired token.")

        if not user.client:
            raise exceptions.AuthenticationFailed("This portal account is not linked to a client.")

        return (user, None)

    def authenticate_header(self, request):
        return self.keyword


class IsPortalUser(permissions.BasePermission):
    """Grants access only to authenticated PortalUser requests."""

    message = "Portal authentication required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return isinstance(user, PortalUser) and user.is_active
