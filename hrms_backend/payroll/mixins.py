"""
payroll/mixins.py

Local, self-contained replacements for `apps.core.mixins.AuditableMixin`
and `apps.core.views.AuditViewMixin`, which do not exist in this backup
of the project. Kept entirely inside the payroll module per project
requirements (no changes to any other app).
"""

from django.db import models
from django.utils import timezone


class AuditableMixin(models.Model):
    """
    Minimal stand-in for the original apps.core.mixins.AuditableMixin.
    Provides created_at / updated_at timestamps, which is all the payroll
    models actually rely on from it structurally (subclasses add their own
    created_by / uploaded_by / etc. FKs explicitly).
    """

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditViewMixin:
    """
    Minimal stand-in for apps.core.views.AuditViewMixin. The original audit
    log storage isn't available in this backup, so this mixin currently
    just makes sure created_at/updated_at are respected and is a safe no-op
    otherwise. Swap in real audit-log writes here if/when an audit log
    model is introduced.
    """

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
