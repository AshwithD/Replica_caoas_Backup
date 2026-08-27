# # tasks.py

# from celery import shared_task
# from datetime import datetime, timedelta
# from django.utils.timezone import make_aware
# from employee.models import Employee, Payroll
# from employee.utils import calculate_payroll # Ensure correct import path for calculate_payroll
# from django.core.mail import send_mail
# from django.conf import settings


# @shared_task
# def generate_monthly_payroll(year, month):
#     # Correctly define start_date and end_date as dates for payroll period
#     start_date = make_aware(datetime(year, month, 1)).date()
#     if month == 12:
#         end_date = make_aware(datetime(year + 1, 1, 1)).date() - timedelta(days=1)
#     else:
#         end_date = make_aware(datetime(year, month + 1, 1)).date() - timedelta(days=1)

#     employees = Employee.objects.all()
#     payroll_records = []

#     for emp in employees:
#         try:
#             # Call the updated calculate_payroll function
#             payroll_data = calculate_payroll(emp, start_date, end_date)
            
#             # Use start_date.month and start_date.year for Payroll object
#             payroll, created = Payroll.objects.update_or_create(
#                 employee=emp,
#                 month=start_date.month, # Use integer month
#                 year=start_date.year,   # Use integer year
#                 defaults=payroll_data # This now contains all granular fields
#             )
            
#             # Send email (existing logic)
#             from_email = settings.DEFAULT_FROM_EMAIL
#             subject = f"Payslip Generated for {start_date.strftime('%B %Y')}"
#             message = (
#                 f"Hello {emp.user.get_full_name()},\n\n"
#                 f"Your payslip for {start_date.strftime('%B %Y')} has been generated.\n"
#                 f"Net Salary: ₹{payroll.net_salary}\n\n"
#                 "Please log in to your portal to download the payslip.\n\n"
#                 "Thank you,\nYour HR Team"
#             )
#             # Ensure emp.user has an email before sending
#             if emp.user.email:
#                 send_mail(
#                     subject,
#                     message,
#                     from_email,
#                     [emp.user.email],
#                     fail_silently=False,
#                 )
            
#             payroll_records.append({
#                 'employee': emp.full_name,
#                 'net_salary': payroll.net_salary,
#                 'status': 'Generated' if created else 'Updated'
#             })
#             print(f"Successfully generated payroll for {emp.full_name} for {start_date.strftime('%B %Y')}")

#         except Exception as e:
#             print(f"Error generating payroll for {emp.full_name}: {e}")
#             payroll_records.append({
#                 'employee': emp.full_name,
#                 'net_salary': 'N/A',
#                 'status': f'Failed: {str(e)}'
#             })
#             continue
    
#     return {"detail": "Payroll generation process complete.", "results": payroll_records}


# from celery import shared_task
# from django.utils import timezone
# from employee.models import Employee, Attendance, LeaveRequest, Holiday, CompanyCalendarConfig
# import logging

# logger = logging.getLogger(__name__)


# def is_configured_saturday_off(date, config=None):
#     if date.weekday() != 5:
#         return False
#     if config is None:
#         config = CompanyCalendarConfig.objects.first()
#     if not config:
#         return False

#     rule = config.saturday_holiday
#     if rule == 'none':
#         return False
#     if rule == 'all':
#         return True

#     week_number = (date.day - 1) // 7 + 1

#     return {
#         '1st':     week_number == 1,
#         '2nd':     week_number == 2,
#         '3rd':     week_number == 3,
#         '4th':     week_number == 4,
#         '1st_3rd': week_number in (1, 3),
#         '2nd_4th': week_number in (2, 4),
#     }.get(rule, False)


# @shared_task(bind=True, max_retries=3)
# def mark_daily_attendance(self):
#     try:
#         today = timezone.localtime().date()
#         logger.info(f"[mark_daily_attendance] Processing for {today}")

#         calendar_config = CompanyCalendarConfig.objects.first()
#         employees = Employee.objects.filter(status="Active")
#         counts = {"leave": 0, "holiday": 0, "off": 0, "absent": 0, "skipped": 0}

#         for emp in employees:
#             if Attendance.objects.filter(employee=emp, date=today).exists():
#                 counts["skipped"] += 1
#                 continue

#             leave_obj = LeaveRequest.objects.filter(
#                 employee=emp,
#                 status__iexact="approved",
#                 start_date__lte=today,
#                 end_date__gte=today,
#             ).first()

#             holiday_obj = Holiday.objects.filter(date=today).first()

#             day_index = today.weekday()
#             is_sunday = day_index == 6
#             is_saturday_off = is_configured_saturday_off(today, calendar_config)
#             is_off_day = is_sunday or is_saturday_off
#             day_name = today.strftime("%A")

#             if leave_obj:
#                 Attendance.objects.create(employee=emp, date=today, status="leave")
#                 counts["leave"] += 1

#             elif holiday_obj:
#                 Attendance.objects.create(employee=emp, date=today, status="holiday")
#                 counts["holiday"] += 1

#             elif is_off_day:
#                 Attendance.objects.create(employee=emp, date=today, status=day_name)
#                 counts["off"] += 1

#             else:
#                 Attendance.objects.create(employee=emp, date=today, status="absent")
#                 counts["absent"] += 1

#         logger.info(
#             f"[mark_daily_attendance] Done for {today}: "
#             f"Leave={counts['leave']}, Holiday={counts['holiday']}, "
#             f"Off={counts['off']}, Absent={counts['absent']}, "
#             f"Skipped={counts['skipped']}"
#         )
#         return counts

#     except Exception as exc:
#         logger.error(f"[mark_daily_attendance] Failed: {exc}")
#         raise self.retry(exc=exc, countdown=60)  # Retry after 60 seconds