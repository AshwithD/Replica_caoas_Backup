# CAOAS — Payroll Module — Context & Change-Playbook for AI

> **What this file is:** a self-contained "context primer + rules" you can paste to
> another AI (together with the files you want changed) so it works on this codebase
> correctly without you re-explaining everything every time.
>
> **How to use it:** copy this whole file as the opening context, then add your task
> (e.g. *"Fix X in the client portal"*), then attach the specific files. Tell the AI:
> *"Make the change in only these files, follow the rules below, and reply with the
> changed files plus short replacement instructions."*

---

## 0. One-line orientation

This is **CAOAS**, a Django + React HRMS. You are only ever asked to work on the
**Payroll module**. Treat everything else as a black box you must not touch.

> ⚠️ **The repo is a reference copy, not the live deployment.** It mirrors the real
> project's paths, structure, models and page layouts — but the live project is
> "the same but not exactly identical" (extra files, minor drift). So:
> - Always anchor edits to the **file paths below**; describe changes as drop-in
>   file replacements relative to those paths.
> - Never assume hidden differences you can't see; if something you need is missing,
>   say so instead of inventing it.

---

## 1. Hard scope — what you may and may not touch

### ✅ May touch (the payroll module only)

| Area | Path |
|---|---|
| Payroll backend app | `hrms_backend/payroll/**` |
| Payroll frontend pages | `frontend/src/pages/payroll/**` |
| Portal (client-facing) — backend | `hrms_backend/payroll/portal/**` |
| Portal (client-facing) — frontend | `frontend/src/pages/payroll/portal/**` |

### ❌ Never touch (unless the user explicitly asks)

- `hrms_backend/account/**`, `hrms_backend/employee/**`, `hrms_backend/clients/**` (other apps)
- `hrms_backend/hrms_backend/settings.py` (project settings)
- Celery / Redis configuration (`celery.py`, broker/result backend) — **it already works in prod; do not change it**
- Project-wide email settings (`settings.EMAIL_*`, `settings.DEFAULT_FROM_EMAIL`)
- `AUTH_USER_MODEL` / the staff login system (`account.User`)
- Anything outside `frontend/src/pages/payroll/**` (the only accepted pre-wired
  exceptions are the already-existing routes: `frontend/src/App.js` mounts
  `/portal/*` → `ClientPortal` and `/payroll/*` → `PayrollRoutes`)

**Rule of thumb:** if a fix feels like it needs a change outside `payroll/**`,
stop and ask — there is almost always a payroll-local way to do it.

---

## 2. Stack & environment

| Thing | Value |
|---|---|
| Backend | Django **5.1.14** (5.0.6 crashes on `clients.models.TaskTimeEntry` — use 5.1.x), Python 3.13, Django REST Framework, `django_filters` |
| DB | MySQL in prod (`hrms_db`); **`mysqlclient` is not installed in the sandbox** → use temporary SQLite settings for migrations/tests (see §8) |
| Auth (staff) | `account.User` (custom, `AUTH_USER_MODEL`), DRF Token auth |
| Auth (portal client) | `payroll.portal.models.PortalUser` — **separate**, portal tokens never touch staff auth |
| Frontend | React + react-router-dom, axios; payroll UI is a self-contained "kit" (`_kit/`) that does **not** use Ant Design |
| API base | `/api` → prod `https://api.ckpsca.in/api`, local `http://localhost:8000/api` |

---

## 3. Backend layout — where everything lives

```
hrms_backend/payroll/
├── models.py                  # Employee, PayrollBatch, PayslipRecord, ledgers,
│                              #   EmployeeSalaryStructure, build_from_ctc(),
│                              #   get_latest_salary_structure()
├── views.py                   # ViewSets + generate-from-portal + _build_record_for_employee()
├── serializers.py             # payroll serializers
├── urls.py                    # /api/payroll/... router (see endpoint table)
├── calculations/calculations.py   # pure functions: calculate_payslip_fields(), is_in_probation()
├── excel_parser/              # monthly Excel upload parsing
├── email_service/email_service.py # payslip emails — reads payroll/.env (PAYROLL_EMAIL_*)
├── pdf_generator/             # payslip PDFs (designs 1–8)
├── portal/                    # ★ client portal (separate sub-app, registered under 'payroll')
│   ├── models.py              # PortalUser, PortalSubmission, PortalSubmissionItem,
│   │                          #   PortalSubmissionEvent, PortalAdjustment, PortalHold
│   ├── services.py            # apply_item(), apply_submission(), refresh_batch_after_apply()
│   ├── validators.py          # REQUIRED_KEYS per item type + parse_date/to_decimal/to_positive_int
│   ├── auth.py                # portal token auth
│   ├── urls.py                # /api/portal/...
│   ├── serializers/           # auth.py, admin.py, data.py, submissions.py
│   └── views/                 # auth.py, base.py, data.py, submissions.py (client),
│                              #   admin.py (staff: approve/reject/add-item)
└── migrations/                # 0001 … 0012_portal_events
```

