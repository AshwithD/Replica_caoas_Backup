# from django.core.management.base import BaseCommand
# from django.utils import timezone
# from datetime import datetime
# from .models import Employee, Attendance, LeaveRequest, Holiday # Update 'your_app'

# class Command(BaseCommand):
#     help = 'Auto-marks attendance for Holidays, Week Offs, and Absentees'

#     def handle(self, *args, **kwargs):
#         # 1. Determine the target date (Run this script at 11:55 PM for 'today')
#         today = timezone.localtime().date()
#         self.stdout.write(f"Processing attendance for: {today}")

#         # 2. Fetch all active employees
#         employees = Employee.objects.filter(status="Active")

#         for emp in employees:
#             # Check if attendance ALREADY exists (e.g., they checked in)
#             if Attendance.objects.filter(employee=emp, date=today).exists():
#                 continue

#             # --- LOGIC TO DETERMINE STATUS ---
#             status_to_create = None
            
#             # A. Check Leave
#             leave_obj = LeaveRequest.objects.filter(
#                 employee=emp,
#                 status__iexact="approved",
#                 start_date__lte=today,
#                 end_date__gte=today,
#             ).first()

#             # B. Check Holiday
#             holiday_obj = Holiday.objects.filter(date=today).first()
            
#             # C. Check Week Off (Dynamic Sat/Sun)
#             # 0=Mon, 6=Sun
#             day_index = today.weekday()
#             allowed_work_days = emp.get_work_days() # Uses the helper we moved to Model
#             is_off_day = day_index not in allowed_work_days
#             day_name = today.strftime("%A") # "Saturday", "Sunday"

#             if leave_obj:
#                 # Note: You might want to handle half-days specifically here
#                 Attendance.objects.create(
#                     employee=emp, 
#                     date=today, 
#                     status="leave",
#                     is_half_day=leave_obj.is_half_day,
#                     half_day_session=leave_obj.half_day_session
#                 )
#                 self.stdout.write(f"Marked LEAVE for {emp}")

#             elif holiday_obj:
#                 Attendance.objects.create(employee=emp, date=today, status="holiday")
#                 self.stdout.write(f"Marked HOLIDAY for {emp}")

#             elif is_off_day:
#                 # Mark as 'Sunday' or 'Saturday' or 'Week Off'
#                 Attendance.objects.create(employee=emp, date=today, status=day_name)
#                 self.stdout.write(f"Marked {day_name.upper()} for {emp}")

#             else:
#                 # D. Mark Absent
#                 # ONLY mark absent if we are sure the day is over. 
#                 # If you run this script at 11:50 PM, it is safe to mark absent.
#                 Attendance.objects.create(employee=emp, date=today, status="absent")
#                 self.stdout.write(f"Marked ABSENT for {emp}")

#         self.stdout.write(self.style.SUCCESS('Successfully processed daily attendance.'))

from django.core.management.base import BaseCommand
from django.utils import timezone
from employee.models import Employee, Attendance, LeaveRequest, Holiday, CompanyCalendarConfig


def is_configured_saturday_off(date, config=None):
    """Check if this specific Saturday is a holiday based on company config."""
    if date.weekday() != 5:  # Not a Saturday
        return False

    if config is None:
        config = CompanyCalendarConfig.objects.first()
    if not config:
        return False

    rule = config.saturday_holiday
    if rule == 'none':
        return False
    if rule == 'all':
        return True

    week_number = (date.day - 1) // 7 + 1  # Which Saturday of the month (1st, 2nd...)

    return {
        '1st':     week_number == 1,
        '2nd':     week_number == 2,
        '3rd':     week_number == 3,
        '4th':     week_number == 4,
        '1st_3rd': week_number in (1, 3),
        '2nd_4th': week_number in (2, 4),
    }.get(rule, False)


class Command(BaseCommand):
    help = 'Auto-marks attendance for Holidays, Week Offs, and Absentees'

    def handle(self, *args, **kwargs):
        today = timezone.localtime().date()
        self.stdout.write(f"Processing attendance for: {today}")

        # Load config once — used for all employees
        calendar_config = CompanyCalendarConfig.objects.first()

        employees = Employee.objects.filter(status="Active")
        counts = {"leave": 0, "holiday": 0, "off": 0, "absent": 0, "skipped": 0}

        for emp in employees:
            # Skip if attendance already exists (checked in, or already processed)
            if Attendance.objects.filter(employee=emp, date=today).exists():
                counts["skipped"] += 1
                continue

            # A. Check approved leave
            leave_obj = LeaveRequest.objects.filter(
                employee=emp,
                status__iexact="approved",
                start_date__lte=today,
                end_date__gte=today,
            ).first()

            # B. Check holiday
            holiday_obj = Holiday.objects.filter(date=today).first()

            # C. Check off day (Sunday always off, Saturday based on config)
            day_index = today.weekday()  # 0=Mon, 6=Sun
            is_sunday = day_index == 6
            is_saturday_off = is_configured_saturday_off(today, calendar_config)
            is_off_day = is_sunday or is_saturday_off
            day_name = today.strftime("%A")  # "Saturday", "Sunday"

            # --- CREATE ATTENDANCE ---
            if leave_obj:
                Attendance.objects.create(
                    employee=emp,
                    date=today,
                    status="leave",
                )
                counts["leave"] += 1
                self.stdout.write(f"  LEAVE     → {emp}")

            elif holiday_obj:
                Attendance.objects.create(
                    employee=emp,
                    date=today,
                    status="holiday",
                )
                counts["holiday"] += 1
                self.stdout.write(f"  HOLIDAY   → {emp} ({holiday_obj.name})")

            elif is_off_day:
                Attendance.objects.create(
                    employee=emp,
                    date=today,
                    status=day_name,  # "Saturday" or "Sunday"
                )
                counts["off"] += 1
                self.stdout.write(f"  {day_name.upper()} → {emp}")

            else:
                Attendance.objects.create(
                    employee=emp,
                    date=today,
                    status="absent",
                )
                counts["absent"] += 1
                self.stdout.write(f"  ABSENT    → {emp}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone for {today}: "
            f"Leave={counts['leave']}, Holiday={counts['holiday']}, "
            f"Off={counts['off']}, Absent={counts['absent']}, "
            f"Skipped(existing)={counts['skipped']}"
        ))