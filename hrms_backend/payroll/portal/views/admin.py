"""payroll/portal/views/admin.py — internal staff endpoints.

These run on the main project's auth (staff tokens), not the portal auth:
the firm creates client credentials here and reviews/approves/rejects
client submissions here — and can also add input of its own to a month
before generating the payroll batch.
"""

from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import (
    PortalSubmission,
    PortalSubmissionEvent,
    PortalSubmissionItem,
    PortalUser,
)
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
        PortalSubmission.objects.select_related(
            "client", "client__payroll_profile", "submitted_by", "approved_by"
        )
        .prefetch_related("items", "history")
        .order_by("-year", "-month")
    )
    serializer_class = PortalSubmissionSerializer

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Tiny counter for the Payroll dashboard badge.

        Deliberately does NOT serialize submissions — the dashboard only needs
        to know "did anyone submit something I haven't looked at yet", and it
        polls, so this stays two aggregate queries.
        """
        agg = PortalSubmission.objects.aggregate(
            awaiting_review=Count("id", filter=Q(status=PortalSubmission.STATUS_SUBMITTED)),
            last_submitted_at=Max("submitted_at", filter=Q(status=PortalSubmission.STATUS_SUBMITTED)),
            total=Count("id"),
        )
        pending_items = (
            PortalSubmissionItem.objects.exclude(status=PortalSubmissionItem.STATUS_APPLIED).count()
        )
        return Response(
            {
                "awaiting_review": agg["awaiting_review"] or 0,
                "pending_items": pending_items,
                "total": agg["total"] or 0,
                "last_submitted_at": agg["last_submitted_at"],
            }
        )

    def _get_item(self, submission, item_pk):
        return submission.items.filter(pk=item_pk).first()

    @action(detail=True, methods=["post"], url_path="items/(?P<item_pk>[^/.]+)/apply")
    def apply_single_item(self, request, pk=None, item_pk=None):
        """Apply ONE staged change instead of the whole month.

        Safer than the bulk button when a month holds a mix of good and bad
        input: you apply what is correct and skip what isn't, without
        approving the rest by accident.
        """
        submission = self.get_object()
        if submission.status == PortalSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "This month is submitted — use Approve & Apply instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if submission.status == PortalSubmission.STATUS_REJECTED:
            return Response(
                {
                    "detail": (
                        "This month was returned to the client — its items can't be applied "
                        "until they resubmit. Skip the ones that should never apply."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        item = self._get_item(submission, item_pk)
        if item is None:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        if item.status == PortalSubmissionItem.STATUS_APPLIED:
            return Response(
                {"detail": "This change is already applied."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        applied = apply_item(item, approved_by=request.user)
        submission.approved_by = request.user
        submission.approved_at = timezone.now()
        submission.save(update_fields=["approved_by", "approved_at", "updated_at"])
        record_event(
            submission,
            PortalSubmissionEvent.TYPE_APPROVED,
            item_count=1 if applied else 0,
            actor_staff=request.user,
            note=f"Applied one change ({item.item_type})." if applied else None,
        )
        if applied:
            refresh_batch_after_apply(submission, request.user, [item])
        item.refresh_from_db()
        submission.refresh_from_db()
        return Response(
            {
                "detail": "Change applied." if applied else (item.error or "The change could not be applied."),
                "applied": applied,
                "item": PortalSubmissionItemSerializer(item).data,
                "submission": PortalSubmissionSerializer(
                    submission, context=self.get_serializer_context()
                ).data,
            },
            status=status.HTTP_200_OK if applied else status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=True, methods=["post"], url_path="items/(?P<item_pk>[^/.]+)/skip")
    def skip_single_item(self, request, pk=None, item_pk=None):
        """Dismiss a staged change so it stops queueing for application.

        Used for input that should never reach payroll (wrong month, duplicate,
        already handled offline) — especially on a month you returned, where
        the items would otherwise sit PENDING forever.
        """
        submission = self.get_object()
        if submission.status == PortalSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "This month is submitted — approve or reject it first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item = self._get_item(submission, item_pk)
        if item is None:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        if item.status == PortalSubmissionItem.STATUS_APPLIED:
            return Response(
                {"detail": "This change is already applied and can't be skipped."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = (request.data.get("reason") or "").strip()
        item.status = PortalSubmissionItem.STATUS_SKIPPED
        item.error = reason or "Skipped by the payroll team."
        item.save(update_fields=["status", "error", "updated_at"])
        return Response(
            {
                "detail": "Change skipped.",
                "item": PortalSubmissionItemSerializer(item).data,
            }
        )

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

    @action(detail=True, methods=["post"], url_path="apply-pending")
    def apply_pending(self, request, pk=None):
        """Apply the items of a month the client has NOT (re)submitted.

        A month reopens to DRAFT after every approval, so anything the client
        adds afterwards — or a change they emailed while the month was already
        approved — sits PENDING with no Approve button available (approve/
        reject only accept SUBMITTED). Staff are the approvers, so this
        applies those leftover items directly, records the APPROVED round and
        folds the result into an already-generated batch.
        """
        submission = self.get_object()
        if submission.status == PortalSubmission.STATUS_SUBMITTED:
            return Response(
                {"detail": "This month is submitted — use Approve & Apply instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # You returned this month because the values were wrong; applying the
        # very same items in bulk afterwards would push that wrong data into
        # payroll. Wait for the corrected resubmission, or handle the items
        # one by one (apply/skip below).
        if submission.status == PortalSubmission.STATUS_REJECTED:
            return Response(
                {
                    "detail": (
                        "This month was returned to the client. Wait for their corrected "
                        "resubmission, or apply/skip the individual items."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        pending = submission.items.exclude(status="APPLIED").count()
        if not pending:
            return Response(
                {"detail": "Nothing to apply — every item is already applied."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        summary = apply_submission(
            submission, approved_by=request.user, allow_unsubmitted=True
        )
        submission.refresh_from_db()
        return Response(
            {
                "detail": "Pending changes applied. The month stays open for further changes.",
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