**Portal models are registered under the `payroll` app** (each `Meta` has
`app_label = "payroll"` and a `payroll_*` `db_table`) and are imported at the
bottom of `payroll/models.py`. New portal models follow the same pattern.

### API surface (memorise these prefixes)

| Prefix | Who | Auth |
|---|---|---|
| `/api/payroll/...` | staff UI | staff token |
| `/api/portal/...` | client portal | portal token |

Key staff endpoints (router in `payroll/urls.py`):
`batches`, `records`, `email-logs`, `template`, `comp-off-adjustments`,
`leave-adjustments`, `on-hold-adjustments`, `salary-advance-adjustments`,
`salary-advances`, `clients`, `employees`, `salary-structures`,
`portal-users`, `portal-submissions`.

Key portal endpoints (`payroll/portal/urls.py`):
`login/`, `logout/`, `me/`, `change-password/`, `employees/`, `salary-structures/`,
`advances/`, `submissions/` (GET/POST), `submissions/<id>/submit/`,
`submissions/<id>/notes/`, `submissions/<id>/items/`, `submissions/<id>/items/<item_pk>/`.

Staff-side portal actions (on `portal-submissions`):
`<id>/items/` (GET), `<id>/add-item/` (POST), `<id>/approve/` (POST),
`<id>/reject/` (POST).

---

## 4. Frontend layout — where everything lives

```
frontend/src/pages/payroll/
├── PayrollRoutes.jsx          # /payroll/* route table
├── _kit/                      # shared UI kit (primitives, api client, hooks, styles)
│   ├── api/client.js          # re-exports the project's axios `api` + apiPath()
│   ├── components/            # Modal, ConfirmDialog, PageHero, MonthYearPicker, …
│   └── hooks/hooks.js         # data-fetching helpers
├── pages/                     # staff pages (BatchList, BatchReview, ClientWorkspace,
│   │                          #   EmployeesList, EmployeeDetail, FirmDetails,
│   │                          #   PayrollWorkspace, EmailLogs, EmailLogBatches,
│   │                          #   PortalUsers, PortalSubmissions)
├── modals/                    # UploadPayrollModal, SalaryStructureModal, ChooseDesignModal
├── routes/                    # thin page wrappers used by PayrollRoutes
└── portal/                    # ★ client portal (public)
    ├── ClientPortal.jsx       # shell + router between Login and MonthlyInput
    ├── Login.jsx              # portal login
    ├── MonthlyInput.jsx       # the main client screen (see §6)
    ├── api.js                 # separate axios client for /api/portal (own token)
    ├── ui.jsx                 # portal-local primitives (Modal, Badge, buttons)
    └── portal.css             # portal styling
```

---

## 5. Domain model — the concepts you must know cold

### 5.1 Payroll side (staff)

