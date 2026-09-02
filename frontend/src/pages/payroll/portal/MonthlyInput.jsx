import React, { useEffect, useState } from "react";
import { api } from "./api";
import {
  Badge, Button, Card, Checkbox, DateInput, EmptyState, ErrorBanner,
  Field, Modal, NumberInput, SelectInput, Spinner, TextArea, TextInput, fmtINR,
} from "./ui";
// The payroll module's month/year picker (reused here so the portal and the
// internal payroll screens share one calendar component). Its CSS tokens live
// under `.payroll-scope`, so it's wrapped in that class below.
import MonthYearPicker from "../_kit/components/MonthYearPicker";
import "../_kit/styles/theme.css";
import { ChevronDown } from "lucide-react";

const STATUS_LABEL = {
  DRAFT: "Draft",
  SUBMITTED: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Changes Returned",
};

const ITEM_TYPES = [
  { key: "NEW_EMPLOYEE", label: "New Employee", icon: "🧑‍💼" },
  { key: "REVISION", label: "Salary Revision", icon: "🔼" },
  { key: "EXIT", label: "Exit / Resignation", icon: "🚪" },
  { key: "SALARY_HOLD", label: "Salary Hold", icon: "⏸️" },
  { key: "ADVANCE", label: "Advance / Loan", icon: "💰" },
  { key: "ONE_TIME_EARNING", label: "One-time Earning", icon: "➕" },
  { key: "ONE_TIME_DEDUCTION", label: "One-time Deduction", icon: "➖" },
  { key: "NOTE", label: "Note", icon: "📝" },
];
const TYPE_LABEL = Object.fromEntries(ITEM_TYPES.map((t) => [t.key, t.label]));

// Short, client-friendly one-liners shown under each "Add a change" tile.
const TYPE_DESC = {
  NEW_EMPLOYEE: "Add a new joiner to this month's payroll",
  REVISION: "Change an employee's salary or CTC",
  EXIT: "Mark an employee's last working day",
  SALARY_HOLD: "Hold part of a salary, release it later",
  ADVANCE: "Give an advance, recovered in instalments",
  ONE_TIME_EARNING: "Bonus, arrears or an extra payout",
  ONE_TIME_DEDUCTION: "A one-off recovery or deduction",
  NOTE: "Leave a message for your payroll team",
};

// Soft tile colour per item type (icon background).
const TYPE_COLOR = {
  NEW_EMPLOYEE: "#eff6ff",
  REVISION: "#f5f3ff",
  EXIT: "#fef2f2",
  SALARY_HOLD: "#fffbeb",
  ADVANCE: "#ecfdf5",
  ONE_TIME_EARNING: "#eef7ff",
  ONE_TIME_DEDUCTION: "#fff4ec",
  NOTE: "#fffbeb",
};

// Notes are written via the "Note" button (opens the note modal), not as an
// item — so exclude NOTE from the item-type buttons (kept in ITEM_TYPES only
// so previously added NOTE items still render with a proper label).
const ADDABLE_TYPES = ITEM_TYPES.filter((t) => t.key !== "NOTE");

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
}));

const monthLabel = (m, y) =>
  new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", { month: "long" }) + " " + y;

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// "1 item" vs "3 items"
const fmtCount = (n) => {
  const c = Number(n || 0);
  return c === 1 ? "1 item" : `${c} items`;
};

// A single, friendly sentence telling the client what happens next.
function nextStep(current, pendingCount, appliedCount, failedCount) {
  if (!current) return "";
  const reason = current.rejection_reason ? `: ${current.rejection_reason}` : "";
  switch (current.status) {
    case "SUBMITTED":
      return pendingCount > 0
        ? "Your month is under review, and you've added more since — submit again when ready."
        : "Your changes are with your payroll team. They'll review and apply them, then the month reopens for more changes.";
    case "REJECTED":
      return `Your payroll team returned this month${reason}. Fix the flagged items below and resubmit.`;
    case "APPROVED":
      return "This month was approved. You can still add new changes and resubmit.";
    default: // DRAFT (and the reopened state after an approval)
      if (pendingCount > 0)
        return `${fmtCount(pendingCount)} not yet submitted — review the list and tap "Submit for review".`;
      if (appliedCount > 0)
        return "Your last changes were approved and applied. Add anything new, or you're all set for this month.";
      return "No changes recorded yet. Add joiners, revisions or one-time amounts below.";
  }
}

