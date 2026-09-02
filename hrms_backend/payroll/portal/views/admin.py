"""payroll/portal/views/admin.py — internal staff endpoints.

These run on the main project's auth (staff tokens), not the portal auth:
the firm creates client credentials here and reviews/approves/rejects
client submissions here — and can also add input of its own to a month
before generating the payroll batch.
"""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import PortalSubmission, PortalSubmissionEvent, PortalUser
from ..serializers import (
    PortalSubmissionItemSerializer,
    PortalSubmissionSerializer,
    PortalUserAdminSerializer,
)
from ..services import apply_item, apply_submission, record_event, refresh_batch_after_apply


class PortalUserAdminViewSet(viewsets.ModelViewSet):
    """Staff-only management of client portal logins (payroll module)."""

    queryset = PortalUser.objects.select_related("client").all().order_by("email")
    serializer_class = PortalUserAdminSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class PortalSubmissionAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Staff view of every client's monthly submissions + approve/reject."""

    queryset = (
        PortalSubmission.objects.select_related("client", "submitted_by", "approved_by")
        .prefetch_related("items", "history")
        .order_by("-year", "-month")
    )
    serializer_class = PortalSubmissionSerializer

    @action(detail=True, methods=["get"], url_path="items")
    def items(self, request, pk=None):
        submission = self.get_object()
        return Response(
            PortalSubmissionItemSerializer(submission.items.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="add-item")
    def add_item(self, request, pk=None):
        """Staff adds input directly to a month (the client emailed a change
        and you're keying it in). Staff items apply immediately — the staff
        member IS the approver — so no submit/approve round-trip is needed.

        Uses its own url_path ("add-item") rather than "items": two @action
        routes sharing "items" collide — Django matches the first one and
        returns 405 for the other method, which silently broke the GET
        "items" list the detail modal uses."""
        submission = self.get_object()
        serializer = PortalSubmissionItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(submission=submission)  # created_by null (staff)
        applied = apply_item(item, approved_by=request.user)
        submission.approved_by = request.user
        submission.approved_at = timezone.now()
        submission.save(update_fields=["approved_by", "approved_at", "updated_at"])
        if applied:
            record_event(
                submission,
                PortalSubmissionEvent.TYPE_APPROVED,
                item_count=1,
                actor_staff=request.user,
            )
            # Push the change straight into the month's batch if it already
            # exists (the staff member IS the approver here — no later
            # submit/approve round-trip will re-apply it).
            refresh_batch_after_apply(submission, request.user, [item])
        return Response(
            {
                "item": PortalSubmissionItemSerializer(item).data,
                "applied": applied,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        submission = self.get_object()
        if submission.status != PortalSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "Only submitted submissions can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        summary = apply_submission(submission, approved_by=request.user)
        submission.refresh_from_db()
        return Response(
            {
                "detail": "Approved and applied. The month is open again for any further changes.",
                "submission": PortalSubmissionSerializer(submission).data,
                "summary": summary,
            }
        )

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        submission = self.get_object()
        if submission.status != PortalSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "Only submitted submissions can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        submission.status = PortalSubmission.STATUS_REJECTED
        submission.rejection_reason = (request.data.get("reason") or "").strip()
        submission.save(update_fields=["status", "rejection_reason", "updated_at"])
        record_event(
            submission,
            PortalSubmissionEvent.TYPE_REJECTED,
            item_count=submission.items.count(),
            actor_staff=request.user,
            note=submission.rejection_reason,
        )
        return Response(PortalSubmissionSerializer(submission).data)
