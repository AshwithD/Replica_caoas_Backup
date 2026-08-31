"""STEP 1/3 — schema: create ClientProfile + add nullable master_client FKs.

Replaces the payroll-local `Client` table with a OneToOne `ClientProfile`
extension of the master `clients.Client` (single source of truth for client
identity). This migration only adds the new model + nullable FK columns;
0006 backfills data and 0007 removes the old Client model/columns.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0004_client_pdf_design'),
        ('clients', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('client', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payroll_profile',
                    to='clients.client',
                )),
                ('payroll_logo', models.ImageField(blank=True, null=True, upload_to='payroll/client_logos/')),
                ('payroll_email', models.EmailField(blank=True)),
                ('pdf_design', models.PositiveSmallIntegerField(
                    choices=[(1, 'Design 1'), (2, 'Design 2'), (3, 'Design 3'), (4, 'Design 4'),
                             (5, 'Design 5'), (6, 'Design 6'), (7, 'Design 7'), (8, 'Design 8')],
                    default=1,
                )),
                ('pf_establishment_code', models.CharField(blank=True, max_length=40)),
                ('payroll_is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'payroll_client_profiles',
            },
        ),
        migrations.AddField(
            model_name='employee',
            name='master_client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payroll_employees',
                to='clients.client',
            ),
        ),
        migrations.AddField(
            model_name='payrollbatch',
            name='master_client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payroll_batches',
                to='clients.client',
            ),
        ),
    ]
