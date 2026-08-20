from django.core.management.base import BaseCommand
from django.utils.timezone import is_aware, make_naive
from decimal import Decimal
from clients.models import TaskTimeEntry


class Command(BaseCommand):
    help = "Recalculate duration ignoring seconds"

    def handle(self, *args, **kwargs):
        updated = 0

        entries = TaskTimeEntry.objects.exclude(end_time=None)

        total = entries.count()
        print(f"Processing {total} records...")

        for entry in entries.iterator():

            start = entry.start_time
            end = entry.end_time

            if not start or not end:
                continue

            if is_aware(start):
                start = make_naive(start)

            if is_aware(end):
                end = make_naive(end)

            if end <= start:
                continue

            # ---- minute based calculation ----
            total_seconds = (end - start).total_seconds()
            total_minutes = int(total_seconds // 60)

            hours = total_minutes // 60
            minutes = total_minutes % 60

            new_duration = Decimal(f"{hours}.{minutes:02d}")

            if entry.duration != new_duration:
                # 🔥 BYPASS MODEL SAVE & VALIDATION
                TaskTimeEntry.objects.filter(pk=entry.pk).update(duration=new_duration)
                updated += 1

        print(f"\nUpdated {updated} records successfully.")
