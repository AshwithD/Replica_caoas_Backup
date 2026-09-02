"""payroll/portal/views/submissions.py — monthly submissions + their items."""

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import PortalSubmission, PortalSubmissionEvent, PortalSubmissionItem
from ..serializers import PortalSubmissionItemSerializer, PortalSubmissionSerializer
from ..services import record_event
from .base import PortalScopeBase


class PortalSubmissionListCreateView(PortalScopeBase, generics.ListCreateAPIView):
    serializer_class = PortalSubmissionSerializer

    def get_queryset(self):
        return (
            PortalSubmission.objects.filter(client=self.get_client())
            .prefetch_related("items", "history")
            .order_by("-year", "-month")
        )

    def create(self, request, *args, **kwargs):
        """Open (or reopen) a month for the client. Idempotent."""
        month = request.data.get("month")
        year = request.data.get("year")
        if month in (None, "") or year in (None, ""):
            raise ValidationError({"detail": "month and year are required."})
        try:
            month = int(month)
            year = int(year)
        except (TypeError, ValueError):
            raise ValidationError({"detail": "month and year must be integers."})
        if not (1 <= month <= 12):
            raise ValidationError({"detail": "month must be between 1 and 12."})

        submission, _ = PortalSubmission.objects.get_or_create(
            client=self.get_client(), month=month, year=year
        )
        return Response(
            PortalSubmissionSerializer(submission, context=self.get_serializer_context()).data,
            status=status.HTTP_200_OK,
        )


class PortalSubmissionSubmitView(PortalScopeBase, APIView):
    def post(self, request, pk):
        submission = self._get_submission(pk)
        if submission.status not in PortalSubmission.EDITABLE_STATUSES:
            raise ValidationError(
                {"detail": "Only draft or rejected submissions can be submitted."}
            )
        submission.status = PortalSubmission.STATUS_SUBMITTED
        submission.rejection_reason = ""
        submission.submitted_by = request.user
        submission.submitted_at = timezone.now()
        submission.save(
            update_fields=[
                "status", "rejection_reason", "submitted_by", "submitted_at", "updated_at",
            ]
        )
        # Count only the items being submitted THIS round (everything not yet
        # applied) — matching what the approver's summary will report, so the
        # "Submitted for review" and "Approved and applied" entries for a round
        # always agree. Using items.count() would include items already applied
        # in earlier rounds and made the approved count look like it "fell back".
        pending_count = submission.items.exclude(
            status=PortalSubmissionItem.STATUS_APPLIED
        ).count()
        record_event(
            submission,
            PortalSubmissionEvent.TYPE_SUBMITTED,
            item_count=pending_count,
            actor_portal=request.user,
        )
        return Response(PortalSubmissionSerializer(submission).data)

    def _get_submission(self, pk):
        submission = PortalSubmission.objects.filter(
            pk=pk, client=self.get_client()
        ).first()
        if submission is None:
            raise PermissionDenied("Submission not found.")
        return submission


class PortalSubmissionNotesView(PortalScopeBase, APIView):
    """Client writes/clears the month-level note for the payroll team."""

    def post(self, request, pk):
        submission = PortalSubmission.objects.filter(
            pk=pk, client=self.get_client()
        ).first()
        if submission is None:
            raise PermissionDenied("Submission not found.")
        if submission.status not in PortalSubmission.EDITABLE_STATUSES:
            raise ValidationError(
                {"detail": "This submission is locked and its notes can't be changed."}
            )
        submission.notes = (request.data.get("notes") or "").strip()
        submission.save(update_fields=["notes", "updated_at"])
        return Response(PortalSubmissionSerializer(submission).data)


class PortalItemListCreateView(PortalScopeBase, generics.ListCreateAPIView):
    serializer_class = PortalSubmissionItemSerializer

    def get_submission(self):
        submission = PortalSubmission.objects.filter(
            pk=self.kwargs["pk"], client=self.get_client()
        ).first()
        if submission is None:
            raise PermissionDenied("Submission not found.")
        return submission

    def get_queryset(self):
        return self.get_submission().items.all()

    def perform_create(self, serializer):
        submission = self.get_submission()
        if submission.status not in PortalSubmission.EDITABLE_STATUSES:
            raise ValidationError(
                {"detail": "This submission is locked. Only draft or rejected submissions can be edited."}
            )
        serializer.save(submission=submission, created_by=self.request.user)


class PortalItemDetailView(PortalScopeBase, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PortalSubmissionItemSerializer

    def get_object(self):
        item = (
            PortalSubmissionItem.objects.filter(
                pk=self.kwargs["item_pk"],
                submission_id=self.kwargs["pk"],
                submission__client=self.get_client(),
            )
            .select_related("submission")
            .first()
        )
        if item is None:
            raise PermissionDenied("Item not found.")
        self.check_object_permissions(self.request, item)
        return item

    def _ensure_editable(self, item):
        if item.submission.status not in PortalSubmission.EDITABLE_STATUSES:
            raise ValidationError(
                {"detail": "This submission is locked. Only draft or rejected submissions can be edited."}
            )

    def perform_update(self, serializer):
        self._ensure_editable(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_editable(instance)
        instance.delete()
