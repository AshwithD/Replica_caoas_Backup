# clients/management/commands/add_sft_service.py

import openpyxl
from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date
from clients.models import Client, ClientGroupService, SubService, MainService


class Command(BaseCommand):
    help = 'Add SFT subservice to clients from Excel file'

    def add_arguments(self, parser):
        parser.add_argument('excel_path', type=str, help='Path to the Excel file')

    def handle(self, *args, **options):
        path = options['excel_path']

        try:
            wb = openpyxl.load_workbook(path)
            ws = wb.active
        except Exception as e:
            self.stderr.write(f'Failed to open Excel: {e}')
            return

        sub_service = SubService.objects.get(id=265)
        main_service = MainService.objects.get(id=12)
        due_date = date(2026, 5, 31)

        success, skipped, not_found, no_group = 0, 0, 0, 0

        for row in ws.iter_rows(min_row=2):  # row 2 onwards
            raw_name = row[2].value          # col C (0-indexed: B=1, C=2)
            if not raw_name:
                continue

            client_name = str(raw_name).strip().upper()

            try:
                client = Client.objects.get(name=client_name)
            except Client.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  NOT FOUND: {client_name}'))
                not_found += 1
                continue

            # Get client's group
            group = client.client_groups_membership.filter(is_active=True).first()
            if not group:
                self.stdout.write(self.style.WARNING(f'  NO GROUP: {client_name}'))
                no_group += 1
                continue

            # Skip if already assigned
            already_exists = ClientGroupService.objects.filter(
                client=client,
                sub_service=sub_service,
            ).exists()

            if already_exists:
                self.stdout.write(f'  SKIP (already exists): {client_name}')
                skipped += 1
                continue

            try:
                with transaction.atomic():
                    ClientGroupService.objects.create(
                        client=client,
                        client_group=group,
                        main_service=main_service,
                        sub_service=sub_service,
                        period="Annually",
                        due_date=due_date,
                        fee=None,
                        is_active=True,
                    )
                self.stdout.write(self.style.SUCCESS(f'  CREATED: {client_name}'))
                success += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ERROR ({client_name}): {e}'))

        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'  Created  : {success}')
        self.stdout.write(f'  Skipped  : {skipped}')
        self.stdout.write(f'  Not Found: {not_found}')
        self.stdout.write(f'  No Group : {no_group}')