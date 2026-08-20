from rest_framework import status
from rest_framework.response import Response

class SoftDeleteMixin:
    """
    Overrides delete() to perform soft delete instead of hard delete
    """

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(
            {"detail": "Record deactivated successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
