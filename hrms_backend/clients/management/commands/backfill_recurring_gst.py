"""
Management command to backfill cgst / sgst / igst on invoices that were
generated from recurring invoices before the gst_rate fix was applied.

Usage:
    # Dry-run — shows what would change, writes nothing
    python manage.py backfill_recurring_gst

    # Live run — updates the database
    python manage.py backfill_recurring_gst --apply

    # Target a specific invoice status (default: all non-zero-tax statuses)
    python manage.py backfill_recurring_gst --apply --status "System Generated"
    python manage.py backfill_recurring_gst --apply --status "Draft"
    python manage.py backfill_recurring_gst --apply --status "Outstanding"
"""

from decimal import Decimal, ROUND_HALF_UP
from django.core.management.base import BaseCommand
from django.db import transaction


TWO_PLACES = Decimal("0.01")


def compute_gst(sub_total, gst_type, rate):
    """
    Pure function — mirrors the frontend computeGst().
    Returns (cgst, sgst, igst, total_amount) as Decimals.
    """
    base = Decimal(str(sub_total or 0))
    r    = Decimal(str(rate or 0))

    if r == 0 or gst_type in ("SEZ", "No GST", "no_gst"):
        return Decimal("0.00"), Decimal("0.00"), Decimal("0.00"), base

    tax = (base * r / Decimal("100")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

    if gst_type == "Interstate":
        igst = tax
        return Decimal("0.00"), Decimal("0.00"), igst, (base + igst).quantize(TWO_PLACES)

    # Local (and any other type) → split into CGST + SGST
    cgst = (tax / Decimal("2")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    sgst = tax - cgst          # remaining penny goes to sgst
    return cgst, sgst, Decimal("0.00"), (base + cgst + sgst).quantize(TWO_PLACES)


class Command(BaseCommand):
    help = "Backfill cgst/sgst/igst on invoices generated from recurring invoices."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            default=False,
            help="Actually write changes to the database (default is dry-run).",
        )
        parser.add_argument(
            "--status",
            type=str,
            default=None,
            help=(
                "Only process invoices with this status. "
                "Omit to process ALL statuses."
            ),
        )

    def handle(self, *args, **options):
        # Import here so Django app registry is ready
        from clients.models import Invoice  # adjust app label if needed

        apply    = options["apply"]
        status   = options.get("status")

        self.stdout.write(
            self.style.WARNING(
                "DRY RUN — pass --apply to commit changes."
                if not apply else
                "LIVE RUN — changes will be written to the database."
            )
        )

        # ── Build queryset ────────────────────────────────────────────────
        qs = Invoice.objects.prefetch_related("items").all()
        if status:
            qs = qs.filter(status=status)
            self.stdout.write(f"Filtering to status='{status}'")
        else:
            self.stdout.write("Processing ALL invoice statuses.")

        total      = qs.count()
        updated    = 0
        skipped    = 0
        no_rate    = 0
        errors     = 0

        self.stdout.write(f"Found {total} invoice(s) to inspect.\n")

        for invoice in qs.iterator(chunk_size=100):
            try:
                # ── Skip invoices that already have correct taxes ─────────
                existing_tax = invoice.cgst + invoice.sgst + invoice.igst
                if existing_tax > Decimal("0.00"):
                    skipped += 1
                    continue

                gst_type = invoice.gst_type or "Local"

                # ── Determine gst_rate ────────────────────────────────────
                # Priority 1: applicable_tax_rate already on the invoice
                # Priority 2: gst_rate on the first invoice item
                #             (set by the new frontend after the fix)
                # Priority 3: derive from gst_type (18% for Local/Interstate)
                rate = None

                if invoice.applicable_tax_rate:
                    rate = Decimal(str(invoice.applicable_tax_rate))

                if rate is None:
                    # Try to read gst_rate from items
                    for item in invoice.items.all():
                        item_rate = getattr(item, "gst_rate", None)
                        if item_rate is not None:
                            rate = Decimal(str(item_rate))
                            break

                if rate is None:
                    # Fall back to default by gst_type
                    defaults = {
                        "Local":       Decimal("18"),
                        "Interstate":  Decimal("18"),
                        "SEZ":         Decimal("0"),
                        "No GST":      Decimal("0"),
                        "no_gst":      Decimal("0"),
                    }
                    rate = defaults.get(gst_type)

                if rate is None:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [SKIP] Invoice id={invoice.id} "
                            f"invoice_no={invoice.invoice_no} — "
                            f"cannot determine GST rate (gst_type='{gst_type}')"
                        )
                    )
                    no_rate += 1
                    continue

                # ── Compute sub_total from items if not stored ────────────
                sub_total = invoice.sub_total
                if not sub_total or sub_total == Decimal("0.00"):
                    sub_total = sum(
                        (item.amount or Decimal("0.00"))
                        for item in invoice.items.all()
                    )

                if sub_total == Decimal("0.00"):
                    skipped += 1
                    continue

                # ── Calculate new tax values ──────────────────────────────
                new_cgst, new_sgst, new_igst, new_total = compute_gst(
                    sub_total, gst_type, rate
                )

                self.stdout.write(
                    f"  {'[WOULD UPDATE]' if not apply else '[UPDATING]'} "
                    f"id={invoice.id} | no={invoice.invoice_no or 'DRAFT'} | "
                    f"type={gst_type} | rate={rate}% | "
                    f"sub={sub_total} → "
                    f"cgst={new_cgst} sgst={new_sgst} igst={new_igst} "
                    f"total={new_total}"
                )

                if apply:
                    with transaction.atomic():
                        invoice.sub_total = sub_total
                        invoice.cgst      = new_cgst
                        invoice.sgst      = new_sgst
                        invoice.igst      = new_igst
                        invoice.amount    = new_total
                        # Recalculate balance
                        paid = (invoice.partial_payment_amount or Decimal("0.00")) + \
                               (invoice.final_payment_amount   or Decimal("0.00"))
                        invoice.balance_amount = new_total - paid
                        invoice.save()

                updated += 1

            except Exception as exc:
                errors += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"  [ERROR] Invoice id={invoice.id}: {exc}"
                    )
                )

        # ── Summary ───────────────────────────────────────────────────────
        self.stdout.write("\n" + "─" * 60)
        self.stdout.write(f"Total inspected : {total}")
        self.stdout.write(
            self.style.SUCCESS(f"Updated         : {updated}")
            if updated else f"Updated         : {updated}"
        )
        self.stdout.write(f"Skipped (ok)    : {skipped}")
        self.stdout.write(
            self.style.WARNING(f"No rate found   : {no_rate}")
            if no_rate else f"No rate found   : {no_rate}"
        )
        self.stdout.write(
            self.style.ERROR(f"Errors          : {errors}")
            if errors else f"Errors          : {errors}"
        )

        if not apply and updated > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"\nThis was a dry run. Run with --apply to commit {updated} change(s)."
                )
            )