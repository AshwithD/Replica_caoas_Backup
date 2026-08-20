from decimal import Decimal
import calendar
from employee.models import Attendance, Holiday
import datetime

def calculate_payroll(employee, start_date, end_date):
    # Use CTC instead of salary
    ctc_per_month = employee.ctc / Decimal('12.00')  # Monthly CTC

    gross_salary = ctc_per_month

    num_days_in_month = calendar.monthrange(start_date.year, start_date.month)[1]

    # festival_holidays = [
    # datetime.date(2025, 8, 15),  # Example: Independence Day
    # datetime.date(2025, 5, 15),
    # ]


    holidays = set(Holiday.objects.filter(date__range=(start_date, end_date)).values_list('date', flat=True))
    for day in range(1, num_days_in_month + 1):
        date_obj = start_date.replace(day=day)
        if date_obj.weekday() == 6:  # Sunday
            holidays.add(date_obj)

    total_working_days_in_month = num_days_in_month - len(holidays)

    present_days_count = Attendance.objects.filter(
        employee=employee,
        date__range=(start_date, end_date),
        status='present'
    ).count()

    on_leave_days_count = Attendance.objects.filter(
        employee=employee,
        date__range=(start_date, end_date),
        status='on_leave'
    ).count()

    actual_working_days = present_days_count + on_leave_days_count
    lop_days = Decimal(total_working_days_in_month - actual_working_days)
    if lop_days < 0:
        lop_days = Decimal('0.00')

    # Salary breakdown (60-20-10 split)
    basic_da_full = ctc_per_month * Decimal('0.60')
    hra_full = ctc_per_month * Decimal('0.20')
    special_allowance_full = ctc_per_month * Decimal('0.10')
    transport_reimbursement = Decimal('1510.00')

    if total_working_days_in_month > 0:
        actual_basic_da = (basic_da_full / total_working_days_in_month) * actual_working_days
        actual_hra = (hra_full / total_working_days_in_month) * actual_working_days
        actual_special_allowance = (special_allowance_full / total_working_days_in_month) * actual_working_days
    else:
        actual_basic_da = actual_hra = actual_special_allowance = Decimal('0.00')

    arrears_bonus_incentives = Decimal('500.00')

    actual_earned_salary = (
        actual_basic_da + actual_hra + transport_reimbursement +
        actual_special_allowance + arrears_bonus_incentives
    )

    # O column logic: half_or_cap = ROUND(IF(N*0.5>25000, N*0.5, MIN(25000, N)))
    # N = gross_salary
    # if (N * Decimal('0.5')) > Decimal('25000'):
    #     half_or_cap = round(N * Decimal('0.5'))
    # else:
    #     half_or_cap = round(min(Decimal('25000'), N))
    
    # basic_da_full = 0.5 * gross_salary

    # Fixed deduction amounts (placeholders for now)
    tds = Decimal('0.00')
    epf = Decimal('1800.00')
    pt = Decimal('200.00')
    esi = Decimal('0.00')
    e_nps = Decimal('0.00')
    advance_salary_hold = Decimal('0.00')

    total_deductions = tds + epf + pt + e_nps + advance_salary_hold
    net_salary = gross_salary - total_deductions

    payroll_data = {
        'gross_salary': gross_salary,
        'deductions': total_deductions,
        'net_salary': net_salary,
        'basic_da': basic_da_full,
        'actual_basic_da': actual_basic_da,
        'hra': hra_full,
        'actual_hra': actual_hra,
        'special_allowance': special_allowance_full,
        'actual_special_allowance': actual_special_allowance,
        'transport_reimbursement': transport_reimbursement,
        'arrears_bonus_incentives': arrears_bonus_incentives,
        'actual_earned_salary': actual_earned_salary,
        'tds': tds,
        'epf': epf,
        'pt': pt,
        'esi': esi,
        'e_nps': e_nps,
        'advance_salary_hold': advance_salary_hold,
        'no_of_days_in_month': num_days_in_month,
        'working_days_in_month': total_working_days_in_month,
        'actual_working_days': actual_working_days,
        'lop_days': lop_days,
        'monthly_gross': ctc_per_month,
        'half_or_cap': half_or_cap,  # Added column O logic
    }

    return payroll_data


# utils.py
from django.core.mail import send_mail
from django.conf import settings
import uuid

def send_upload_emails():
    recipients = Recipient.objects.all()
    for recipient in recipients:
        if not recipient.token:
            recipient.token = uuid.uuid4().hex
            recipient.save()

        link = f"https://yourfrontend.com/upload/{recipient.token}/"
        send_mail(
            "Upload your documents",
            f"Please upload your files using this link: {link}",
            settings.DEFAULT_FROM_EMAIL,
            [recipient.email]
        )


# utils/calendar_utils.py
def is_configured_saturday_off(date, config=None):
    """
    Returns True if the given Saturday is a holiday based on company config.
    """
    from employee.models import CompanyCalendarConfig
    import calendar

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

    # Find which Saturday of the month this is (1st, 2nd, etc.)
    day = date.day
    week_number = (day - 1) // 7 + 1  # 1-indexed

    return {
        '1st': week_number == 1,
        '2nd': week_number == 2,
        '3rd': week_number == 3,
        '4th': week_number == 4,
        '1st_3rd': week_number in (1, 3),
        '2nd_4th': week_number in (2, 4),
    }.get(rule, False)