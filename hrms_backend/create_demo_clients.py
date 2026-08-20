import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
django.setup()

from clients.models import (
    Client, ClientGroup, SPOC, Constitution, GroupCategory,
    MainService, SubService, ClientSPOC, ClientGroupService,
)
from employee.models import Team

# ── Constitutions ─────────────────────────────────────────────────────────────
constitutions = ['Private Limited', 'LLP', 'Partnership', 'Proprietorship', 'Trust', 'Society']
for c in constitutions:
    Constitution.objects.get_or_create(name=c)
print("Constitutions created")

# ── Group Categories ──────────────────────────────────────────────────────────
categories = ['Corporate', 'SME', 'Individual', 'Government']
for c in categories:
    GroupCategory.objects.get_or_create(name=c)
print("Group Categories created")

# ── SPOCs ─────────────────────────────────────────────────────────────────────
spocs_data = [
    {'name': 'Rahul Verma',  'email': 'manager@test.com',  'phone': '9876543210'},
    {'name': 'Anjali Patel', 'email': 'teamlead@test.com', 'phone': '9876543211'},
    {'name': 'Priya Sharma', 'email': 'hr@test.com',       'phone': '9876543212'},
]
spocs = []
for s in spocs_data:
    spoc, _ = SPOC.objects.get_or_create(email=s['email'], defaults=s)
    spocs.append(spoc)
print("SPOCs created")

# ── Teams ─────────────────────────────────────────────────────────────────────
team_audit, _   = Team.objects.get_or_create(name='Audit',    defaults={'description': 'Audit Team'})
team_tax, _     = Team.objects.get_or_create(name='Tax',      defaults={'description': 'Tax Team'})
team_account, _ = Team.objects.get_or_create(name='Accounts', defaults={'description': 'Accounts Team'})
print("Teams verified")

# ── Main Services ─────────────────────────────────────────────────────────────
main_services_data = [
    {'name': 'Statutory Audit',  'team': team_audit},
    {'name': 'Tax Audit',        'team': team_audit},
    {'name': 'GST Compliance',   'team': team_tax},
    {'name': 'Income Tax Filing','team': team_tax},
    {'name': 'Bookkeeping',      'team': team_account},
    {'name': 'TDS Returns',      'team': team_tax},
]
main_services = []
for ms in main_services_data:
    obj, _ = MainService.objects.get_or_create(
        name=ms['name'], team=ms['team'],
        defaults={'is_active': True}
    )
    main_services.append(obj)
print("Main Services created")

# ── Sub Services ──────────────────────────────────────────────────────────────
sub_services_data = [
    {'name': 'Balance Sheet Audit',         'main': main_services[0], 'period': 'Annually'},
    {'name': 'P&L Audit',                   'main': main_services[0], 'period': 'Annually'},
    {'name': 'Tax Audit Report',            'main': main_services[1], 'period': 'Annually'},
    {'name': 'GSTR-1 Filing',              'main': main_services[2], 'period': 'Monthly'},
    {'name': 'GSTR-3B Filing',             'main': main_services[2], 'period': 'Monthly'},
    {'name': 'GST Annual Return (GSTR-9)', 'main': main_services[2], 'period': 'Annually'},
    {'name': 'ITR Filing',                 'main': main_services[3], 'period': 'Annually'},
    {'name': 'Advance Tax Computation',    'main': main_services[3], 'period': 'Quarterly'},
    {'name': 'Monthly Bookkeeping',        'main': main_services[4], 'period': 'Monthly'},
    {'name': 'TDS Return - Q1',            'main': main_services[5], 'period': 'Quarterly'},
    {'name': 'TDS Return - Q2',            'main': main_services[5], 'period': 'Quarterly'},
]
for ss in sub_services_data:
    SubService.objects.get_or_create(
        name=ss['name'], main_service=ss['main'],
        defaults={'period': ss['period'], 'is_active': True}
    )
print("Sub Services created")

# ── Clients ───────────────────────────────────────────────────────────────────
pvt_ltd = Constitution.objects.get(name='Private Limited')
llp     = Constitution.objects.get(name='LLP')
prop    = Constitution.objects.get(name='Proprietorship')

clients_data = [
    {'name': 'ABC TECHNOLOGIES PVT LTD', 'email': 'info@abctech.com',      'phone': '9900112233', 'constitution': pvt_ltd, 'pan': 'AABCA1234A', 'gstin': '29AABCA1234A1ZA', 'nature_of_business': 'IT Services'},
    {'name': 'XYZ TRADERS LLP',          'email': 'contact@xyztraders.com', 'phone': '9900223344', 'constitution': llp,     'pan': 'AADCX5678B', 'gstin': '29AADCX5678B1ZB', 'nature_of_business': 'Trading'},
    {'name': 'KUMAR ENTERPRISES',        'email': 'kumar@enterprise.com',   'phone': '9900334455', 'constitution': prop,    'pan': 'BQPPK1234C', 'nature_of_business': 'Manufacturing'},
    {'name': 'GLOBAL SOLUTIONS PVT LTD', 'email': 'info@globalsol.com',     'phone': '9900445566', 'constitution': pvt_ltd, 'pan': 'AAECG9876D', 'gstin': '29AAECG9876D1ZC', 'nature_of_business': 'Consulting'},
    {'name': 'SHARMA AND ASSOCIATES',    'email': 'ca@sharmaassoc.com',     'phone': '9900556677', 'constitution': prop,    'pan': 'ABCPS5432E', 'nature_of_business': 'Professional Services'},
]
clients = []
for c in clients_data:
    client, _ = Client.objects.get_or_create(
        name=c['name'],
        defaults=c
    )
    clients.append(client)
print("Clients created")

# ── Client-SPOC Mapping ──────────────────────────────────────────────────────
for i, client in enumerate(clients):
    spoc = spocs[i % len(spocs)]
    ClientSPOC.objects.get_or_create(
        client=client, spoc=spoc,
        defaults={'is_primary': True}
    )
print("Client-SPOC mappings created")

# ── Client Groups ─────────────────────────────────────────────────────────────
corp_cat = GroupCategory.objects.get(name='Corporate')
sme_cat  = GroupCategory.objects.get(name='SME')

group1, _ = ClientGroup.objects.get_or_create(
    group_name='TECH GROUP',
    defaults={
        'group_category': corp_cat,
        'primary_spoc': spocs[0],
        'secondary_spoc': spocs[1],
    }
)
group1.clients.add(clients[0], clients[3])

group2, _ = ClientGroup.objects.get_or_create(
    group_name='TRADERS GROUP',
    defaults={
        'group_category': sme_cat,
        'primary_spoc': spocs[1],
        'secondary_spoc': spocs[2],
    }
)
group2.clients.add(clients[1], clients[2], clients[4])
print("Client Groups created")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("DEMO DATA CREATED SUCCESSFULLY!")
print("=" * 50)
print(f"Constitutions:    {Constitution.objects.count()}")
print(f"Group Categories: {GroupCategory.objects.count()}")
print(f"SPOCs:            {SPOC.objects.count()}")
print(f"Main Services:    {MainService.objects.count()}")
print(f"Sub Services:     {SubService.objects.count()}")
print(f"Clients:          {Client.objects.count()}")
print(f"Client Groups:    {ClientGroup.objects.count()}")
print(f"Teams:            {Team.objects.count()}")