const ITEM_STATUS_PILL = {
  APPLIED: { tone: "green", label: "✓ Applied" },
  PENDING: { tone: "amber", label: "Pending" },
  FAILED: { tone: "red", label: "✗ Failed" },
  SKIPPED: { tone: "slate", label: "Skipped" },
};

const EVENT_TITLE = {
  SUBMITTED: "Submitted for review",
  APPROVED: "Approved and applied",
  REJECTED: "Returned for changes",
};
const EVENT_TONE = { SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };

function summary(item, employees = []) {
  const p = item.payload || {};
  const bits = [];
  if (p.employee_code) bits.push(p.employee_code);
  if (p.first_name) bits.push([p.first_name, p.last_name].filter(Boolean).join(" "));
  if (p.employee_id) {
    // Resolve the target employee so "who the money/change is for" is always
    // visible — an earning/deduction/advance/hold/revision all reference an
    // employee_id, not a name.
    const emp = employees.find((e) => String(e.id) === String(p.employee_id));
    if (emp) {
      const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim();
      bits.push(name ? `${emp.employee_code} — ${name}` : emp.employee_code || `Employee #${p.employee_id}`);
    } else {
      bits.push(`Employee #${p.employee_id}`);
    }
  }
  if (p.ctc_annual) bits.push(`CTC ₹${fmtINR(p.ctc_annual)}`);
  if (p.effective_from) bits.push(`from ${p.effective_from}`);
  if (p.last_working_date) bits.push(`LWD ${p.last_working_date}`);
  if (p.total_amount) bits.push(`₹${fmtINR(p.total_amount)} over ${p.tenure_months} mo`);
  if (p.amount) bits.push(`₹${fmtINR(p.amount)}`);
  if (p.release_month && p.release_year) {
    const m = MONTHS.find((x) => String(x.value) === String(p.release_month));
    bits.push(`release ${m ? m.label : p.release_month} ${p.release_year}`);
  }
  if (p.text) bits.push(p.text);
  if (p.description) bits.push(`(${p.description})`);
  if (p.label) bits.push(`(${p.label})`);
  return bits.join(" · ") || "—";
}

const DEFAULT_PAYLOAD = {
  NEW_EMPLOYEE: {
    employee_code: "", first_name: "", last_name: "", ctc_annual: "", pf_opted: true,
    hire_date: "", email: "", pan_number: "", department: "", position: "",
    effective_from: "", nps_allowance: "", fbp: "", vpf: "",
  },
  REVISION: {
    employee_id: "", effective_from: "", ctc_annual: "", pf_opted: true,
    change_reason: "", nps_allowance: "", fbp: "", vpf: "",
  },
  EXIT: { employee_id: "", last_working_date: "" },
  SALARY_HOLD: { employee_id: "", amount: "", release_month: "", release_year: "", reason: "" },
  ADVANCE: { employee_id: "", total_amount: "", tenure_months: "", label: "" },
  ONE_TIME_EARNING: { employee_id: "", amount: "", description: "" },
  ONE_TIME_DEDUCTION: { employee_id: "", amount: "", description: "" },
};

function normalizePayload(type, p) {
  const clean = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === "" || v === null || v === undefined) continue;
    clean[k] = v;
  }
  if ("employee_id" in clean) clean.employee_id = Number(clean.employee_id);
  if ("tenure_months" in clean) clean.tenure_months = Number(clean.tenure_months);
  if ("release_month" in clean) clean.release_month = Number(clean.release_month);
  if ("release_year" in clean) clean.release_year = Number(clean.release_year);
  return clean;
}

