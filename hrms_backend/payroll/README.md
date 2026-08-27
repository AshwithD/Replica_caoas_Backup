# Payroll Module

Self-contained Django app + React pages adding payroll to CAOAS. Backend
lives entirely in `hrms_backend/payroll/`; frontend lives entirely in
`frontend/src/pages/payroll/`. No existing file outside these two folders
was modified except the minimal wiring listed below (which Django/React
require to even discover a new app/route — there's no way around it).

## What's in here

- **Batches**: upload an Excel sheet of monthly attendance/leave data →
  auto-computed payslips (LOP, comp-off, salary advances, on-hold amounts,
  PF/EPF, etc. — see `calculations.py`).
- **Payslip PDFs & bulk email** (`pdf_generator.py`, `email_service.py`,
  `tasks.py`).
- **Firm profile** (`Company` model) — name, logo, PAN/TAN/GSTIN, used on
  payslips/letterheads. Single row, payroll-only (see "Company model" below).
- **Salary structures** (`EmployeeSalaryStructure`) — versioned, FK'd to
  `employee.Employee`, with a CTC → Basic/HRA/Special Allowance/PF-reserve
  auto-calculator matching the firm's confirmed formula.
- **Ledger adjustments** — comp-off / leave balance corrections.
- **Employees screen** — every employee at the firm with their current
  salary structure, and a detail page per employee.

## One-time setup

```bash
pip install -r hrms_backend/payroll/requirements.txt   # + your existing requirements.txt
cd frontend && npm install                              # picks up react-hook-form (new dep)
```

### Backend wiring (2 lines, unavoidable — Django won't find an unregistered app)

`hrms_backend/hrms_backend/settings.py`, `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    ...
    'clients',
    'payroll',
]
```

`hrms_backend/hrms_backend/urls.py`:
```python
path('api/payroll/', include('payroll.urls')),
```

```bash
python manage.py migrate payroll
```

### Frontend wiring (React Router won't find an unregistered route either)

In `frontend/src/App.js`, alongside the other lazy page imports:
```jsx
const PayrollWorkspacePage = lazy(() => import('./pages/payroll/PayrollWorkspacePage'));
const BatchReviewPage      = lazy(() => import('./pages/payroll/BatchReviewPage'));
const FirmDetailsPage      = lazy(() => import('./pages/payroll/FirmDetailsPage'));
const EmployeesListPage    = lazy(() => import('./pages/payroll/EmployeesListPage'));
const EmployeeDetailPage   = lazy(() => import('./pages/payroll/EmployeeDetailPage'));
```
and inside the `<PrivateRoute>`-wrapped `<Routes>`:
```jsx
<Route path="/payroll" element={<PayrollWorkspacePage />} />
<Route path="/payroll/batches/:id" element={<BatchReviewPage />} />
<Route path="/payroll/firm-details" element={<FirmDetailsPage />} />
<Route path="/payroll/employees" element={<EmployeesListPage />} />
<Route path="/payroll/employees/:id" element={<EmployeeDetailPage />} />
```
Add a sidebar/nav link to `/payroll` wherever the app's other module links
live (not included here since that file wasn't part of what was provided).

First thing to do after wiring: open `/payroll/firm-details` and fill in
the firm's name/logo/GSTIN — batch upload will refuse to run until that
row exists (`Company.get_solo()` returns `None` otherwise).

## Why some things look different from the module you gave me

The payroll code (and the `SalaryStructureModal.jsx` you shared) were
built against a **more evolved version of CAOAS** than what's in this
project export — different app names (`employees`/`companies` vs. this
project's `employee`/`clients`), a `latest_salary_structure` property on
Employee that doesn't exist here, an `apps.core` package of shared
mixins/permissions that doesn't exist here, an `api/hooks` + UI primitives
frontend layer that doesn't exist here, and no Celery app config in this
project's `settings.py`. Rather than bend those into this codebase, every
adaptation was kept **inside** `payroll/` and `pages/payroll/`:

- `payroll/mixins.py`, `permissions.py`, `upload_validators.py` — local
  stand-ins for the missing `apps.core` helpers.
- `payroll/models.py` — added `Company` (new, payroll-only, single row —
  see below) and `EmployeeSalaryStructure` (new, FK'd to `employee.Employee`
  — see below), plus `get_latest_salary_structure()` as the replacement
  for the missing `.latest_salary_structure` property.
- `pages/payroll/_kit/` — local, dependency-free equivalents of the
  missing `api/client`, `api/hooks`, UI primitives, `WorkspaceHeader`,
  `StatCard`, `ConfirmDialog`, `GlassDropdown`, `Pagination`, design
  tokens (`theme.css`, scoped to `.payroll-scope` so it can't leak into
  the rest of the app), and a `MonthYearPicker`.
- `Notification` model references (failed-email alerting) were dropped
  per your call — failures are logged instead (see `tasks.py`).

### Company model

`payroll.models.Company` is **separate from `clients.models.Company`** on
purpose, per your instruction: `employee.Employee` has no company scoping
at all (every employee simply belongs to the firm), and `clients.Company`
is the client-organizations table — overloading it with an
internal/client flag it was never designed for felt wrong. `payroll.Company`
is a plain single-row profile (`Company.get_solo()`), editable from
**Payroll → Firm Details** (`pages/FirmDetails.jsx`), including logo
upload.

### Salary structure

`EmployeeSalaryStructure` has a real `employee` **ForeignKey** to
`employee.Employee` (not a reused/duplicated Employee model) with
`effective_from`-dated history, so a raise/promotion never overwrites the
old numbers. `get_latest_salary_structure(employee)` resolves whichever
row was in effect as of a given date. The CTC auto-calc
(`EmployeeSalaryStructure.build_from_ctc`, mirrored client-side in
`SalaryStructureModal.jsx`'s `computeFromCTC`) implements the exact rule
from the file you shared, including the PF-reserve carve-out cascade
(SA → HRA → Basic). Editable from **Payroll → Employees** (`pages/
EmployeesList.jsx` → "Add/Update Structure") or an employee's own detail
page.

## Celery

Kept as-is (`tasks.py` uses `@shared_task`, matching what was already in
the module) rather than adding a new `celery.py`/broker config here,
since you mentioned Celery is already set up somewhere in the fuller
project that this export doesn't include. Once that config exists in
`hrms_backend/hrms_backend/celery.py` (and `CELERY_BROKER_URL`/`redis` are
in `settings.py`), `send_bulk_payslip_emails` will pick it up automatically
— nothing in `payroll/` needs to change for that to start working. Until
then, calling `.delay(...)` on that task will raise a "no broker
configured" error rather than silently doing nothing, so it'll be obvious
when it's not wired up yet.

## Known gaps / things to revisit

- `Company` here has no internal/client discriminator (matches
  `clients.Company` in this project export, which also lacks one) — if a
  real multi-company distinction is ever needed, revisit
  `PayrollBatchSerializer.validate_company` and
  `PayrollBatchViewSet.upload`.
- The comp-off/leave ledger-adjustment endpoints
  (`CompOffAdjustmentViewSet`, `LeaveAdjustmentViewSet`) are new — the
  original module only shipped the models, no API for them.
- `pages/payroll/_kit/` is intentionally minimal (built to match exactly
  what the ported pages call) — if you bring over more pages from the
  fuller project later, some kit files will likely need new exports.
