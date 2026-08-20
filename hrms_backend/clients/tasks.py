from django.utils.timezone import now
from .models import RecurringInvoice, Invoice, InvoiceItem
from dateutil.relativedelta import relativedelta

def generate_recurring_invoices():
    today = now().date()
    recurring_qs = RecurringInvoice.objects.filter(is_active=True, next_invoice_date__lte=today)

    for rec in recurring_qs:
        # Create draft invoice
        invoice = Invoice.objects.create(
            client=rec.client,
            client_name=rec.client_name,
            client_address=rec.client_address,
            client_gstin=rec.client_gstin,
            gst_type=rec.gst_type,
            date=today,
            status="Draft",
            amount=rec.amount,
            category="Invoice",
            document_type="tax_invoice",
            created_by=rec.created_by
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            sac_code=rec.sac_code,
            particulars=rec.particulars,
            amount=rec.amount
        )

        # Update next invoice date
        if rec.frequency == "monthly":
            rec.next_invoice_date = today.replace(day=1) + relativedelta(months=1)
        elif rec.frequency == "quarterly":
            rec.next_invoice_date = today.replace(day=1) + relativedelta(months=3)
        elif rec.frequency == "yearly":
            rec.next_invoice_date = today.replace(day=1) + relativedelta(years=1)

        rec.save()
