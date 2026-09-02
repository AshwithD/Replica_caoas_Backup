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
import {
  AlertCircle, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock,
  Download, FileText, Info, LayoutList, Lock, MessageSquareText, Minus,
  MinusCircle, PauseCircle, Pencil, Plus, Send, Star, Trash2, TrendingUp,
  UserMinus, UserPlus, Wallet,
} from "lucide-react";

const STATUS_LABEL = {
  DRAFT: "Draft",
  SUBMITTED: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Changes Returned",
};

const STATUS_ICON = {
  DRAFT: Pencil,
  SUBMITTED: Clock,
  APPROVED: CheckCircle2,
  REJECTED: AlertCircle,
};

const ITEM_TYPES = [
  { key: "NEW_EMPLOYEE", label: "New Employee" },
  { key: "REVISION", label: "Salary Revision" },
  { key: "EXIT", label: "Exit / Resignation" },
  { key: "SALARY_HOLD", label: "Salary Hold" },
  { key: "ADVANCE", label: "Advance / Loan" },
  { key: "ONE_TIME_EARNING", label: "One-time Earning" },
  { key: "ONE_TIME_DEDUCTION", label: "One-time Deduction" },
  { key: "NOTE", label: "Note" },
];
const TYPE_LABEL = Object.fromEntries(ITEM_TYPES.map((t) => [t.key, t.label]));

// Icon + soft colour tone per item type (tones are styled in portal.css).
const TYPE_ICON = {
  NEW_EMPLOYEE: UserPlus,
  REVISION: TrendingUp,
  EXIT: UserMinus,
  SALARY_HOLD: PauseCircle,
  ADVANCE: Wallet,
  ONE_TIME_EARNING: Plus,
  ONE_TIME_DEDUCTION: Minus,
  NOTE: MessageSquareText,
};
const TYPE_TONE = {
  NEW_EMPLOYEE: "blue",
  REVISION: "violet",
  EXIT: "rose",
  SALARY_HOLD: "indigo",
  ADVANCE: "amber",
  ONE_TIME_EARNING: "violet",
  ONE_TIME_DEDUCTION: "rose",
  NOTE: "blue",
};

// Action-first wording for the "Add Another Change" tiles (the list rows keep
// the shorter TYPE_LABEL names).
const TILE_LABEL = {
  NEW_EMPLOYEE: "Add New Employee",
  REVISION: "Update Salary",
  EXIT: "Record Exit",
  SALARY_HOLD: "Hold Salary",
  ADVANCE: "Add Advance / Loan",
  ONE_TIME_EARNING: "Add Extra Payment",
  ONE_TIME_DEDUCTION: "Add Deduction",
  NOTE: "Send a Note",
};

// Short, client-friendly one-liners shown under each tile.
const TYPE_DESC = {
  NEW_EMPLOYEE: "Add someone joining this month",
  REVISION: "Change salary or CTC",
  EXIT: "Tell us about an employee leaving",
  SALARY_HOLD: "Hold salary for later release",
  ADVANCE: "Give an advance or loan",
  ONE_TIME_EARNING: "Bonus, arrears or extra payout",
  ONE_TIME_DEDUCTION: "One-time or other deduction",
  NOTE: "Leave a message for payroll team",
};

// Notes are written via the "Send a Note" tile (opens the note modal), not as
// an item — so exclude NOTE from the item-type tiles (kept in ITEM_TYPES only
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

// "Today" / "Yesterday" / "Sep 1, 2026" — the timeline reads better this way.
const fmtDay = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(dt)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return fmtDate(d);
};

// "1 change" vs "3 changes"
const fmtCount = (n) => {
  const c = Number(n || 0);
  return c === 1 ? "1 change" : `${c} changes`;
};

// A single, friendly sentence telling the client what happens next.
function nextStep(current, pendingCount, appliedCount) {
  if (!current) return "";
  const reason = current.rejection_reason ? `: ${current.rejection_reason}` : "";
  switch (current.status) {
    case "SUBMITTED":
      return pendingCount > 0
        ? "This month is under review, and you've added more since — submit again when ready."
        : "Your changes are with your payroll team. They'll review and apply them, then the month reopens for more changes.";
    case "REJECTED":
      return `Your payroll team returned this month${reason}. Fix the flagged changes and resubmit.`;
    case "APPROVED":
      return "This month was approved. You can still add new changes and resubmit.";
    default: // DRAFT (and the reopened state after an approval)
      if (pendingCount > 0)
        return `${fmtCount(pendingCount)} not yet submitted — review the list and send it for review.`;
      if (appliedCount > 0)
        return "Your last changes were approved and applied. Add anything new, or you're all set for this month.";
      return "No changes recorded yet. Add joiners, revisions or one-time amounts from the left.";
  }
}

