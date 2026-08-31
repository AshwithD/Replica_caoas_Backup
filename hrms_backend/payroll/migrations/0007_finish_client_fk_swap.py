"""STEP 3/3 — schema: drop the old payroll.Client FKs and model.

Runs after 0006 has backfilled master_client on every Employee/PayrollBatch
and created the ClientProfile rows. Order matters:
  1. Drop the unique_together constraints that reference the old `client`.
  2. Remove the old `client` FK columns.
  3. Rename master_client -> client (so model code keeps using `.client`).
  4. Re-apply the same unique_together constraints on the new field.
  5. Delete the old payroll.Client model (drops the payroll_clients table).
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0006_backfill_client_profiles'),
    ]

    operations = [
        # 1) drop old constraints
        migrations.AlterUniqueTogether(
            name='employee',
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name='payrollbatch',
            unique_together=set(),
        ),

        # 2) remove old FK columns
        migrations.RemoveField(
            model_name='employee',
            name='client',
        ),
        migrations.RemoveField(
            model_name='payrollbatch',
            name='client',
        ),

        # 3) rename the backfilled columns to `client`
        migrations.RenameField(
            model_name='employee',
            old_name='master_client',
            new_name='client',
        ),
        migrations.RenameField(
            model_name='payrollbatch',
            old_name='master_client',
            new_name='client',
        ),

        # 3b) the backfilled columns were nullable during the swap; the model
        #     defines them as required — drop null/blank now that 0006 filled
        #     every row.
        migrations.AlterField(
            model_name='employee',
            name='client',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payroll_employees',
                to='clients.client',
            ),
        ),
        migrations.AlterField(
            model_name='payrollbatch',
            name='client',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payroll_batches',
                to='clients.client',
            ),
        ),

        # 4) restore the constraints on the new field
        migrations.AlterUniqueTogether(
            name='employee',
            unique_together={('client', 'employee_code')},
        ),
        migrations.AlterUniqueTogether(
            name='payrollbatch',
            unique_together={('client', 'month', 'year')},
        ),

        # 5) drop the payroll.Client model entirely
        migrations.DeleteModel(
            name='Client',
        ),
    ]
