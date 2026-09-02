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
  // the Payroll Month picker if needed.
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

  // History = the month's round log (submitted/approved/rejected events),
  // newest first — the backend records one event per submit/approve/reject.
  const events = current?.history || [];

  const EVENT_TITLE = {
    SUBMITTED: "Submitted for review",
    APPROVED: "Approved and applied",
    REJECTED: "Returned for changes",
  };
  const EVENT_TONE = { SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };

  // Hero chip counts.
  const byStatus = {
    DRAFT: current && current.status === "DRAFT" ? 1 : 0,
    SUBMITTED: current && current.status === "SUBMITTED" ? 1 : 0,
    APPROVED: events.filter((e) => e.event_type === "APPROVED").length,
  };

  // A "Draft in progress" row only when the month is open with un-submitted
  // changes — submitted/approved/rejected rounds come from the event log.
  const hasPending = (items || []).some((it) => it.status === "PENDING" || it.status === "FAILED");
  const showDraftRow = current && current.status === "DRAFT" && hasPending;

  const visibleHistory = showHistory ? events : events.slice(0, 4);

  return (
    <div>
      {/* ── Hero ── */}
      <div className="hero">
        <div>
          <h1 className="page-title">Monthly Payroll Input</h1>
          <p className="page-sub">Record this month's changes and submit when your payroll team approves.</p>
        </div>
        <div className="hero-statuses">
          {["DRAFT", "SUBMITTED", "APPROVED"].map((st) => (
            <span className="hero-chip" key={st}>
              <span className={`dot dot-${st.toLowerCase()}`} />
              {STATUS_LABEL[st]} <b>{byStatus[st]}</b>
            </span>
          ))}
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="mi-grid">
        {/* ── Left column ── */}
        <div className="mi-left">
          <Card className="mb-16">
            <h3 className="section-title">Payroll Month</h3>
            <div className="monthpicker">
              <button
                type="button"
                className="monthpicker-trigger"
                onClick={() => setPickerOpen((o) => !o)}
              >
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
          </Card>

          <Card>
            <div className="row between">
              <h3 className="section-title" style={{ margin: 0 }}>Month Overview</h3>
              <div className="overview-actions">
                {current && (
                  <div className="chips">
                    <span className={`chip chip-status-${current.status}`}>
                      {STATUS_LABEL[current.status] || current.status}
                    </span>
                    <span className="chip">{items ? items.length : 0} items</span>
                  </div>
                )}
                {current && (items || []).length > 0 && (
                  <Button size="sm" variant="secondary" onClick={exportCSV}>
                    ⬇ Export
                  </Button>
                )}
              </div>
            </div>

            {loading && (
              <div className="center" style={{ padding: 32 }}><Spinner /></div>
            )}

            {!current && !loading && (
              <EmptyState
                title="Pick a month to begin"
                hint="Choose the payroll month and year, and the month opens here."
              />
            )}

            {current && !loading && (
              <>
                {current.status === "SUBMITTED" && (
                  <div className="overview-banner pending">
                    Changes pending — you can continue adding items and resubmit for this month.
                  </div>
                )}
                {current.status === "APPROVED" && (
                  <div className="overview-banner approved">
                    Latest changes approved and applied{current.approved_at ? ` on ${fmtDate(current.approved_at)}` : ""}.
                    You can add new changes and resubmit for the same month.
                  </div>
                )}
                {current.status === "REJECTED" && (
                  <div className="overview-banner rejected">
                    Returned by payroll team{current.rejection_reason ? `: ${current.rejection_reason}` : ""}.
                    Fix the items below and resubmit.
                  </div>
                )}

                <h4 className="items-title">
                  Changes ({items ? items.length : 0})
                  <span className="items-title-sub"> — {monthLabel(current.month, current.year)}</span>
                </h4>

                <div className="grid" style={{ gap: 10 }}>
                  {(items || []).map((it) => (
                    <div className="item-row" key={it.id}>
                      <div className="item-main">
                        <div className="row">
                          <span className="item-title">
                            {(ITEM_TYPES.find((t) => t.key === it.item_type)?.icon || "") + " "}
                            {TYPE_LABEL[it.item_type] || it.item_type}
                          </span>
                          <Badge tone={it.status === "APPLIED" ? "green" : it.status === "FAILED" ? "red" : "slate"}>
                            {it.status}
                          </Badge>
                        </div>
                        <div className="item-sub">{summary(it, employees)}</div>
                        {it.error && <div className="small" style={{ color: "var(--red)", marginTop: 4 }}>{it.error}</div>}
                      </div>
                    </div>
                  ))}
                  {(!items || items.length === 0) && (
                    <div className="empty-box">No changes yet — add one below.</div>
                  )}
                </div>

                {notes && notes.trim() && (
                  <div className="note-line" onClick={() => setNoteOpen(true)}>
                    <span className="note-line-icon">📝</span>
                    <span className="note-line-text">{notes.trim()}</span>
                    <span className="link-btn">Edit</span>
                  </div>
                )}

                {editable && (
                  <>
                    <h4 className="items-title mt-16">Add Change</h4>
                    <p className="addchange-hint">Choose the type of change you want to add.</p>
                    <div className="type-grid">
                      {ADDABLE_TYPES.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          className="type-btn"
                          onClick={() => setAddingType(t.key)}
                        >
                          <span>{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="type-btn"
                        onClick={() => setNoteOpen(true)}
                      >
                        <span>📝</span>
                        Note
                      </button>
                    </div>
                  </>
                )}

                {editable && (items || []).length > 0 && (
                  <div className="row mt-16" style={{ justifyContent: "flex-end" }}>
                    <Button onClick={submitMonth} disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit for Review"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="mi-right">
          <Card className="mb-16">
            <div className="row between">
              <h3 className="section-title" style={{ margin: 0 }}>History</h3>
              {events.length > 4 && (
                <button className="link-btn" onClick={() => setShowHistory((v) => !v)}>
                  {showHistory ? "Show less" : "View All History"}
                </button>
              )}
            </div>
            {!showDraftRow && events.length === 0 ? (
              <p className="small muted" style={{ margin: "12px 0 4px" }}>No rounds for this month yet.</p>
            ) : (
              <div className="tl">
                {showDraftRow && (
                  <div className="tl-item">
                    <div className="row between">
                      <span className="tl-title">Draft in progress</span>
                      <Badge tone="slate">Draft</Badge>
                    </div>
                    <div className="tl-meta">{items ? items.length : 0} items · changes not yet submitted</div>
                  </div>
                )}
                {visibleHistory.map((ev) => (
                  <div className="tl-item" key={ev.id}>
                    <div className="row between">
                      <span className="tl-title">{EVENT_TITLE[ev.event_type] || ev.event_type}</span>
                      <Badge tone={EVENT_TONE[ev.event_type] || "slate"}>{ev.event_type}</Badge>
                    </div>
                    <div className="tl-meta">
                      {ev.item_count ?? 0} items · {fmtDate(ev.created_at)}
                      {ev.event_type === "APPROVED" && ev.actor ? ` · by ${ev.actor}` : ""}
                      {ev.event_type === "REJECTED" && ev.note ? ` · ${ev.note}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

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