const ITEM_STATUS_PILL = {
  APPLIED: { tone: "green", label: "Applied", icon: CheckCircle2 },
  PENDING: { tone: "amber", label: "Pending", icon: null },
  FAILED: { tone: "red", label: "Needs Attention", icon: null },
  SKIPPED: { tone: "slate", label: "Skipped", icon: null },
};

const EVENT_TITLE = {
  SUBMITTED: "Changes submitted for review",
  APPROVED: "Changes approved and applied",
  REJECTED: "Changes returned",
};
const EVENT_TONE = { SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };
const EVENT_BADGE = { SUBMITTED: "SUBMITTED", APPROVED: "APPROVED", REJECTED: "RETURNED" };
const EVENT_ICON = { SUBMITTED: Clock, APPROVED: CheckCircle2, REJECTED: MinusCircle };

// "EMP102 — Priya Nair" for a payload's employee_id.
function employeeLabel(employeeId, employees = []) {
  const emp = employees.find((e) => String(e.id) === String(employeeId));
  if (!emp) return `Employee #${employeeId}`;
  const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim();
  return name ? `${emp.employee_code} — ${name}` : emp.employee_code || `Employee #${employeeId}`;
}

function summary(item, employees = []) {
  const p = item.payload || {};
  const bits = [];
  if (p.employee_code) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    bits.push(name ? `${p.employee_code} — ${name}` : p.employee_code);
  } else if (p.first_name) {
    bits.push([p.first_name, p.last_name].filter(Boolean).join(" "));
  }
  // Resolve the target employee so "who the money/change is for" is always
  // visible — an earning/deduction/advance/hold/revision all reference an
  // employee_id, not a name.
  if (p.employee_id) bits.push(employeeLabel(p.employee_id, employees));
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

// Friendly labels for the expanded "all details" view of a change.
const FIELD_LABEL = {
  employee_id: "Employee",
  employee_code: "Employee Code",
  first_name: "First Name",
  last_name: "Last Name",
  ctc_annual: "Annual CTC",
  pf_opted: "PF Opted",
  hire_date: "Hire Date",
  email: "Email",
  pan_number: "PAN",
  department: "Department",
  position: "Position",
  effective_from: "Effective From",
  nps_allowance: "NPS Allowance",
  fbp: "FBP",
  vpf: "VPF",
  change_reason: "Reason",
  last_working_date: "Last Working Date",
  amount: "Amount",
  release_month: "Release Month",
  release_year: "Release Year",
  reason: "Reason",
  total_amount: "Total Amount",
  tenure_months: "Tenure (months)",
  label: "Label",
  description: "Description",
  text: "Note",
};
const MONEY_KEYS = new Set([
  "ctc_annual", "amount", "total_amount", "nps_allowance", "fbp", "vpf",
]);

function detailRows(item, employees = []) {
  const p = item.payload || {};
  return Object.entries(p)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([k, v]) => {
      let value = v;
      if (k === "employee_id") value = employeeLabel(v, employees);
      else if (typeof v === "boolean") value = v ? "Yes" : "No";
      else if (k === "release_month") {
        const m = MONTHS.find((x) => String(x.value) === String(v));
        value = m ? m.label : v;
      } else if (MONEY_KEYS.has(k)) value = `₹${fmtINR(v)}`;
      return { key: k, label: FIELD_LABEL[k] || k.replace(/_/g, " "), value: String(value) };
    });
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

