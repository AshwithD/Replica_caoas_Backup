# from django.db.models import Q
# from clients.models import TaskTimeEntry, InternalTimeEntry

# def check_time_overlap(employee, start, end, instance=None, model=None):
#     """
#     Prevent overlapping time entries across BOTH tables
#     model -> "task" or "internal"
#     """

#     # TASK ENTRIES
#     task_qs = TaskTimeEntry.objects.filter(
#         employee=employee,
#         start_time__lt=end,
#         end_time__gt=start
#     )

#     # INTERNAL ENTRIES
#     internal_qs = InternalTimeEntry.objects.filter(
#         employee=employee,
#         start_time__lt=end,
#         end_time__gt=start
#     )

#     # Exclude self when updating
#     if instance:
#         if model == "task":
#             task_qs = task_qs.exclude(id=instance.id)
#         elif model == "internal":
#             internal_qs = internal_qs.exclude(id=instance.id)

#     if task_qs.exists() or internal_qs.exists():
#         return True

#     return False


from django.db.models import Q


def check_time_overlap(employee, start_time, end_time, instance=None, entry_type="task"):
    """
    Check if the given time range overlaps with any existing TaskTimeEntry
    or InternalTimeEntry for the same employee.

    Args:
        employee:    The user (request.user)
        start_time:  datetime of the new entry's start
        end_time:    datetime of the new entry's end
        instance:    The current model instance (used when editing, to exclude self)
        entry_type:  "task" or "internal" — tells us which table the instance belongs to

    Returns:
        True if an overlap exists, False otherwise.
    """
    from clients.models import TaskTimeEntry, InternalTimeEntry  # adjust import path

    # Overlap condition:
    # existing.start < new.end  AND  existing.end > new.start
    overlap_q = Q(start_time__lt=end_time, end_time__gt=start_time)

    # ── 1. Check TaskTimeEntry ──────────────────────────────────────────────
    task_qs = TaskTimeEntry.objects.filter(
        overlap_q,
        employee=employee,
        start_time__isnull=False,
        end_time__isnull=False,
    )

    # When editing an existing TaskTimeEntry, exclude itself
    if instance and entry_type == "task" and instance.pk:
        task_qs = task_qs.exclude(pk=instance.pk)

    if task_qs.exists():
        return True

    # ── 2. Check InternalTimeEntry ──────────────────────────────────────────
    internal_qs = InternalTimeEntry.objects.filter(
        overlap_q,
        employee=employee,
        start_time__isnull=False,
        end_time__isnull=False,
    )

    # When editing an existing InternalTimeEntry, exclude itself
    if instance and entry_type == "internal" and instance.pk:
        internal_qs = internal_qs.exclude(pk=instance.pk)

    if internal_qs.exists():
        return True

    return False