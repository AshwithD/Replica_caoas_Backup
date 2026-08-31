"""Add EmployeeSalaryStructure.employer_pf and backfill existing rows.

employer_pf = the employer's PF share (12% of Basic, capped at Rs 1,800)
that build_from_ctc reserves out of CTC when pf_opted is True. It is
informational on the payslip — never part of net pay.

Backfill derives the value from each existing structure's own
original_basic_da + pf_opted, so historical payslips render the correct
figure without re-entering anything.
"""

from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations, models

Q = Decimal("0.01")
PF_WAGE_CEILING = Decimal("15000")
PF_FLAT_RESERVE = Decimal("1800")
EPF_RATE = Decimal("0.12")


def derive(basic_da, pf_opted):
    if not pf_opted:
        return Decimal("0")
    basic = Decimal(basic_da or 0)
    return min(basic * EPF_RATE, PF_FLAT_RESERVE).quantize(Q, rounding=ROUND_HALF_UP)


def forwards(apps, schema_editor):
    Structure = apps.get_model("payroll", "EmployeeSalaryStructure")
    for s in Structure.objects.all().iterator():
        s.employer_pf = derive(s.original_basic_da, s.pf_opted)
        s.save(update_fields=["employer_pf"])


def backwards(apps, schema_editor):
    pass  # field is dropped by the AddField reverse


class Migration(migrations.Migration):

    dependencies = [
        ("payroll", "0007_finish_client_fk_swap"),
    ]

    operations = [
        migrations.AddField(
            model_name="employeesalarystructure",
            name="employer_pf",
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=12,
                help_text="Employer's PF contribution (12% of Basic, capped at Rs 1,800). "
                          "Computed automatically when the structure is built from CTC "
                          "(build_from_ctc) — informational on the payslip, never part of net pay.",
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
