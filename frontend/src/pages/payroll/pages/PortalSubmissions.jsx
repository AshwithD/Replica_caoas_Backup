import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock, FileText, Inbox, LayoutGrid, List, Loader2, Lock, Minus, Undo2,
  MessageSquareText, PauseCircle, Plus, Search, StickyNote, TrendingUp,
  UserMinus, UserPlus, Wallet, X,
} from "lucide-react";
import {
  Badge, Button, Card, ErrorState, Input, Modal, Skeleton, Textarea,
} from "../_kit/components/primitives";
import { api } from "../_kit/api/client";
import PageHero from "../_kit/components/PageHero";
import Breadcrumb from "../_kit/components/Breadcrumb";
import EmptyState from "../_kit/components/EmptyState";
import ClientLogo from "../_kit/components/ClientLogo";
import MonthYearPicker from "../_kit/components/MonthYearPicker";

const STATUS_TONES = { DRAFT: "slate", SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };
const ITEM_TONES = { PENDING: "slate", APPLIED: "green", SKIPPED: "blue", FAILED: "red" };

// Staff-facing wording for a month's state (the client sees friendlier copy).
const STATUS_META = {
  SUBMITTED: { label: "Awaiting review", icon: Clock, tone: "amber" },
  DRAFT: { label: "Draft (client editing)", icon: FileText, tone: "slate" },
  APPROVED: { label: "Approved", icon: CheckCircle2, tone: "green" },
  REJECTED: { label: "Returned to client", icon: AlertCircle, tone: "red" },
};

// One icon + colour per change type, shared by the list rows and the
// "add input from your side" tiles (mirrors the client portal).
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
const TYPE_WASH = {
  NEW_EMPLOYEE: { bg: "var(--blue-bg)", fg: "var(--blue-text)" },
  REVISION: { bg: "var(--purple-bg)", fg: "var(--purple-text)" },
  EXIT: { bg: "var(--red-bg)", fg: "var(--red-text)" },
  SALARY_HOLD: { bg: "var(--blue-bg)", fg: "var(--blue-text)" },
  ADVANCE: { bg: "var(--amber-bg)", fg: "var(--amber-text)" },
  ONE_TIME_EARNING: { bg: "var(--purple-bg)", fg: "var(--purple-text)" },
  ONE_TIME_DEDUCTION: { bg: "var(--red-bg)", fg: "var(--red-text)" },
  NOTE: { bg: "var(--amber-bg)", fg: "var(--amber-text)" },
};

const TONE_TEXT = {
  slate: "var(--text-primary)",
  amber: "var(--amber-text)",
  green: "var(--green-text)",
  red: "var(--red-text)",
  blue: "var(--blue-text)",
};

// A month whose payslips are already generated is closed on the client side
// (payroll/portal/locks.py). Staff still see everything, with a warning.
function LockChip({ lock }) {
  if (!lock?.locked) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: "var(--surface-5)", color: "var(--text-secondary)" }}
      title={lock.reason}
    >
      <Lock size={11} /> Payslips issued
    </span>
  );
}

const monthLabel = (m, y) =>
  `${new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", { month: "long" })} ${y}`;