- **`Employee`** — payroll's own employee record (`payroll_employees`), deliberately
  self-contained (no FK to other apps' employees). Unique per `(client, employee_code)`.
  `status` ∈ `active` / `inactive`.
- **`EmployeeSalaryStructure`** — versioned by `effective_from`. Built from CTC via
  `build_from_ctc(ctc_annual, pf_opted)` which derives Basic+DA / HRA / Special
  Allowance / LTA / Monthly Gross. Carries `employer_pf` (informational) and `pf_opted`.
  `get_latest_salary_structure(employee, as_of)` resolves the effective version.
- **`PayrollBatch`** — one client's payroll for one month. Unique `(client, month, year)`.
  Statuses: `UPLOADED → REVIEWED → SENDING → COMPLETED` (+ `FAILED`).
- **`PayslipRecord`** — one employee's payslip inside a batch. Unique `(batch, employee)`.
  `save()` **recomputes** `earned_salary`, `total_deductions`, `net_salary`,
  `salary_advance_closing_balance`, `on_hold_closing_balance` — so you never hand-total
  these; you set component fields and re-save.
- **Ledgers** — `CompOffAdjustment`, `LeaveAdjustment`, `SalaryAdvance` +
  `SalaryAdvanceAdjustment`, `OnHoldAdjustment`. All are "pending until the next batch
  generation", which folds them into the record and sets `applied_in_record`.
- **`calculate_payslip_fields(structure, row, month, days_in_month, …)`** — the single
  source of truth for salary math. Pure function, no DB access. `row` = attendance +
  upload extras (`actual_working_days`, `lop_days`, `paid_leave_days`, `extra_working_days`,
  `lta`, `special_allowance`, `nps_allowance_earned`, `commission_other`, `arrears`).
  Probation employees: every LOP/paid-leave day is a real deduction. Non-probation:
  paid-leave & LOP are *paid unconditionally*, balanced against leave/comp-off ledgers.

### 5.2 Portal side (client ↔ staff)

- **`PortalUser`** — the client's login (owned by payroll, never staff auth).
- **`PortalSubmission`** — one client's monthly input. Unique `(client, month, year)`.
  Statuses: `DRAFT / SUBMITTED / APPROVED / REJECTED`. **It reopens to DRAFT after
  every approval** (multiple rounds per month).
- **`PortalSubmissionItem`** — one staged change with a JSON `payload`.
  Statuses: `PENDING / APPLIED / SKIPPED / FAILED`.
  Types: `NEW_EMPLOYEE`, `REVISION`, `EXIT`, `SALARY_HOLD`, `ADVANCE`,
  `ONE_TIME_EARNING`, `ONE_TIME_DEDUCTION`, `NOTE` (legacy).
- **`PortalSubmissionEvent`** — the month's **round history** (`SUBMITTED / APPROVED /
  REJECTED`). Exists because the submission row's `status` can't hold past rounds.
- **`PortalAdjustment`** — a materialized one-time earning/deduction for an employee,
  month, year; folded into a payslip record and marked `applied_in_record`.
- **`PortalHold`** — a salary hold + its scheduled release month; releasing creates the
  negative `OnHoldAdjustment` in that month's batch.

### 5.3 The apply pipeline (`portal/services.py`)

`apply_submission(submission, approved_by)` applies every **non-APPLIED** item via
`apply_item()` (each inside its own savepoint), then:
1. sets `approved_by/approved_at`, clears `rejection_reason`;
2. reopens the submission to `DRAFT`;
3. records an `APPROVED` `PortalSubmissionEvent`;
4. calls **`refresh_batch_after_apply()`** — if the month's `PayrollBatch` already
   exists, the just-applied changes are folded straight into its payslip records
   (earnings/deductions → `commission_other`/`other_deduction`; hold/release →
   `on_hold_*`; advances → `salary_advance_*`; revisions → re-derive pay; new joiners →
   new record). This is what keeps **2nd-round changes from disappearing**.

Item handlers map:
`NEW_EMPLOYEE → Employee + structure`, `REVISION → new structure version`,
`EXIT → Employee.status=inactive`, `SALARY_HOLD → OnHoldAdjustment + PortalHold`,
`ADVANCE → SalaryAdvance plan + disbursement`, `ONE_TIME_* → PortalAdjustment`,
`NOTE → no-op`.

---

## 6. Page-by-page context (so the AI knows what each screen is)

- **Client portal → `MonthlyInput.jsx`** (`/portal`): the client's monthly screen.
  Loads the **current month immediately**; the Payroll Month picker only switches months.
  Sections: hero with **Draft / Under Review / Approved** chips (derived from the event
  history), Month Overview stats, **Changes** list (each item shows *who* it's for +
  amount), **Add Change** popup (small, no scroll; items: New Employee, Salary Revision,
  Exit/Resignation, Salary Hold, Advance/Loan, One-time Earning, One-time Deduction),
  a **Note for Payroll Team** *button* (opens a modal — not an always-open textarea),
  **Submit for Review**, an **Export CSV** button, and a **History** timeline rendered
  from `current.history` (SUBMITTED → "Submitted for review", APPROVED → "Approved and
  applied", REJECTED → "Returned for changes"). There is **no Remove button** (applied
  items can't truly be removed from payroll).
- **Staff → `PortalSubmissions.jsx`** (`/payroll/portal-submissions`): list of months;
  detail modal shows items + notes + rejection reason, **Approve & Apply** / **Reject**
  buttons, an **"Add input from your side"** area (staff key in emailed changes, which
  apply immediately), and **Proceed → Batch Review** (skips Excel upload).
- **Staff → `BatchReview.jsx`** (`/payroll/batches/:id`): the payslip table. Editable
  cells (attendance, gross, net) behind an **Edit-details** toggle; the summary row
  (Days Present / LOP / Paid Leave / Gross / Net) sits **below** the Edit-details row;
  edits must **persist** (never revert on save); lock/edit-history features.
- **Staff → `BatchList.jsx`**: list of batches. `ClientWorkspace.jsx`: per-client.
  `EmployeesList.jsx` / `EmployeeDetail.jsx`: employees + ledger adjustments.
  `FirmDetails.jsx`: firm-level settings. `PayrollWorkspace.jsx`: dashboard.
  `EmailLogs.jsx` / `EmailLogBatches.jsx`: payslip email log.
  `PortalUsers.jsx`: manage client portal logins.

---

## 7. Business rules — non-negotiables (keep these intact)

1. **Portal** lives at `/portal` (existing domain, no new subdomain). Forms-only v1 —
   no portal payslip view/download yet.
2. **Multiple rounds per month.** Approval reopens the month to DRAFT; the client can
   add more and resubmit. **APPLIED items are never re-applied** in later rounds.
3. **Staff can add input themselves and Proceed without Excel** (portal batch generation).
4. **Single notes channel:** "Notes for payroll team" (`submission.notes` + legacy
   `NOTE` items) is the only notes UI. `NOTE` is no longer in the client's add menu,
   but old NOTE items must still render. Notes must be **visible to staff**.
5. **Exit vs Hold are separate items:** resignation → EXIT (inactive); hold →
   SALARY_HOLD with a specific **amount + release month**. A hold reduces the current
   month's net pay and parks the balance as an **On-Hold payable** (not a plain
   deduction); it auto-releases in the chosen month's batch.
6. **Loan = salary advance** (one recurring-deduction model): `ADVANCE` → plan +
   disbursement; EMIs auto-recovered monthly.
7. **Employer PF** (total ₹3,600): ₹1,800 **employee** PF is a real monthly deduction;
   ₹1,800 **employer** PF is reserved *once* at CTC-structuring time (carved from
   Special Allowance via `build_from_ctc`), **not** a monthly deduction. On the payslip
   it is a small informational note above Net Salary. Always **computed**
   (`min(12% × Basic, ₹1,800)`), **never hardcoded**.
8. **Email** for payroll comes **only** from `hrms_backend/payroll/.env`
   (`PAYROLL_EMAIL_HOST/PORT/USE_TLS/HOST_USER/HOST_PASSWORD/FROM`). Never
   `settings.EMAIL_*` or `settings.DEFAULT_FROM_EMAIL`.
9. **No Celery/Redis changes** — it already works in prod.
10. **Client model:** master `clients.Client` + OneToOne `ClientProfile`;
    payroll-owned fields are prefixed `payroll_`; the payroll-active toggle is a
    profile boolean. Portal API JSON is flat.
11. **Portal credentials** are owned by `payroll` (`PortalUser`), never the main auth.
12. **Structure rule:** keep proper file structure — don't stuff everything in one file
    (models → `portal/models.py`, logic → `portal/services.py`, validation →
    `portal/validators.py`, views split client/staff, serializers split).

---

## 8. How to make a change (the required workflow)

### Backend

1. Edit only inside `hrms_backend/payroll/**`.
2. If you added/renamed fields or models → write the migration yourself
   (or generate with temp SQLite settings, see below).
3. **Test with a throwaway SQLite DB + smoke script, then delete both.** Concretely:

```bash
# create hrms_backend/hrms_backend/settings_sqlite.py (from settings import *; swap
#   DATABASES to sqlite3 at /tmp/ev_check.sqlite3; CELERY eager; locmem email)
cd hrms_backend
rm -f /tmp/ev_check.sqlite3
python manage.py migrate employee 0037 --settings=hrms_backend.settings_sqlite
python manage.py migrate employee 0038 --fake --settings=hrms_backend.settings_sqlite
python manage.py migrate --settings=hrms_backend.settings_sqlite
python smoke_xxx.py   # your throwaway test — must print PASS/FAIL and exit non-zero on fail
```

- `employee 0038` must be **faked** and **never edited** (see §9).
- Delete `settings_sqlite.py` and the smoke script **before delivering**.

### Frontend

- Edit only inside `frontend/src/pages/payroll/**`.
- **Never run a full `npm run build` in the sandbox** (it OOMs). Verify with esbuild:

```bash
# syntax check (no node_modules needed):
npx --yes esbuild frontend/src/pages/payroll/portal/MonthlyInput.jsx --loader:.jsx=jsx --format=esm --outfile=/tmp/chk.js

# full bundle check (needs node_modules — install then delete):
cd frontend && npm install --no-audit --no-fund
npx --yes esbuild src/pages/payroll/portal/ClientPortal.jsx --bundle --format=esm --jsx=automatic \
  --loader:.css=empty --external:react --external:react-dom --external:react/jsx-runtime --outfile=/tmp/b.js
cd .. && rm -rf frontend/node_modules
```

### Delivery

- Provide **only the files that change**, plus a short `HOW_TO_APPLY.md` with:
  1. what changed and why (one line each),
  2. **replace these files** (path list),
  3. migration command if any (`python manage.py migrate payroll`),
  4. rebuild + restart instruction.
- Package as a zip. Don't leave throwaway test files in the workspace.

---

## 9. Known gotchas / pitfalls (learned the hard way — don't repeat)

1. **`api.get()` resolves to the full axios response**, not the payload. In payroll
   pages use an `unwrapList(d)` helper: `d.data` → array → `{ results }`.
2. **`generate-from-portal` refuses to run if a batch already exists** for that
   client/month/year. Later-round changes must be folded into the existing batch via
   `refresh_batch_after_apply()` — never by deleting/regenerating the batch.
3. **Two `@action` routes can't share a URL path** (`items` GET vs `add-item` POST
   collide → 405). Keep distinct `url_path`s.
4. **`PortalSubmission` has no retrieve endpoint** on the portal side
   (`/api/portal/submissions/<id>/` 404s). Re-fetch by POSTing the create endpoint.
5. **Actor display names:** `first_name`/`last_name` may be null → join non-null parts
   and fall back to email (avoid "Admin None").
6. **Modal z-index:** the payroll `Modal`/`ConfirmDialog` must sit **above** the app
   header's `zIndex: 1001` (use ≥1100) or forms slide under the sticky header.
7. **`**row, **computed` collision:** `lta`, `special_allowance`,
   `nps_allowance_earned` appear in both `row` and `computed` — `pop()` them out of
   `row` first and store as `*_upload` fields (mirror `_build_record_for_employee`).
8. **`apply_submission` only accepts SUBMITTED/APPROVED**; after approval the month is
   DRAFT again, so a later round must first set it back to SUBMITTED.
9. **Applied items must never be re-applied** — `apply_submission` already excludes
   `STATUS_APPLIED`; keep it that way.
10. **Migrations in sandbox:** `makemigrations` fails against MySQL settings
    (`mysqlclient` missing) — use the temp SQLite settings, then remove them.
11. **Django 5.0.6 breaks on `clients.models.TaskTimeEntry`** — pin 5.1.x.
12. **RapidOCR, not pytesseract**, is what's available for OCR in the sandbox (only
    relevant if you're ever asked to read a screenshot).
13. **History timeline** must render from `current.history` (`PortalSubmissionEvent`),
    never from the submission's current `status` — a DRAFT month may already have
    approved rounds.

---

## 10. Naming & style conventions

- Payroll-owned client fields: `payroll_` prefix on `ClientProfile`.
- Portal DB tables: `payroll_portal_*`; core payroll tables keep their existing names
  (`payroll_batches`, `payslip_records`, `payroll_employees`, …).
- Money: `DecimalField(max_digits=12, decimal_places=2)`, default 0; format with
  `Intl.NumberFormat("en-IN")` in the UI.
- Item payload validation lives once in `portal/validators.py` (`REQUIRED_KEYS`) and is
  shared by serializers (client checks) and the apply pipeline (authoritative checks).
- Backend logic → `services.py`; thin views → `views/`; keep docstrings explaining
  *why*, especially around the multi-round / reopen-to-DRAFT behaviour.

---

## 11. Quick answers to the questions every AI asks

- *Where is the client portal?* `frontend/src/pages/payroll/portal/` + `hrms_backend/payroll/portal/`.
- *Where is the staff side?* `frontend/src/pages/payroll/pages/` + `hrms_backend/payroll/`.
- *Can I add a model?* Yes — inside `payroll` (portal models in `payroll/portal/models.py`,
  `app_label="payroll"`, `payroll_*` table) + a migration.
- *Can I change how payslips email?* Only via `payroll/email_service` + `payroll/.env`.
- *Can I touch Celery/Redis or settings?* No.
- *How do I test?* Temp SQLite + smoke script (backend); esbuild (frontend). Delete
  throwaways before delivering.
- *What do I deliver?* Changed files + `HOW_TO_APPLY.md`, zipped.

---

*End of context primer. Everything after this point should be the task description
and the files to change.*
