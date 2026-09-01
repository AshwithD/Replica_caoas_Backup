"""payroll/portal/serializers/submissions.py — submissions + items."""

from rest_framework import serializers

from ..models import PortalSubmission, PortalSubmissionItem
from ..validators import required_keys


class PortalSubmissionSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    # Short, list-friendly preview of the client's notes for this month —
    # submission.notes plus any NOTE item texts — so staff can see what the
    # client wrote without opening the submission. Callers should
    # prefetch_related("items") to avoid N+1 queries.
    note_preview = serializers.SerializerMethodField()

    class Meta:
        model = PortalSubmission
        fields = [
            "id", "client", "client_name", "month", "year", "status", "notes",
            "note_preview", "rejection_reason", "submitted_by", "submitted_at",
            "approved_by", "approved_at", "item_count", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "client", "status", "rejection_reason", "submitted_by",
            "submitted_at", "approved_by", "approved_at", "created_at", "updated_at",
        ]

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
