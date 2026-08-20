# clients/management/commands/update_client_contacts.py

import openpyxl
from django.core.management.base import BaseCommand
from clients.models import Client


class Command(BaseCommand):
    help = 'Update client phone and email from Excel file (Col A=Sl.No, B=Name, C=Phone, D=Email)'

    def add_arguments(self, parser):
        parser.add_argument('excel_path', type=str, help='Path to the Excel file')
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip clients that already have phone/email set',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving to DB',
        )

    def handle(self, *args, **options):
        path        = options['excel_path']
        skip_existing = options['skip_existing']
        dry_run     = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be saved.\n'))

        try:
            wb = openpyxl.load_workbook(path)
            ws = wb.active
        except Exception as e:
            self.stderr.write(f'Failed to open Excel: {e}')
            return

        updated, skipped, not_found, no_data = 0, 0, 0, 0

        for row in ws.iter_rows(min_row=2):  # row 1 is header
            # Col A=0, B=1, C=2, D=3
            raw_name  = row[1].value
            raw_phone = row[12].value
            raw_email = row[13].value

            if not raw_name:
                continue

            client_name = str(raw_name).strip().upper()
            phone = str(raw_phone).strip() if raw_phone else ''
            email = str(raw_email).strip() if raw_email else ''

            # Nothing to update for this row
            if not phone and not email:
                no_data += 1
                self.stdout.write(f'  NO DATA  : {client_name}')
                continue

            try:
                client = Client.objects.get(name=client_name)
            except Client.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  NOT FOUND: {client_name}'))
                not_found += 1
                continue

            # Skip if already has data and --skip-existing flag set
            if skip_existing and (client.phone or client.email):
                self.stdout.write(f'  SKIP (has data): {client_name}')
                skipped += 1
                continue

            changes = []
            if phone and client.phone != phone:
                changes.append(f'phone: {client.phone or "—"} → {phone}')
                if not dry_run:
                    client.phone = phone
            if email and client.email != email:
                changes.append(f'email: {client.email or "—"} → {email}')
                if not dry_run:
                    client.email = email

            if not changes:
                self.stdout.write(f'  NO CHANGE: {client_name} (same values)')
                skipped += 1
                continue

            if not dry_run:
                client.save(update_fields=['phone', 'email'])

            label = 'DRY RUN' if dry_run else 'UPDATED'
            self.stdout.write(self.style.SUCCESS(
                f'  {label}: {client_name} — {", ".join(changes)}'
            ))
            updated += 1

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(f'  Updated  : {updated}')
        self.stdout.write(f'  Skipped  : {skipped}')
        self.stdout.write(f'  Not Found: {not_found}')
        self.stdout.write(f'  No Data  : {no_data}')
        if dry_run:
            self.stdout.write(self.style.WARNING('  (Dry run — nothing saved)'))