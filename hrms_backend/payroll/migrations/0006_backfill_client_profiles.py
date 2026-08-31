"""STEP 2/3 — data: map old payroll.Client rows onto clients.Client + ClientProfile.

For each row in the old `payroll_clients` table:
  1. Resolve the master client by name (case-insensitive — the Client module
     stores names uppercased via Client.save()).
  2. Create the master client if none matches (name uppercased to mirror
     clients.Client.save()).
  3. Create the ClientProfile carrying over logo / pdf_design /
     pf_establishment_code / is_active. The old payroll email becomes a
     payroll_email OVERRIDE only when it differs from the master email.
  4. Repoint every Employee / PayrollBatch from the old client to the master.

Reverse is a no-op on purpose (the 0007 schema migration drops the old
columns regardless); roll back by restoring a DB backup instead.
"""

from django.db import migrations


def forwards(apps, schema_editor):
    PayrollClient = apps.get_model('payroll', 'Client')
    MasterClient = apps.get_model('clients', 'Client')
    ClientProfile = apps.get_model('payroll', 'ClientProfile')
    Employee = apps.get_model('payroll', 'Employee')
    PayrollBatch = apps.get_model('payroll', 'PayrollBatch')

    for old in PayrollClient.objects.all().iterator():
        name = (old.name or '').strip()
        if not name:
            # Blank-name rows can't be matched to a master; give them a
            # placeholder so their employees/batches are never orphaned
            # (0007 makes the FK NOT NULL).
            name = f'UNNAMED PAYROLL CLIENT #{old.pk}'
            master = None
        else:
            # 1) resolve master client (case-insensitive — master names are UPPER)
            master = MasterClient.objects.filter(name__iexact=name).first()
        if master is None:
            master = MasterClient.objects.create(
                name=name.upper(),
                email=(old.email or None),
                phone=(old.phone or '')[:30],
                address=old.address or '',
                pan=(old.pan or '')[:10],
                tan=(old.tan or '')[:10],
                gstin=(old.gstin or '')[:15],
            )

        # 2) profile — one per master (duplicate old names collapse to one)
        profile, created = ClientProfile.objects.get_or_create(
            client=master,
            defaults={
                'payroll_logo': (old.logo.name if old.logo else ''),
                'payroll_email': '',
                'pdf_design': old.pdf_design or 1,
                'pf_establishment_code': old.pf_establishment_code or '',
                'payroll_is_active': bool(old.is_active),
            },
        )

        # 3) keep the old payroll email as an override when it differs
        #    from the master's email (otherwise fallback covers it)
        if created and old.email and (master.email or '').strip().lower() != old.email.strip().lower():
            profile.payroll_email = old.email
            profile.save(update_fields=['payroll_email'])

        # 4) repoint children to the master (even if profile pre-existed)
        Employee.objects.filter(client=old).update(master_client=master)
        PayrollBatch.objects.filter(client=old).update(master_client=master)


def backwards(apps, schema_editor):
    # Deliberate no-op: the 0007 migration drops the old columns/table.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0005_client_profile_and_master_fks'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