function ItemForm({ type, employees, onSave, saving, releaseDefault, initial }) {
  const [p, setP] = useState(() => {
    const base = { ...DEFAULT_PAYLOAD[type] };
    if (type === "SALARY_HOLD" && releaseDefault) {
      base.release_month = String(releaseDefault.month);
      base.release_year = String(releaseDefault.year);
    }
    // Editing an existing change — prefill with what was saved.
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        base[k] = typeof v === "boolean" ? v : String(v);
      }
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

/* ── small presentational helpers ─────────────────────────────────── */

function SectionHead({ icon: Icon, title, right }) {
  return (
    <div className="sec-head">
      <div className="sec-head-left">
        <span className="sec-icon"><Icon size={15} /></span>
        <h3 className="sec-title">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function StatTile({ tone, value, label }) {
  return (
    <div className={`stat-tile stat-${tone}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BreakdownRow({ icon: Icon, tone, label, count }) {
  return (
    <div className="bd-row">
      <span className={`bd-icon tone-${tone}`}><Icon size={16} /></span>
      <span className="bd-label">{label}</span>
      <span className="bd-count">{fmtCount(count)}</span>
    </div>
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
  const [editingItem, setEditingItem] = useState(null); // item being corrected
  const [savingItem, setSavingItem] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState(null); // expanded change row

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
    setError(""); setItems(null); setAddingType(null); setEditingItem(null); setOpenItemId(null);
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

  // Add a new change, or save a correction to an existing one.
  const saveItem = async (type, payload) => {
    setSavingItem(true); setError("");
    try {
      if (editingItem) {
        await api.patch(
          `/portal/submissions/${current.id}/items/${editingItem.id}/`,
          { item_type: type, payload }
        );
      } else {
        await api.post(`/portal/submissions/${current.id}/items/`, { item_type: type, payload });
      }
      setAddingType(null);
      setEditingItem(null);
      await refreshItems(current.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (item) => {
    setRemovingId(item.id); setError("");
    try {
      await api.del(`/portal/submissions/${current.id}/items/${item.id}/`);
      await refreshItems(current.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setRemovingId(null);
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
    setSubmitting(true); setError("");
    try {
      const sub = await api.post(`/portal/submissions/${current.id}/submit/`);
      setCurrent(sub);
      setConfirmSubmit(false);
    } catch (e) {
      setError(e.message);
      setConfirmSubmit(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Payslips already generated for this month → the month is closed. Anything
  // added now could never appear on a payslip the employee already has, so the
  // portal goes read-only (the API enforces the same rule).
  const payrollLock = current?.payroll_lock || null;
  const payslipsIssued = !!payrollLock?.locked;
  const editable =
    !!current && ["DRAFT", "REJECTED", "APPROVED"].includes(current.status) && !payslipsIssued;

  // ── derived counts ────────────────────────────────────────────────
  const events = current?.history || [];
  const allItems = items || [];
  const pendingOnly = allItems.filter((it) => it.status === "PENDING").length;
  const appliedCount = allItems.filter((it) => it.status === "APPLIED").length;
  const failedCount = allItems.filter((it) => it.status === "FAILED").length;
  const pendingCount = pendingOnly + failedCount; // everything not yet applied
  const hasUnsent = pendingCount > 0;

  // Pending / failed changes need attention first — surface them above the
  // already-applied ones.
  const rank = (s) => (s === "FAILED" ? 0 : s === "PENDING" ? 1 : 2);
  const orderedItems = allItems.slice().sort((a, b) => rank(a.status) - rank(b.status));

  const visibleHistory = showHistory ? events : events.slice(0, 3);
  const StatusIcon = current ? STATUS_ICON[current.status] || Clock : Clock;
  const formType = editingItem ? editingItem.item_type : addingType;
  const heading = `${monthLabel(month, year)} Payroll Changes`;

  return (
    <div className="mi">
      {/* ── Page head ── */}
      <div className="mi-head">
        <div className="mi-head-left">
          <h1 className="mi-title">{heading}</h1>
          <p className="mi-sub">
            Add or review changes for {monthLabel(month, year)} before submitting.
          </p>
        </div>

        <div className="mi-head-right">
          {current && (
            payslipsIssued ? (
              <span className="state-pill state-CLOSED" title={payrollLock.reason}>
                <Lock size={15} /> Payslips issued
              </span>
            ) : (
              <span className={`state-pill state-${current.status}`}>
                <StatusIcon size={15} />
                {STATUS_LABEL[current.status] || current.status}
              </span>
            )
          )}

          <div className="monthpicker">
            <button type="button" className="monthpicker-trigger" onClick={() => setPickerOpen((o) => !o)}>
              <span className="monthpicker-ico"><CalendarDays size={16} /></span>
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

          <Button variant="secondary" className="btn-icon" onClick={exportCSV} disabled={!current || allItems.length === 0}>
            <Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {/* Closed months: payslips are out, nothing more can be staged here. */}
      {payslipsIssued && (
        <div className="callout callout-slate">
          <Lock size={17} />
          <div>
            <strong>This month is closed.</strong>{" "}
            {payrollLock.reason}{" "}
            Need a correction? Contact your payroll team — they can amend the payroll
            and reissue the payslips.
          </div>
        </div>
      )}

      {/* Returned months get a loud, unmissable banner. */}
      {current && current.status === "REJECTED" && (
        <div className="callout callout-red">
          <AlertCircle size={17} />
          <div>
            <strong>Your payroll team returned this month.</strong>{" "}
            {current.rejection_reason || "Fix the flagged changes below and submit again."}
          </div>
        </div>
      )}

      {loading && (
        <div className="center" style={{ padding: 64 }}><Spinner /></div>
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
          {/* ══ Left column — overview + add a change ══ */}
          <div className="mi-left">
            <Card>
              <SectionHead icon={FileText} title="Month Overview" />

              <div className="mo-month">
                <span className="mo-month-ico"><FileText size={22} /></span>
                <div>
                  <div className="mo-month-name">{monthLabel(month, year)}</div>
                  <div className={`mo-month-state text-${current.status}`}>
                    {STATUS_LABEL[current.status] || current.status}
                  </div>
                </div>
              </div>

              <div className="stat-row">
                <StatTile tone="blue" value={allItems.length} label="Total Changes" />
                <StatTile tone="green" value={appliedCount} label="Applied" />
                <StatTile tone="amber" value={pendingCount} label="Pending" />
              </div>

              {allItems.length > 0 && (
                <div className="bd-list">
                  {failedCount > 0 && (
                    <BreakdownRow icon={AlertCircle} tone="red" label="Needs Attention" count={failedCount} />
                  )}
                  {appliedCount > 0 && (
                    <BreakdownRow icon={CheckCircle2} tone="green" label="Applied" count={appliedCount} />
                  )}
                  {pendingOnly > 0 && (
                    <BreakdownRow icon={Clock} tone="amber" label="Pending Review" count={pendingOnly} />
                  )}
                </div>
              )}

              <p className="mo-hint">
                {payslipsIssued
                  ? "Payslips for this month are already out, so it's closed for new changes. Anything for the next month can be added from the month picker above."
                  : nextStep(current, pendingCount, appliedCount)}
              </p>
            </Card>

            <Card className={editable ? "" : "card-locked"}>
              <h3 className="sec-title plain">Add Another Change</h3>
              <p className="sec-sub">
                {editable
                  ? "Select the type of change you want to add."
                  : payslipsIssued
                    ? "Closed — payslips for this month have already been generated."
                    : "Locked while your payroll team reviews this month."}
              </p>

              <div className="type-grid">
                {ADDABLE_TYPES.map((t) => {
                  const Icon = TYPE_ICON[t.key];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className="type-tile"
                      disabled={!editable}
                      onClick={() => { setEditingItem(null); setAddingType(t.key); }}
                    >
                      <span className={`type-tile-ico tone-${TYPE_TONE[t.key]}`}><Icon size={17} /></span>
                      <span className="type-tile-text">
                        <span className="type-tile-label">{TILE_LABEL[t.key]}</span>
                        <span className="type-tile-desc">{TYPE_DESC[t.key]}</span>
                      </span>
                      <ChevronRight size={16} className="type-tile-caret" />
                    </button>
                  );
                })}
                <button type="button" className="type-tile" disabled={!editable} onClick={() => setNoteOpen(true)}>
                  <span className="type-tile-ico tone-blue"><MessageSquareText size={17} /></span>
                  <span className="type-tile-text">
                    <span className="type-tile-label">{TILE_LABEL.NOTE}</span>
                    <span className="type-tile-desc">{TYPE_DESC.NOTE}</span>
                  </span>
                  <ChevronRight size={16} className="type-tile-caret" />
                </button>
              </div>

              {editable && hasUnsent && (
                <div className="submit-card inline">
                  <div className="submit-copy">
                    <div className="submit-title">Ready to submit?</div>
                    <div className="submit-sub">
                      {fmtCount(pendingCount)} will be sent to your payroll team for review.
                    </div>
                  </div>
                  <Button className="btn-lg btn-block" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit for Review"} <Send size={16} />
                  </Button>
                  <div className="submit-hint">
                    <Lock size={13} /> You can edit your changes until submitted.
                  </div>
                </div>
              )}

              {/* pointless on a closed month — nothing can be submitted */}
              {!payslipsIssued && (
              <div className="howto">
                <div className="howto-head"><Info size={14} /> What happens after you submit?</div>
                <div className="howto-steps">
                  <div className="howto-step"><span className="howto-num">1</span> Payroll team reviews your changes</div>
                  <span className="howto-dash" />
                  <div className="howto-step"><span className="howto-num">2</span> We may contact you if clarification is needed</div>
                  <span className="howto-dash" />
                  <div className="howto-step"><span className="howto-num">3</span> Approved changes are applied to payroll</div>
                </div>
              </div>
              )}
            </Card>
          </div>

          {/* ══ Right column — changes + history ══ */}
          <div className="mi-right">
            <Card>
              <SectionHead
                icon={LayoutList}
                title="Your Changes"
                right={
                  <div className="count-strip">
                    <span>{allItems.length} total</span>
                    {pendingCount > 0 && <><i>•</i><span className="c-amber">{pendingCount} pending</span></>}
                    {appliedCount > 0 && <><i>•</i><span className="c-green">{appliedCount} applied</span></>}
                  </div>
                }
              />

              {allItems.length === 0 ? (
                <div className="empty-box">
                  <span className="empty-box-ico"><LayoutList size={20} /></span>
                  <div className="empty-box-title">No changes yet for this month</div>
                  <div className="empty-box-hint">
                    {editable
                      ? "Use “Add Another Change” to record joiners, revisions, exits, holds or one-time amounts."
                      : "This month is locked while your payroll team reviews it."}
                  </div>
                </div>
              ) : (
                <div className="item-list">
                  {orderedItems.map((it) => {
                    const Icon = TYPE_ICON[it.item_type] || FileText;
                    const pill = ITEM_STATUS_PILL[it.status] || { tone: "slate", label: it.status };
                    const PillIcon = pill.icon;
                    const open = openItemId === it.id;
                    const canEdit = editable && it.status !== "APPLIED";
                    return (
                      <div className={`item-card item-${it.status.toLowerCase()}`} key={it.id}>
                        <button
                          type="button"
                          className="item-row"
                          onClick={() => setOpenItemId(open ? null : it.id)}
                          aria-expanded={open}
                        >
                          <span className={`item-ico tone-${TYPE_TONE[it.item_type] || "blue"}`}>
                            <Icon size={17} />
                          </span>
                          <span className="item-main">
                            <span className="item-title">{TYPE_LABEL[it.item_type] || it.item_type}</span>
                            <span className="item-sub">{summary(it, employees)}</span>
                            {it.error && (
                              <span className="item-error"><AlertCircle size={13} /> {it.error}</span>
                            )}
                          </span>
                          <span className="item-right">
                            <Badge tone={pill.tone}>
                              {PillIcon && <PillIcon size={12} />} {pill.label}
                            </Badge>
                            {it.status === "FAILED" && canEdit && (
                              <span
                                role="button"
                                tabIndex={0}
                                className="btn btn-secondary btn-sm fix-btn"
                                onClick={(e) => { e.stopPropagation(); setAddingType(null); setEditingItem(it); }}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setEditingItem(it); } }}
                              >
                                Fix Details
                              </span>
                            )}
                            <ChevronRight size={17} className={`item-caret ${open ? "open" : ""}`} />
                          </span>
                        </button>

                        {open && (
                          <div className="item-detail">
                            <dl className="detail-grid">
                              {detailRows(it, employees).map((row) => (
                                <div className="detail-cell" key={row.key}>
                                  <dt>{row.label}</dt>
                                  <dd>{row.value}</dd>
                                </div>
                              ))}
                            </dl>
                            {canEdit && (
                              <div className="detail-actions">
                                <Button size="sm" variant="secondary" onClick={() => setEditingItem(it)}>
                                  <Pencil size={13} /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={removingId === it.id}
                                  onClick={() => removeItem(it)}
                                >
                                  <Trash2 size={13} /> {removingId === it.id ? "Removing…" : "Remove"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {notes && notes.trim() && (
                <div className="note-line">
                  <span className="note-line-ico"><Star size={14} /></span>
                  <span className="note-line-text">{notes.trim()}</span>
                  {editable && (
                    <button type="button" className="link-btn" onClick={() => setNoteOpen(true)}>Edit Note</button>
                  )}
                </div>
              )}
            </Card>

            {/* ── History ── */}
            <Card>
              <div className="sec-head">
                <h3 className="sec-title plain">History</h3>
                {events.length > 3 && (
                  <button className="link-btn" onClick={() => setShowHistory((v) => !v)}>
                    {showHistory ? "Show less" : "View all"}
                  </button>
                )}
              </div>

              {!hasUnsent && events.length === 0 ? (
                <p className="small muted" style={{ margin: "6px 0 2px" }}>
                  No activity yet for this month.
                </p>
              ) : (
                <div className="tl">
                  {editable && hasUnsent && (
                    <div className="tl-item">
                      <span className="tl-ico tone-slate"><Pencil size={15} /></span>
                      <span className="tl-date">Now</span>
                      <span className="tl-body">
                        <span className="tl-title">Draft in progress</span>
                        <span className="tl-meta">{fmtCount(pendingCount)} not yet submitted</span>
                      </span>
                      <Badge tone="slate">DRAFT</Badge>
                    </div>
                  )}
                  {visibleHistory.map((ev) => {
                    const Icon = EVENT_ICON[ev.event_type] || Clock;
                    const tone = EVENT_TONE[ev.event_type] || "slate";
                    return (
                      <div className="tl-item" key={ev.id}>
                        <span className={`tl-ico tone-${tone}`}><Icon size={15} /></span>
                        <span className="tl-date">{fmtDay(ev.created_at)}</span>
                        <span className="tl-body">
                          <span className="tl-title">{EVENT_TITLE[ev.event_type] || ev.event_type}</span>
                          <span className="tl-meta">
                            {fmtCount(ev.item_count)} &nbsp;•&nbsp; {fmtDate(ev.created_at)}
                            {ev.actor ? ` • by ${ev.actor}` : ""}
                          </span>
                          {ev.event_type === "REJECTED" && ev.note && (
                            <span className="tl-note">“{ev.note}”</span>
                          )}
                        </span>
                        <Badge tone={tone}>{EVENT_BADGE[ev.event_type] || ev.event_type}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          </div>
        </div>
      )}

      {/* ── Note modal ── */}
      {noteOpen && (
        <Modal
          title="Note for Payroll Team"
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

      {/* ── Add / edit item modal ── */}
      {formType && (() => {
        const FormIcon = TYPE_ICON[formType] || FileText;
        return (
        <Modal
          title={
            <span className="modal-title-row">
              <span className={`modal-title-ico tone-${TYPE_TONE[formType] || "blue"}`}>
                <FormIcon size={16} />
              </span>
              {`${editingItem ? "Edit" : "Add"} ${TYPE_LABEL[formType]}`}
            </span>
          }
          onClose={() => { setAddingType(null); setEditingItem(null); }}
          footer={
            <div className="modal-foot">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setAddingType(null); setEditingItem(null); }}
                disabled={savingItem}
              >
                Cancel
              </Button>
              <Button type="submit" form="portal-item-form" disabled={savingItem}>
                {savingItem ? "Saving…" : editingItem ? "Save Changes" : `Add ${TYPE_LABEL[formType]}`}
              </Button>
            </div>
          }
        >
          <ItemForm
            key={editingItem ? `edit-${editingItem.id}` : `add-${formType}`}
            type={formType}
            employees={employees}
            saving={savingItem}
            onSave={saveItem}
            initial={editingItem ? editingItem.payload : undefined}
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

      {/* ── Submit confirmation ── */}
      {confirmSubmit && (
        <Modal
          title="Submit this month for review?"
          onClose={() => setConfirmSubmit(false)}
          footer={
            <div className="modal-foot">
              <Button type="button" variant="secondary" onClick={() => setConfirmSubmit(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submitMonth} disabled={submitting}>
                {submitting ? "Submitting…" : "Yes, Submit"} <Send size={15} />
              </Button>
            </div>
          }
        >
          <p className="confirm-text">
            {fmtCount(pendingCount)} for <strong>{monthLabel(month, year)}</strong> will be sent to your
            payroll team. You won't be able to edit this month until it's approved or returned.
          </p>
        </Modal>
      )}
    </div>
  );
}