function TypeIcon({ type, size = 34 }) {
  const Icon = TYPE_ICON[type] || FileText;
  const wash = TYPE_WASH[type] || { bg: "var(--surface-3)", fg: "var(--text-muted)" };
  return (
    <span
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{ width: size, height: size, background: wash.bg, color: wash.fg }}
    >
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
}));
const TYPE_LABELS = {
  NEW_EMPLOYEE: "New employee",
  REVISION: "Salary revision",
  EXIT: "Exit / resignation",
  SALARY_HOLD: "Salary hold",
  ADVANCE: "Advance / loan",
  ONE_TIME_EARNING: "One-time earning",
  ONE_TIME_DEDUCTION: "One-time deduction",
  NOTE: "Note",
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

const DEFAULT_PAYLOAD = {
  NEW_EMPLOYEE: { employee_code: "", first_name: "", last_name: "", ctc_annual: "", pf_opted: true, hire_date: "", email: "", pan_number: "", department: "", position: "" },
  REVISION: { employee_id: "", effective_from: "", ctc_annual: "", pf_opted: true, change_reason: "" },
  EXIT: { employee_id: "", last_working_date: "" },
  SALARY_HOLD: { employee_id: "", amount: "", release_month: "", release_year: "", reason: "" },
  ADVANCE: { employee_id: "", total_amount: "", tenure_months: "", label: "" },
  ONE_TIME_EARNING: { employee_id: "", amount: "", description: "" },
  ONE_TIME_DEDUCTION: { employee_id: "", amount: "", description: "" },
  NOTE: { text: "" },
};

function useSubmissions() {
  const [state, setState] = useState({ data: undefined, isLoading: true, isError: false });
  const load = () => {
    setState((s) => ({ ...s, isLoading: true, isError: false }));
    api.get("payroll/portal-submissions/")
      .then((res) => setState({ data: res.data, isLoading: false, isError: false }))
      .catch(() => setState({ data: undefined, isLoading: false, isError: true }));
  };
  useEffect(load, []);
  return { ...state, refetch: load };
}

// `api.get()` resolves to the full axios response, not the payload — so
// unwrap a response object first (d.data), then a plain array, then a
// paginated { results } shape. Without this, the staff item forms showed an
// empty Employee dropdown (and "No items yet") even when data existed.
const unwrapList = (d) => {
  const data = d && typeof d === "object" && "data" in d ? d.data : d;
  return Array.isArray(data) ? data : data?.results || [];
};
const fmt = (n) => new Intl.NumberFormat("en-IN").format(Number(n || 0));

function payloadSummary(item, employees = []) {
  const p = item.payload || {};
  const bits = [];
  if (p.employee_code) bits.push(p.employee_code);
  if (p.first_name) bits.push([p.first_name, p.last_name].filter(Boolean).join(" "));
  if (p.employee_id) {
    // Resolve the employee so staff can see at a glance WHO a change is for.
    const emp = employees.find((e) => String(e.id) === String(p.employee_id));
    if (emp) {
      const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim();
      bits.push(name ? `${emp.employee_code} — ${name}` : emp.employee_code || `Employee #${p.employee_id}`);
    } else {
      bits.push(`Employee #${p.employee_id}`);
    }
  }
  if (p.ctc_annual) bits.push(`CTC ₹${fmt(p.ctc_annual)}`);
  if (p.effective_from) bits.push(`from ${p.effective_from}`);
  if (p.last_working_date) bits.push(`LWD ${p.last_working_date}`);
  if (p.total_amount) bits.push(`₹${fmt(p.total_amount)} / ${p.tenure_months}mo`);
  if (p.amount) bits.push(`₹${fmt(p.amount)}`);
  if (p.release_month && p.release_year) {
    const m = MONTHS.find((x) => String(x.value) === String(p.release_month));
    bits.push(`release ${m ? m.label : p.release_month} ${p.release_year}`);
  }
  if (p.text) bits.push(p.text);
  if (p.description) bits.push(`(${p.description})`);
  return bits.join(" · ") || "—";
}

function normalizePayload(p) {
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

function StaffItemForm({ type, employees, onCancel, onSave, saving, releaseDefault }) {
  const [p, setP] = useState(() => {
    const base = { ...DEFAULT_PAYLOAD[type] };
    if (type === "SALARY_HOLD" && releaseDefault) {
      base.release_month = String(releaseDefault.month);
      base.release_year = String(releaseDefault.year);
    }
    return base;
  });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const empOptions = employees.map((e) => ({ value: String(e.id), label: `${e.employee_code} — ${e.full_name || e.first_name || ""}`.trim() }));

  const field = (label, node) => (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {node}
    </div>
  );
  const num = (label, key, hint) => field(label, <Input type="number" step="any" min="0" value={p[key]} onChange={(e) => set(key, e.target.value)} />);

  return (
    <div className="rounded-lg p-3" style={{ background: "var(--surface-2)", border: "1px dashed var(--border-3)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
          {TYPE_LABELS[type] || type}
        </span>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {type === "NEW_EMPLOYEE" && (
          <>
            {field("Employee Code *", <Input value={p.employee_code} onChange={(e) => set("employee_code", e.target.value)} />)}
            {field("First Name *", <Input value={p.first_name} onChange={(e) => set("first_name", e.target.value)} />)}
            {field("Last Name", <Input value={p.last_name} onChange={(e) => set("last_name", e.target.value)} />)}
            {num("Annual CTC *", "ctc_annual")}
            {field("Hire Date", <Input type="date" value={p.hire_date} onChange={(e) => set("hire_date", e.target.value)} />)}
            {field("Email", <Input type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />)}
            {field("PAN", <Input value={p.pan_number} onChange={(e) => set("pan_number", e.target.value)} />)}
            {field("Department", <Input value={p.department} onChange={(e) => set("department", e.target.value)} />)}
            {field("Position", <Input value={p.position} onChange={(e) => set("position", e.target.value)} />)}
          </>
        )}

        {type === "REVISION" && (
          <>
            {field("Employee *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)}><option value="">Select…</option>{empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
            {field("Effective From *", <Input type="date" value={p.effective_from} onChange={(e) => set("effective_from", e.target.value)} />)}
            {num("Revised Annual CTC *", "ctc_annual")}
            {field("Reason", <Input value={p.change_reason} onChange={(e) => set("change_reason", e.target.value)} />)}
          </>
        )}

        {type === "EXIT" && (
          <>
            {field("Employee *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)}><option value="">Select…</option>{empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
            {field("Last Working Date *", <Input type="date" value={p.last_working_date} onChange={(e) => set("last_working_date", e.target.value)} />)}
          </>
        )}

        {type === "SALARY_HOLD" && (
          <>
            {field("Employee *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)}><option value="">Select…</option>{empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
            {num("Amount to Hold *", "amount")}
            {field("Release Month *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.release_month} onChange={(e) => set("release_month", e.target.value)}><option value="">Select…</option>{MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select>)}
            {field("Release Year *", <Input type="number" min="2000" max="2200" value={p.release_year} onChange={(e) => set("release_year", e.target.value)} />)}
            {field("Reason", <Input value={p.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Notice period / incomplete handover" />)}
          </>
        )}

        {type === "ADVANCE" && (
          <>
            {field("Employee *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)}><option value="">Select…</option>{empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
            {num("Total Amount *", "total_amount")}
            {num("Tenure (months) *", "tenure_months")}
            {field("Label", <Input value={p.label} onChange={(e) => set("label", e.target.value)} placeholder="Soft loan / Salary advance" />)}
          </>
        )}

        {(type === "ONE_TIME_EARNING" || type === "ONE_TIME_DEDUCTION") && (
          <>
            {field("Employee *", <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }} value={p.employee_id} onChange={(e) => set("employee_id", e.target.value)}><option value="">Select…</option>{empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
            {num("Amount *", "amount")}
            {field("Description", <Input value={p.description} onChange={(e) => set("description", e.target.value)} />)}
          </>
        )}

        {type === "NOTE" && (
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Note / instruction *", <Textarea rows={2} value={p.text} onChange={(e) => set("text", e.target.value)} />)}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-3">
        <Button size="sm" disabled={saving} onClick={() => onSave(type, normalizePayload(p))}>
          {saving ? "Adding…" : "Add & Apply"}
        </Button>
      </div>
    </div>
  );
}

function SubmissionDetail({ submission, onClose, onChanged, onProceeded }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [existingBatchId, setExistingBatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null); // "approve" | "reject" | "apply" | "proceed"
  const [error, setError] = useState("");
  const [addingType, setAddingType] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const its = await api.get(`payroll/portal-submissions/${submission.id}/items/`);
      setItems(unwrapList(its));
    } catch { setItems([]); }
    try {
      const emps = await api.get("payroll/employees/", { params: { client: submission.client } });
      setEmployees(unwrapList(emps));
    } catch { setEmployees([]); }
    try {
      const batches = await api.get("payroll/batches/", { params: { year: submission.year } });
      const match = unwrapList(batches).find(
        (b) => String(b.client) === String(submission.client) && Number(b.month) === Number(submission.month)
      );
      setExistingBatchId(match ? match.id : null);
    } catch { setExistingBatchId(null); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [submission.id, submission.client, submission.month, submission.year]);

  const refreshItems = async () => {
    const its = await api.get(`payroll/portal-submissions/${submission.id}/items/`);
    setItems(unwrapList(its));
  };

  const approve = async () => {
    setBusy("approve"); setError("");
    try {
      const res = await api.post(`payroll/portal-submissions/${submission.id}/approve/`);
      onChanged(res.data);
      await refreshItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Approval failed.");
    } finally { setBusy(null); }
  };

  // A month reopens to DRAFT after every approval, so items added afterwards
  // (by the client, or emailed in) sit PENDING with no Approve button — this
  // applies them without waiting for the client to resubmit.
  const applyPending = async () => {
    setBusy("apply"); setError("");
    try {
      const res = await api.post(`payroll/portal-submissions/${submission.id}/apply-pending/`);
      onChanged(res.data);
      await refreshItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not apply the pending changes.");
    } finally { setBusy(null); }
  };

  // One change at a time: on a month that holds a mix of good and bad input,
  // bulk-applying is what pushes the wrong values through. Apply the correct
  // ones, skip the rest.
  const applyItem = async (item) => {
    setBusy(`item-${item.id}`); setError("");
    try {
      const res = await api.post(`payroll/portal-submissions/${submission.id}/items/${item.id}/apply/`);
      if (res.data?.submission) onChanged(res.data);
      await refreshItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not apply that change.");
      await refreshItems();
    } finally { setBusy(null); }
  };

  const skipItem = async (item) => {
    const reason = window.prompt(
      "Skip this change so it stops queueing for payroll.\nOptional note (why):",
      "",
    );
    if (reason === null) return; // cancelled
    setBusy(`item-${item.id}`); setError("");
    try {
      await api.post(`payroll/portal-submissions/${submission.id}/items/${item.id}/skip/`, { reason });
      await refreshItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not skip that change.");
    } finally { setBusy(null); }
  };

  const reject = async () => {
    setBusy("reject"); setError("");
    try {
      const res = await api.post(`payroll/portal-submissions/${submission.id}/reject/`, { reason });
      onChanged(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Rejection failed.");
    } finally { setBusy(null); }
  };

  const addStaffItem = async (type, payload) => {
    setSavingItem(true); setError("");
    try {
      const res = await api.post(`payroll/portal-submissions/${submission.id}/add-item/`, { item_type: type, payload });
      if (res.data.applied === false) {
        setError(`Item saved but not applied: ${res.data.item?.error || "see item for details"}`);
      }
      setAddingType(null);
      await refreshItems();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.payload?.[0] || "Failed to add item.");
    } finally { setSavingItem(false); }
  };

  const proceed = async () => {
    setBusy("proceed"); setError("");
    try {
      const res = await api.post("payroll/batches/generate-from-portal/", {
        client_id: submission.client, month: submission.month, year: submission.year,
      });
      onProceeded?.(res.data.batch?.id);
      navigate(`/payroll/batches/${res.data.batch?.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to generate the batch.");
      setBusy(null);
    }
  };

  const isSubmitted = submission.status === "SUBMITTED";
  // A returned month must NOT offer "apply pending": you sent it back because
  // the values were wrong, so applying the same items would push that wrong
  // data into payroll. It waits for the client's corrected resubmission.
  const isRejected = submission.status === "REJECTED";
  const pendingItems = (items || []).filter((it) => it.status !== "APPLIED");
  const pendingCount = pendingItems.length;
  const summary = submission._last_summary;

  const meta = STATUS_META[submission.status] || STATUS_META.DRAFT;
  const StatusIcon = meta.icon;
  const appliedCount = (items || []).length - pendingCount;

  const title = (
    <span className="flex items-center gap-3 min-w-0">
      {/* the client's own logo, so staff always know whose month this is */}
      <ClientLogo name={submission.client_name} logo={submission.client_logo} size={38} />
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold" style={{ color: "var(--text-strong)" }}>
          {submission.client_name || `Client #${submission.client}`}
        </span>
        <span className="block text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {monthLabel(submission.month, submission.year)} · monthly input
        </span>
      </span>
    </span>
  );

  return (
    <Modal title={title} onClose={onClose} size="l">
      <div className="space-y-4">
        {/* ── status strip ─────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-3 py-2.5"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: TONE_TEXT[meta.tone] }}>
            <StatusIcon size={15} /> {meta.label}
          </span>
          {!loading && items && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {items.length} item{items.length === 1 ? "" : "s"}
              {pendingCount > 0 ? ` · ${pendingCount} pending` : appliedCount > 0 ? " · all applied" : ""}
            </span>
          )}
          {submission.submitted_at && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Submitted {new Date(submission.submitted_at).toLocaleString()}
            </span>
          )}
          {submission.approved_at && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green-text)" }}>
              <Check size={12} /> approved {new Date(submission.approved_at).toLocaleString()}
            </span>
          )}
        </div>

        {submission.payroll_lock?.locked && (
          <div
            className="flex gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-border)" }}
          >
            <Lock size={15} style={{ color: "var(--red-text)", flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: "var(--red-text)" }}>
              <b>Month closed — {submission.payroll_lock.reason}</b>
              <br />
              The client can no longer add or edit changes here. Anything you apply
              now will <b>not</b> appear on the payslips already generated — correct the
              batch and regenerate/resend it from Batch Review.
            </p>
          </div>
        )}

        {submission.notes && (
          <div className="flex gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--amber-bg-subtle)", border: "1px solid var(--amber-border)" }}>
            <StickyNote size={15} style={{ color: "var(--amber-text)", flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{submission.notes}</p>
          </div>
        )}
        {submission.rejection_reason && (
          <div className="flex gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-border)" }}>
            <AlertCircle size={15} style={{ color: "var(--red-text)", flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: "var(--red-text)" }}>
              <b>Returned to client:</b> {submission.rejection_reason}
            </p>
          </div>
        )}
        {summary && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last approval → applied {summary.applied}, failed {summary.failed}, skipped {summary.skipped}
          </p>
        )}

        {/* ── data already present ─────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-3)" }}>
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-3)" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Changes in this month
            </span>
            {!loading && items && items.length > 0 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {appliedCount} applied · {pendingCount} pending
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-4"><Skeleton className="h-32" /></div>
          ) : !items || items.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nothing submitted yet for this month.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-2)" }}>
              {items.map((it) => {
                const isNote = it.item_type === "NOTE";
                return (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={isNote ? { background: "var(--amber-bg-subtle)" } : undefined}
                  >
                    <TypeIcon type={it.item_type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
                          {TYPE_LABELS[it.item_type] || it.item_type}
                        </span>
                        <Badge tone={ITEM_TONES[it.status] || "slate"}>{it.status}</Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: isNote ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                        {payloadSummary(it, employees)}
                      </p>
                      {it.error && (
                        <p
                          className="flex items-center gap-1 text-xs mt-1"
                          style={{ color: it.status === "SKIPPED" ? "var(--text-muted)" : "var(--red-text)" }}
                        >
                          <AlertCircle size={12} /> {it.error}
                        </p>
                      )}
                    </div>

                    {/* Per-item control — the safe alternative to a blanket
                        "apply everything" on a month with mixed input. */}
                    {!isSubmitted && it.status !== "APPLIED" && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        {!isRejected && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === `item-${it.id}`}
                            onClick={() => applyItem(it)}
                            title="Apply just this change"
                            style={{ color: "var(--green-text)", borderColor: "var(--green-border)" }}
                          >
                            {busy === `item-${it.id}`
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Check size={13} />}
                            Apply
                          </Button>
                        )}
                        {it.status !== "SKIPPED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === `item-${it.id}`}
                            onClick={() => skipItem(it)}
                            title="Dismiss this change — it will never be applied"
                          >
                            <X size={13} /> Skip
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        {/* ── approve / reject (when client submitted) ─────────────────── */}
        {isSubmitted && (
          <div
            className="flex flex-wrap items-end gap-2 rounded-xl p-3"
            style={{ background: "var(--amber-bg-subtle)", border: "1px solid var(--amber-border)" }}
          >
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Reject reason
              </label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why it's sent back (optional)" />
            </div>
            <Button variant="secondary" disabled={busy === "reject"} onClick={reject}>
              <X size={14} /> Reject
            </Button>
            <Button disabled={busy === "approve"} onClick={approve} style={{ background: "var(--green-text)" }}>
              <Check size={14} /> Approve & Apply
            </Button>
          </div>
        )}

        {/* ── apply what the client hasn't resubmitted ─────────────────── */}
        {/* Returned months get an explanation instead of an Apply button. */}
        {isRejected && pendingCount > 0 && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-xl p-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}
          >
            <Undo2 size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <p className="text-xs flex-1 min-w-[220px]" style={{ color: "var(--text-secondary)" }}>
              You returned this month{submission.rejection_reason ? ` — "${submission.rejection_reason}"` : ""}.
              The {pendingCount} change{pendingCount === 1 ? "" : "s"} below stay as they are until the client
              corrects and resubmits — applying them now would push the same wrong values into payroll.
              Use <b>Skip</b> on anything that should never be applied.
            </p>
          </div>
        )}

        {!isSubmitted && !isRejected && pendingCount > 0 && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-xl p-3"
            style={{ background: "var(--green-bg-subtle)", border: "1px solid var(--green-border)" }}
          >
            <p className="text-xs flex-1 min-w-[220px]" style={{ color: "var(--text-secondary)" }}>
              {pendingCount} item{pendingCount === 1 ? "" : "s"} not applied yet. This month is{" "}
              <b>{submission.status}</b> — it reopens after every approval, so the client hasn't
              (re)submitted these. You can apply them now.
            </p>
            <Button
              disabled={busy === "apply"}
              onClick={applyPending}
              style={{ background: "var(--green-text)" }}
            >
              {busy === "apply" ? (
                <><Loader2 size={14} className="animate-spin" /> Applying…</>
              ) : (
                <><Check size={14} /> Apply {pendingCount} pending change{pendingCount === 1 ? "" : "s"}</>
              )}
            </Button>
          </div>
        )}

        {/* ── add input from your side ─────────────────────────────────── */}
        <div className="pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Add input from your side (client emailed a change you're keying in)
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4">
            {ITEM_TYPES.map((t) => {
              const active = addingType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setAddingType(active ? null : t.key)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors"
                  style={{
                    background: active ? "var(--blue-bg)" : "var(--surface-1)",
                    border: `1px solid ${active ? "var(--blue-border)" : "var(--border-3)"}`,
                    boxShadow: active ? "0 0 0 1px var(--blue-border)" : "none",
                  }}
                >
                  <TypeIcon type={t.key} size={28} />
                  <span className="text-xs font-medium leading-tight" style={{ color: "var(--text-primary)" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          {addingType && (
            <StaffItemForm
              type={addingType}
              employees={employees}
              saving={savingItem}
              onCancel={() => setAddingType(null)}
              onSave={addStaffItem}
              releaseDefault={{
                month: submission.month === 12 ? 1 : submission.month + 1,
                year: submission.month === 12 ? submission.year + 1 : submission.year,
              }}
            />
          )}
        </div>

        {/* ── proceed to batch ─────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {existingBatchId ? (
            <Button onClick={() => navigate(`/payroll/batches/${existingBatchId}`)}>
              Open Batch Review <ArrowRight size={14} />
            </Button>
          ) : (
            <Button disabled={busy === "proceed"} onClick={proceed} style={{ background: "#1d4ed8" }}>
              {busy === "proceed" ? (<><Loader2 size={14} className="animate-spin" /> Generating…</>) : (<>Proceed → Batch Review <ArrowRight size={14} /></>)}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function StatTile({ icon: Icon, label, value, tone = "slate", active, onClick }) {
  const text = TONE_TEXT[tone] || TONE_TEXT.slate;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
      style={{
        background: active ? "var(--surface-2)" : "var(--surface-1)",
        border: `1px solid ${active ? "var(--border-5)" : "var(--border-3)"}`,
        boxShadow: active ? "var(--shadow-md)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
      aria-pressed={active ? "true" : "false"}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{ background: tone === "slate" ? "var(--surface-3)" : `var(--${tone}-bg)`, color: text }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-none" style={{ color: "var(--text-strong)" }}>{value}</span>
        <span className="block text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>{label}</span>
      </span>
    </button>
  );
}

function SubmissionCard({ s, onOpen }) {
  const meta = STATUS_META[s.status] || STATUS_META.DRAFT;
  const StatusIcon = meta.icon;
  const pending = Number(s.pending_item_count || 0);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition-shadow hover:shadow-md"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}
    >
      <div className="flex items-start gap-3">
        {/* real client logo — initials fallback while a client has none */}
        <ClientLogo name={s.client_name} logo={s.client_logo} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
            {s.client_name || `Client #${s.client}`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {monthLabel(s.month, s.year)}
          </p>
        </div>
        <Badge tone={meta.tone}>
          <StatusIcon size={11} /> {meta.label}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
        >
          {s.item_count} change{s.item_count === 1 ? "" : "s"}
        </span>
        {pending > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "var(--amber-bg-strong)", color: "var(--amber-text-strong)" }}
          >
            {pending} pending
          </span>
        )}
        {s.approved_at && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green-text)" }}>
            <Check size={12} /> last approved {new Date(s.approved_at).toLocaleDateString()}
          </span>
        )}
        <LockChip lock={s.payroll_lock} />
      </div>

      {s.note_preview && (
        <p
          className="flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
          style={{ background: "var(--amber-bg-subtle)", color: "var(--amber-text-strong)" }}
          title={s.note_preview}
        >
          <StickyNote size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {s.note_preview}
          </span>
        </p>
      )}

      <span
        className="mt-auto flex items-center justify-between pt-2 text-xs font-medium"
        style={{ borderTop: "1px solid var(--border-2)", color: "var(--text-secondary)" }}
      >
        {s.submitted_at ? `Submitted ${new Date(s.submitted_at).toLocaleDateString()}` : "Not submitted yet"}
        <span className="flex items-center gap-1" style={{ color: "var(--blue-text)" }}>
          Review <ChevronRight size={13} />
        </span>
      </span>
    </button>
  );
}

function SubmissionRow({ s, onOpen }) {
  const meta = STATUS_META[s.status] || STATUS_META.DRAFT;
  const StatusIcon = meta.icon;
  const pending = Number(s.pending_item_count || 0);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* real client logo — initials fallback while a client has none */}
      <ClientLogo name={s.client_name} logo={s.client_logo} size={38} />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
            {s.client_name || `Client #${s.client}`}
          </span>
          <Badge tone={meta.tone}>
            <StatusIcon size={11} /> {meta.label}
          </Badge>
          {pending > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: "var(--amber-bg-strong)", color: "var(--amber-text-strong)" }}
            >
              {pending} pending
            </span>
          )}
          <LockChip lock={s.payroll_lock} />
        </span>
        <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-muted)" }}>
          {monthLabel(s.month, s.year)} · {s.item_count} change{s.item_count === 1 ? "" : "s"}
          {s.submitted_at ? ` · submitted ${new Date(s.submitted_at).toLocaleDateString()}` : ""}
          {s.approved_at ? ` · last approved ${new Date(s.approved_at).toLocaleDateString()}` : ""}
        </span>
        {s.note_preview && (
          <span
            className="mt-1 flex items-start gap-1.5 text-xs"
            style={{ color: "var(--amber-text-strong)" }}
            title={s.note_preview}
          >
            <StickyNote size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            <span className="truncate">{s.note_preview}</span>
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: "var(--blue-text)" }}>
        Review <ChevronRight size={14} />
      </span>
    </button>
  );
}

// Month scope selector — mirrors the client portal's picker so both sides of
// the portal are driven the same way.
function MonthScope({ period, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }}
      >
        <CalendarDays size={15} style={{ color: "var(--text-muted)" }} />
        {period ? monthLabel(period.month, period.year) : "All months"}
        <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 60 }} onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 rounded-xl p-2"
            style={{
              zIndex: 61, minWidth: 260, background: "var(--surface-1)",
              border: "1px solid var(--border-3)", boxShadow: "var(--shadow-xl)",
            }}
          >
            <MonthYearPicker
              month={period ? Number(period.month) : now.getMonth() + 1}
              year={period ? Number(period.year) : now.getFullYear()}
              onChange={(m, y) => { onChange({ month: m, year: y }); setOpen(false); }}
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm" variant="secondary" className="flex-1"
                onClick={() => { onChange({ month: now.getMonth() + 1, year: now.getFullYear() }); setOpen(false); }}
              >
                This month
              </Button>
              <Button
                size="sm" variant={period ? "secondary" : "primary"} className="flex-1"
                onClick={() => { onClear(); setOpen(false); }}
              >
                All months
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  const opt = (key, Icon, label) => {
    const active = view === key;
    return (
      <button
        key={key}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active ? "true" : "false"}
        onClick={() => onChange(key)}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
        style={{
          background: active ? "var(--surface-1)" : "transparent",
          color: active ? "var(--text-strong)" : "var(--text-muted)",
          boxShadow: active ? "var(--shadow-md)" : "none",
        }}
      >
        <Icon size={16} />
      </button>
    );
  };
  return (
    <div
      className="flex items-center gap-1 rounded-lg p-1"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
    >
      {opt("list", List, "List view")}
      {opt("grid", LayoutGrid, "Grid view")}
    </div>
  );
}

const VIEW_KEY = "payroll.portalSubmissions.view";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Awaiting review" },
  { key: "DRAFT", label: "Drafts" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Returned" },
];

export default function PortalSubmissions() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSubmissions();
  const list = unwrapList(data);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  // Default scope = the month staff are actually working on. `null` = every
  // month (chosen from the picker).
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  // List is the default view; the choice is remembered per browser.
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list"; }
    catch { return "list"; }
  });
  const setViewPersisted = (v) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ }
  };

  const onChanged = (res) => {
    const sub = res.submission || res;
    setSelected((s) => (s ? { ...s, ...sub, _last_summary: res.summary } : s));
    refetch();
  };

  const inScope = useMemo(() => {
    if (!period) return list;
    return list.filter(
      (s) => Number(s.month) === Number(period.month) && Number(s.year) === Number(period.year),
    );
  }, [list, period]);

  // How many months are hidden by the scope — shown as a nudge so nobody
  // thinks a submission disappeared.
  const outOfScope = list.length - inScope.length;

  const counts = useMemo(() => {
    const c = { ALL: inScope.length, SUBMITTED: 0, DRAFT: 0, APPROVED: 0, REJECTED: 0, pending: 0 };
    inScope.forEach((s) => {
      if (c[s.status] !== undefined) c[s.status] += 1;
      c.pending += Number(s.pending_item_count || 0);
    });
    return c;
  }, [inScope]);

  // Newest month first, and anything awaiting review floats to the top —
  // that's the queue staff actually work from.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inScope
      .filter((s) => (filter === "ALL" ? true : s.status === filter))
      .filter((s) => (q ? String(s.client_name || `Client #${s.client}`).toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const pri = (s) => (s.status === "SUBMITTED" ? 0 : 1);
        if (pri(a) !== pri(b)) return pri(a) - pri(b);
        return (b.year - a.year) || (b.month - a.month);
      });
  }, [inScope, filter, query]);

  const toggle = (key) => setFilter((f) => (f === key ? "ALL" : key));

  return (
    <div className="payroll-scope p-4 space-y-6">
      <Breadcrumb items={[
        { label: "🏦 Payroll" },
        { label: "Dashboard", onClick: () => navigate("/payroll") },
        { label: "Portal Submissions" },
      ]} />
      <PageHero
        eyebrow="Client Portal"
        title="Submissions"
        subtitle={`Review a client's monthly input, add any changes they emailed you, then Proceed straight to Batch Review — no Excel upload needed. Showing ${period ? monthLabel(period.month, period.year) : "every month"}.`}
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <ErrorState message="Failed to load submissions." onRetry={refetch} />
      ) : list.length === 0 ? (
        <Card className="p-5">
          <EmptyState emoji="📥" message="No submissions yet. Clients see this screen once they submit their first month." />
        </Card>
      ) : (
        <>
          {/* ── at-a-glance queue ─────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={Clock} tone="amber" label="Awaiting your review" value={counts.SUBMITTED}
              active={filter === "SUBMITTED"} onClick={() => toggle("SUBMITTED")}
            />
            <StatTile
              icon={AlertCircle} tone="blue" label="Changes not applied yet" value={counts.pending}
            />
            <StatTile
              icon={CheckCircle2} tone="green" label="Approved months" value={counts.APPROVED}
              active={filter === "APPROVED"} onClick={() => toggle("APPROVED")}
            />
            <StatTile
              icon={Inbox} tone="slate"
              label={period ? "Clients this month" : "Months in the portal"}
              value={counts.ALL}
              active={filter === "ALL"} onClick={() => setFilter("ALL")}
            />
          </div>

          {/* ── filters + search ──────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: active ? "#001F5B" : "var(--surface-1)",
                    color: active ? "var(--text-white)" : "var(--text-secondary)",
                    border: `1px solid ${active ? "#001F5B" : "var(--border-3)"}`,
                  }}
                >
                  {f.label}
                  <span style={{ opacity: 0.7 }}> · {f.key === "ALL" ? counts.ALL : counts[f.key]}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative" style={{ minWidth: 200 }}>
                <Search
                  size={14}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search client…"
                  style={{ paddingLeft: 30 }}
                />
              </div>
              <MonthScope period={period} onChange={setPeriod} onClear={() => setPeriod(null)} />
              <ViewToggle view={view} onChange={setViewPersisted} />
            </div>
          </div>

          {/* ── the queue ─────────────────────────────────────────────── */}
          {visible.length === 0 ? (
            <Card className="p-5">
              <EmptyState
                emoji={period ? "🗓️" : "🔍"}
                message={
                  period
                    ? `No submissions for ${monthLabel(period.month, period.year)}${filter === "ALL" && !query.trim() ? "" : " matching this filter"}.`
                    : "No submissions match this filter."
                }
              />
              {period && outOfScope > 0 && (
                <div className="flex justify-center pt-3">
                  <Button variant="secondary" size="sm" onClick={() => setPeriod(null)}>
                    <CalendarDays size={14} /> Show all months ({outOfScope} other{outOfScope === 1 ? "" : "s"})
                  </Button>
                </div>
              )}
            </Card>
          ) : view === "grid" ? (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {visible.map((s) => (
                <SubmissionCard key={s.id} s={s} onOpen={() => setSelected(s)} />
              ))}
            </div>
          ) : (
            <Card className="divide-y overflow-hidden" style={{ borderColor: "var(--border-2)", padding: 0 }}>
              {visible.map((s) => (
                <SubmissionRow key={s.id} s={s} onOpen={() => setSelected(s)} />
              ))}
            </Card>
          )}

          {period && outOfScope > 0 && visible.length > 0 && (
            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              {outOfScope} submission{outOfScope === 1 ? "" : "s"} in other months are hidden ·{" "}
              <button
                type="button"
                onClick={() => setPeriod(null)}
                style={{ color: "var(--blue-text)", fontWeight: 600 }}
              >
                show all months
              </button>
            </p>
          )}
        </>
      )}

      {selected && (
        <SubmissionDetail
          submission={selected}
          onClose={() => setSelected(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