function ItemForm({ type, employees, onSave, saving, releaseDefault }) {
  const [p, setP] = useState(() => {
    const base = { ...DEFAULT_PAYLOAD[type] };
    if (type === "SALARY_HOLD" && releaseDefault) {
      base.release_month = String(releaseDefault.month);
      base.release_year = String(releaseDefault.year);
    }
    return base;
  });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));

  const empOptions = employees.map((e) => ({
    value: String(e.id),
    label: `${e.employee_code} — ${e.full_name}`,
  }));

  const submit = (e) => {
    e.preventDefault();
    onSave(type, normalizePayload(type, p));
  };

  const num = (label, key, hint) => (
    <Field label={label} hint={hint}>
      <NumberInput value={p[key]} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );

  return (
    <form onSubmit={submit} id="portal-item-form">
      {type === "NEW_EMPLOYEE" && (
        <div className="grid grid-3">
          <Field label="Employee Code *">
            <TextInput value={p.employee_code} onChange={(e) => set("employee_code", e.target.value)} placeholder="e.g. KSPL900" />
          </Field>
          <Field label="First Name *">
            <TextInput value={p.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </Field>
          <Field label="Last Name">
            <TextInput value={p.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </Field>
          {num("Annual CTC *", "ctc_annual", "Structure is auto-derived from this (Basic, HRA, Special Allowance)")}
          <Field label="Hire Date">
            <DateInput value={p.hire_date} onChange={(e) => set("hire_date", e.target.value)} />
          </Field>
          <Field label="Effective From" hint="Defaults to hire date or the month's 1st">
            <DateInput value={p.effective_from} onChange={(e) => set("effective_from", e.target.value)} />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="PAN">
            <TextInput value={p.pan_number} onChange={(e) => set("pan_number", e.target.value)} />
          </Field>
          <Field label="Department">
            <TextInput value={p.department} onChange={(e) => set("department", e.target.value)} />
          </Field>
          <Field label="Position">
            <TextInput value={p.position} onChange={(e) => set("position", e.target.value)} />
          </Field>
          {num("NPS Allowance", "nps_allowance")}
          {num("FBP", "fbp")}
          {num("VPF", "vpf")}
          <div style={{ alignSelf: "end" }}>
            <Checkbox label="PF opted" checked={p.pf_opted} onChange={(e) => set("pf_opted", e.target.checked)} />
          </div>
        </div>
      )}

      {type === "REVISION" && (
        <div className="grid grid-3">
          <Field label="Employee *">
            <SelectInput options={empOptions} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </Field>
          <Field label="Effective From *">
            <DateInput value={p.effective_from} onChange={(e) => set("effective_from", e.target.value)} />
          </Field>
          {num("Revised Annual CTC *", "ctc_annual", "Arrears are calculated from the effective date")}
          <Field label="Reason / note">
            <TextInput value={p.change_reason} onChange={(e) => set("change_reason", e.target.value)} />
          </Field>
          {num("NPS Allowance", "nps_allowance")}
          {num("FBP", "fbp")}
          {num("VPF", "vpf")}
          <div style={{ alignSelf: "end" }}>
            <Checkbox label="PF opted" checked={p.pf_opted} onChange={(e) => set("pf_opted", e.target.checked)} />
          </div>
        </div>
      )}

      {type === "EXIT" && (
        <div className="grid grid-2">
          <Field label="Employee *">
            <SelectInput options={empOptions} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </Field>
          <Field label="Last Working Date *">
            <DateInput value={p.last_working_date} onChange={(e) => set("last_working_date", e.target.value)} />
          </Field>
        </div>
      )}

      {type === "SALARY_HOLD" && (
        <div className="grid grid-2">
          <Field label="Employee *">
            <SelectInput options={empOptions} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </Field>
          {num("Amount to Hold *", "amount", "Deducted from this month's pay and kept on hold")}
          <Field label="Release Month *" hint="The amount is paid back in this month's payroll">
            <SelectInput options={MONTHS} value={p.release_month} onChange={(e) => set("release_month", e.target.value)} />
          </Field>
          <Field label="Release Year *">
            <NumberInput value={p.release_year} onChange={(e) => set("release_year", e.target.value)} style={{ maxWidth: 120 }} />
          </Field>
          <Field label="Reason" hint="e.g. Notice period / incomplete handover">
            <TextInput value={p.reason} onChange={(e) => set("reason", e.target.value)} />
          </Field>
        </div>
      )}

      {type === "ADVANCE" && (
        <div className="grid grid-2">
          <Field label="Employee *">
            <SelectInput options={empOptions} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </Field>
          {num("Total Amount *", "total_amount", "Lump sum given to the employee")}
          {num("Tenure (months) *", "tenure_months", "Recovered in equal instalments")}
          <Field label="Label" hint="e.g. Soft loan / Salary advance">
            <TextInput value={p.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
        </div>
      )}

      {(type === "ONE_TIME_EARNING" || type === "ONE_TIME_DEDUCTION") && (
        <div className="grid grid-2">
          <Field label="Employee *">
            <SelectInput options={empOptions} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </Field>
          {num("Amount *", "amount")}
          <Field label="Description" hint="e.g. Retention bonus / Other allowance">
            <TextInput value={p.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      )}
    </form>
  );
}

export default function MonthlyInput() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [employees, setEmployees] = useState([]);

  const [current, setCurrent] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState(null);

  const [addingType, setAddingType] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    api.get("/portal/employees/").then((d) => setEmployees(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Open the current month straight away — the client can switch months via
  // the month switcher if needed.
  useEffect(() => {
    loadMonth(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMonth = async (m, y) => {
    setError(""); setItems(null); setAddingType(null);
    setLoading(true);
    try {
      const sub = await api.post("/portal/submissions/", { month: Number(m), year: Number(y) });
      setCurrent(sub);
      setNotes(sub.notes || "");
      const its = await api.get(`/portal/submissions/${sub.id}/items/`);
      setItems(Array.isArray(its) ? its : []);
    } catch (e) {
      setError(e.message);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true); setError("");
    try {
      const sub = await api.post(`/portal/submissions/${current.id}/notes/`, { notes });
      setCurrent(sub);
      setNotes(sub.notes || "");
      setNotesSavedAt(new Date());
      setNoteOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const refreshItems = async (subId) => {
    const its = await api.get(`/portal/submissions/${subId}/items/`);
    setItems(Array.isArray(its) ? its : []);
  };

  const addItem = async (type, payload) => {
    setSavingItem(true); setError("");
    try {
      await api.post(`/portal/submissions/${current.id}/items/`, { item_type: type, payload });
      setAddingType(null);
      await refreshItems(current.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingItem(false);
    }
  };

  // Client-side CSV export of the month's changes (no backend needed).
  const exportCSV = () => {
    const rows = (items || []).map((it) => ({
      type: TYPE_LABEL[it.item_type] || it.item_type,
      details: summary(it, employees),
      status: it.status,
    }));
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Type", "Details", "Status"].join(","),
      ...rows.map((r) => [r.type, r.details, r.status].map(esc).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-changes-${monthLabel(month, year).replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitMonth = async () => {
    if (!window.confirm("Submit this month for payroll review? You won't be able to edit it until it's approved or returned.")) return;
    setSubmitting(true); setError("");
    try {
      const sub = await api.post(`/portal/submissions/${current.id}/submit/`);
      setCurrent(sub);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const editable = current && ["DRAFT", "REJECTED", "APPROVED"].includes(current.status);

  // ── derived counts ────────────────────────────────────────────────
  const events = current?.history || [];
  const pendingCount = (items || []).filter((it) => it.status === "PENDING" || it.status === "FAILED").length;
  const appliedCount = (items || []).filter((it) => it.status === "APPLIED").length;
  const failedCount = (items || []).filter((it) => it.status === "FAILED").length;
  const hasUnsent = pendingCount > 0;

  // Pending / failed changes need attention first — surface them above the
  // already-applied ones.
  const rank = (s) => (s === "PENDING" || s === "FAILED" ? 0 : 1);
  const orderedItems = (items || []).slice().sort((a, b) => rank(a.status) - rank(b.status));

  const visibleHistory = showHistory ? events : events.slice(0, 4);

  return (
    <div>
      {/* ── Page head ── */}
      <div className="mi-head">
        <div className="mi-head-left">
          <h1 className="page-title">Payroll Input</h1>
          <p className="page-sub">Record and submit this month's changes — joiners, revisions, exits, holds and one-time amounts.</p>
        </div>
        <div className="mi-head-right">
          <div className="monthpicker">
            <button type="button" className="monthpicker-trigger" onClick={() => setPickerOpen((o) => !o)}>
              <span className="monthpicker-emoji">📅</span>
              <span className="monthpicker-value">{monthLabel(month, year)}</span>
              <ChevronDown size={16} className="monthpicker-caret" />
            </button>
            {pickerOpen && (
              <>
                <div className="monthpicker-backdrop" onClick={() => setPickerOpen(false)} />
                <div className="monthpicker-pop">
                  <div className="payroll-scope">
                    <MonthYearPicker
                      month={Number(month)}
                      year={Number(year)}
                      onChange={(m, y) => {
                        setMonth(String(m));
                        setYear(String(y));
                        setPickerOpen(false);
                        loadMonth(String(m), String(y));
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {current && (items || []).length > 0 && (
            <Button size="sm" variant="secondary" onClick={exportCSV}>⬇ Export CSV</Button>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />

      {/* ── Status strip — one clear sentence on where this month stands ── */}
      {current && (
        <div className={`status-strip strip-${current.status}`}>
          <span className="status-strip-pill">{STATUS_LABEL[current.status] || current.status}</span>
          <span className="status-strip-blurb">
            {nextStep(current, pendingCount, appliedCount, failedCount)}
          </span>
        </div>
      )}

      {loading && (
        <div className="center" style={{ padding: 48 }}><Spinner /></div>
      )}

      {!current && !loading && (
        <Card>
          <EmptyState
            title="Pick a month to begin"
            hint="Choose the payroll month and year, and the month opens here."
          />
        </Card>
      )}

      {current && !loading && (
        <div className="mi-grid">
          {/* ── Left column — the month's changes ── */}
          <div className="mi-left">
            <Card>
              <div className="card-head">
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Changes</h3>
                  <p className="card-head-sub">
                    {fmtCount(items ? items.length : 0)} total
                    {pendingCount > 0 ? ` · ${fmtCount(pendingCount)} pending` : ""}
                    {appliedCount > 0 ? ` · ${fmtCount(appliedCount)} applied` : ""}
                  </p>
                </div>
              </div>

              {(!items || items.length === 0) ? (
                <div className="empty-box">No changes yet — add your first one below.</div>
              ) : (
                <div className="item-list">
                  {orderedItems.map((it) => {
                    const meta = ITEM_TYPES.find((t) => t.key === it.item_type);
                    const pill = ITEM_STATUS_PILL[it.status] || { tone: "slate", label: it.status };
                    return (
                      <div className={`item-card item-${it.status.toLowerCase()}`} key={it.id}>
                        <div className="item-icon" style={{ background: TYPE_COLOR[it.item_type] || "#f1f5f9" }}>
                          {meta ? meta.icon : "📄"}
                        </div>
                        <div className="item-main">
                          <div className="item-title-row">
                            <span className="item-title">{TYPE_LABEL[it.item_type] || it.item_type}</span>
                            <Badge tone={pill.tone}>{pill.label}</Badge>
                          </div>
                          <div className="item-sub">{summary(it, employees)}</div>
                          {it.error && (
                            <div className="item-error">
                              ⚠ {it.error}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {notes && notes.trim() && (
                <div className="note-line" onClick={() => setNoteOpen(true)}>
                  <span className="note-line-icon">📝</span>
                  <span className="note-line-text">{notes.trim()}</span>
                  <span className="link-btn">Edit</span>
                </div>
              )}

              {editable && (
                <>
                  <h4 className="items-title">Add a change</h4>
                  <div className="type-grid">
                    {ADDABLE_TYPES.map((t) => (
                      <button key={t.key} type="button" className="type-tile" onClick={() => setAddingType(t.key)}>
                        <span className="type-tile-icon">{t.icon}</span>
                        <span className="type-tile-label">{t.label}</span>
                        <span className="type-tile-desc">{TYPE_DESC[t.key]}</span>
                      </button>
                    ))}
                    <button type="button" className="type-tile" onClick={() => setNoteOpen(true)}>
                      <span className="type-tile-icon">📝</span>
                      <span className="type-tile-label">Note</span>
                      <span className="type-tile-desc">{TYPE_DESC.NOTE}</span>
                    </button>
                  </div>
                </>
              )}

              {editable && hasUnsent && (
                <div className="submit-bar">
                  <div className="submit-bar-copy">
                    <div className="submit-bar-title">Ready to send?</div>
                    <div className="submit-bar-sub">
                      {fmtCount(pendingCount)} will go to your payroll team for review and approval.
                    </div>
                  </div>
                  <Button onClick={submitMonth} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* ── Right column — round history ── */}
          <div className="mi-right">
            <Card>
              <div className="card-head">
                <h3 className="section-title" style={{ margin: 0 }}>History</h3>
                {events.length > 4 && (
                  <button className="link-btn" onClick={() => setShowHistory((v) => !v)}>
                    {showHistory ? "Show less" : "View all"}
                  </button>
                )}
              </div>

              {!hasUnsent && events.length === 0 ? (
                <p className="small muted" style={{ margin: "8px 0 4px" }}>
                  No activity yet for this month.
                </p>
              ) : (
                <div className="tl">
                  {editable && hasUnsent && (
                    <div className="tl-item tl-draft">
                      <div className="tl-row">
                        <span className="tl-title">Draft in progress</span>
                        <Badge tone="slate">Pending</Badge>
                      </div>
                      <div className="tl-meta">{fmtCount(pendingCount)} not yet submitted</div>
                    </div>
                  )}
                  {visibleHistory.map((ev) => (
                    <div className={`tl-item tl-${ev.event_type.toLowerCase()}`} key={ev.id}>
                      <div className="tl-row">
                        <span className="tl-title">{EVENT_TITLE[ev.event_type] || ev.event_type}</span>
                        <Badge tone={EVENT_TONE[ev.event_type] || "slate"}>{ev.event_type}</Badge>
                      </div>
                      <div className="tl-meta">
                        {fmtCount(ev.item_count)} · {fmtDate(ev.created_at)}
                        {ev.event_type === "APPROVED" && ev.actor ? ` · by ${ev.actor}` : ""}
                      </div>
                      {ev.event_type === "REJECTED" && ev.note && (
                        <div className="tl-note">"{ev.note}"</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Note modal ── */}
      {noteOpen && (
        <Modal
          title="📝  Note for Payroll Team"
          onClose={() => setNoteOpen(false)}
          footer={
            <div className="modal-foot">
              <Button type="button" variant="secondary" onClick={() => setNoteOpen(false)} disabled={savingNotes}>
                Cancel
              </Button>
              <Button onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? "Saving…" : "Save Note"}
              </Button>
            </div>
          }
        >
          <Field label="Note" hint="Shown to your payroll team when they review this month">
            <TextArea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything your payroll team should know about this month…"
            />
          </Field>
          {notesSavedAt && (
            <p className="notes-saved">Last saved: {notesSavedAt.toLocaleTimeString()}</p>
          )}
        </Modal>
      )}

      {/* ── Add-item modal ── */}
      {addingType && (() => {
        const active = ITEM_TYPES.find((t) => t.key === addingType);
        return (
          <Modal
            title={`${active ? active.icon + "  " : ""}Add ${TYPE_LABEL[addingType]}`}
            onClose={() => setAddingType(null)}
            footer={
              <div className="modal-foot">
                <Button type="button" variant="secondary" onClick={() => setAddingType(null)} disabled={savingItem}>
                  Cancel
                </Button>
                <Button type="submit" form="portal-item-form" disabled={savingItem}>
                  {savingItem ? "Saving…" : `Add ${TYPE_LABEL[addingType]}`}
                </Button>
              </div>
            }
          >
            <ItemForm
              type={addingType}
              employees={employees}
              saving={savingItem}
              onSave={addItem}
              releaseDefault={
                current
                  ? {
                      month: current.month === 12 ? 1 : current.month + 1,
                      year: current.month === 12 ? current.year + 1 : current.year,
                    }
                  : undefined
              }
            />
          </Modal>
        );
      })()}
    </div>
  );
}
