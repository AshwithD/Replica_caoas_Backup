"""payroll/portal/serializers/submissions.py — submissions + items."""

from rest_framework import serializers

from ..locks import locks_for
from ..models import PortalSubmission, PortalSubmissionItem
from ..validators import required_keys


def client_logo_url(client, request=None):
    """Absolute URL of the client's payroll logo, or None.

    The logo lives on the payroll-only extension (payroll.ClientProfile
    .payroll_logo); a client added in the Client module has no profile yet,
    so every hop is guarded and the UI falls back to initials.
    """
    profile = getattr(client, "payroll_profile", None)
    image = getattr(profile, "payroll_logo", None)
    if not image:
        return None
    try:
        url = image.url
    except ValueError:  # file field with no file
        return None
    return request.build_absolute_uri(url) if request is not None else url


class PortalSubmissionSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    # Client branding for the staff list / detail header (falls back to
    # initials in the UI when the client has no logo uploaded).
    client_logo = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    # Round history (submit / approve / reject) for the client's History
    # timeline. Callers should prefetch_related("history") to avoid N+1.
    history = serializers.SerializerMethodField()
    # Short, list-friendly preview of the client's notes for this month —
    # submission.notes plus any NOTE item texts — so staff can see what the
    # client wrote without opening the submission. Callers should
    # prefetch_related("items") to avoid N+1 queries.
    note_preview = serializers.SerializerMethodField()
    # How many items still need applying — lets the staff list flag a month
    # that needs attention without opening it. Uses the prefetched items.
    pending_item_count = serializers.SerializerMethodField()
    # Payslips already generated for this month? Then the month is closed for
    # portal edits — see payroll/portal/locks.py.
    payroll_lock = serializers.SerializerMethodField()

    class Meta:
        model = PortalSubmission
        fields = [
            "id", "client", "client_name", "client_logo", "month", "year", "status", "notes",
            "note_preview", "rejection_reason", "submitted_by", "submitted_at",
            "approved_by", "approved_by_name", "approved_at", "item_count",
            "pending_item_count", "payroll_lock",
            "history", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "client", "status", "rejection_reason", "submitted_by",
            "submitted_at", "approved_by", "approved_at", "created_at", "updated_at",
        ]

    def get_client_logo(self, obj):
        return client_logo_url(obj.client, self.context.get("request"))

    @staticmethod
    def _staff_name(user):
        """Best-effort display name for a staff (account.User) actor."""
        if not user:
            return None
        parts = [getattr(user, "first_name", None), getattr(user, "last_name", None)]
        name = " ".join(p for p in parts if p).strip()
        return name or user.email

    def get_approved_by_name(self, obj):
        return self._staff_name(obj.approved_by)

    def get_history(self, obj):
        events = []
        for ev in obj.history.all():
            if ev.event_type == "SUBMITTED":
                actor = ev.actor_portal.email if ev.actor_portal else None
            else:
                actor = self._staff_name(ev.actor_staff)
            events.append(
                {
                    "id": ev.id,
                    "event_type": ev.event_type,
                    "item_count": ev.item_count,
                    "note": ev.note,
                    "actor": actor,
                    "created_at": ev.created_at.isoformat(),
                }
            )
        return events

    def get_payroll_lock(self, obj):
        # Cached on the ListSerializer so a page of months costs two queries
        # in total instead of two per row.
        root = self.parent if isinstance(self.parent, serializers.ListSerializer) else self
        cache = getattr(root, "_payroll_lock_cache", None)
        if cache is None:
            source = root.instance
            if source is None:
                rows = [obj]
            elif isinstance(source, PortalSubmission):
                rows = [source]
            else:
                rows = list(source)
            cache = locks_for(rows)
            root._payroll_lock_cache = cache
        key = (obj.client_id, int(obj.month), int(obj.year))
        if key not in cache:
            cache.update(locks_for([obj]))
        return cache[key]

    def get_pending_item_count(self, obj):
        return sum(1 for item in obj.items.all() if item.status != "APPLIED")

    def get_note_preview(self, obj):
        parts = []
        if obj.notes and obj.notes.strip():
            parts.append(obj.notes.strip())
        for item in obj.items.all():
            if item.item_type == "NOTE":
                text = (item.payload or {}).get("text")
                if text and str(text).strip():
                    parts.append(str(text).strip())
        if not parts:
            return ""
        preview = " · ".join(dict.fromkeys(parts))  # de-dupe, keep order
        return preview if len(preview) <= 160 else preview[:157] + "…"


class PortalSubmissionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalSubmissionItem
        fields = [
            "id", "submission", "item_type", "payload", "status", "error",
            "sort", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "submission", "status", "error", "created_at", "updated_at"]

    def validate(self, attrs):
        item_type = attrs.get("item_type")
        payload = attrs.get("payload") or {}
        if not isinstance(payload, dict):
            raise serializers.ValidationError({"payload": "payload must be a JSON object."})
        if item_type:
            missing = [key for key in required_keys(item_type) if not payload.get(key)]
            if missing:
                raise serializers.ValidationError(
                    {"payload": f"Missing required field(s): {', '.join(missing)}."}
                )
        attrs["payload"] = payload
        return attrs
