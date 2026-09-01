import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  Badge, Button, Card, Checkbox, DateInput, EmptyState, ErrorBanner,
  Field, NumberInput, SelectInput, Spinner, TextArea, TextInput, fmtINR,
} from "../components/ui";

const STATUS_TONE = { DRAFT: "slate", SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };

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

// Notes are written in the "Notes for payroll team" box above, not as an
// item — so exclude NOTE from the add-item menu (kept in ITEM_TYPES only so
// any previously-added NOTE items still render with a proper label).
const ADDABLE_TYPES = ITEM_TYPES.filter((t) => t.key !== "NOTE");

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
}));

function summary(item) {
  const p = item.payload || {};
  const bits = [];
  if (p.employee_code) bits.push(p.employee_code);
  if (p.first_name) bits.push([p.first_name, p.last_name].filter(Boolean).join(" "));
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

function ItemForm({ type, employees, onCancel, onSave, saving, releaseDefault }) {
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
    <form className="form-panel" onSubmit={submit}>
      <div className="row between mb-8">
        <strong style={{ fontSize: 14 }}>{TYPE_LABEL[type]}</strong>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

      {type === "NEW_EMPLOYEE" && (
        <div className="grid grid-2">
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
        <div className="grid grid-2">
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

      <div className="row mt-16" style={{ justifyContent: "flex-end" }}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : `Add ${TYPE_LABEL[type]}`}
        </Button>
      </div>
    </form>
  );
}

export default function Submission() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [employees, setEmployees] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [current, setCurrent] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [addingType, setAddingType] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/portal/employees/").then((d) => setEmployees(Array.isArray(d) ? d : [])).catch(() => {});
    api.get("/portal/submissions/").then((d) => setSubmissions(Array.isArray(d) ? d : [])).catch(() => {});
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
      api.get("/portal/submissions/").then((d) => setSubmissions(Array.isArray(d) ? d : [])).catch(() => {});
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
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const refreshItems = async (subId) => {
    const its = await api.get(`/portal/submissions/${subId}/items/`);
    setItems(Array.isArray(its) ? its : []);
    api.get("/portal/submissions/").then((d) => setSubmissions(Array.isArray(d) ? d : [])).catch(() => {});
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

  const removeItem = async (itemId) => {
    if (!window.confirm("Remove this item?")) return;
    setError("");
    try {
      await api.del(`/portal/submissions/${current.id}/items/${itemId}/`);
      await refreshItems(current.id);
    } catch (e) {
      setError(e.message);
    }
  };

  const submitMonth = async () => {
    if (!window.confirm("Submit this month for payroll review? You won't be able to edit it until it's approved or returned.")) return;
    setSubmitting(true); setError("");
    try {
      const sub = await api.post(`/portal/submissions/${current.id}/submit/`);
      setCurrent(sub);
      api.get("/portal/submissions/").then((d) => setSubmissions(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const editable = current && ["DRAFT", "REJECTED", "APPROVED"].includes(current.status);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Monthly Input</h1>
        <p className="page-sub">
          Record this month's changes — joiners, salary revisions, exits, advances and one-off items. Submit when done; your payroll team approves.
        </p>
      </div>

      <div className="month-bar mb-16">
        <Field label="Month">
          <SelectInput
            options={MONTHS}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Field>
        <Field label="Year">
          <NumberInput
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ maxWidth: 120 }}
          />
        </Field>
        <Button onClick={() => loadMonth(month, year)} disabled={loading}>
          {loading ? "Loading…" : "Open / Refresh Month"}
        </Button>
        <div className="small muted" style={{ marginLeft: "auto" }}>
          Opened months: {submissions.length}
        </div>
      </div>

      <ErrorBanner message={error} />

      {!current && !loading && (
        <Card>
          <EmptyState
            title="Pick a month to begin"
            hint="Choose the payroll month and year above, then click “Open / Refresh Month”."
          />
        </Card>
      )}

      {loading && (
        <div className="center" style={{ padding: 40 }}><Spinner /></div>
      )}

      {current && !loading && (
        <>
          <Card className="mb-16">
            <div className="row between">
              <div className="row">
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  {new Date(current.year, current.month - 1, 1).toLocaleString("en", { month: "long" })} {current.year}
                </h3>
                <Badge tone={STATUS_TONE[current.status] || "slate"}>{current.status}</Badge>
              </div>
              {editable && (items || []).length > 0 && (
                <Button onClick={submitMonth} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit for Review"}
                </Button>
              )}
            </div>

            {current.status === "SUBMITTED" && (
              <div className="success-banner mt-8">
                Submitted for review. Your payroll team will approve it or return it with comments.
              </div>
            )}
            {current.approved_at && current.status !== "REJECTED" && (
              <div className="success-banner mt-8">
                ✓ Latest round approved on {new Date(current.approved_at).toLocaleDateString()} and applied to payroll.
                You can keep adding items and submit again for the same month.
              </div>
            )}
            {current.status === "REJECTED" && current.rejection_reason && (
              <div className="error-banner mt-8">Returned by payroll team: {current.rejection_reason}</div>
            )}

            {editable && (
              <div className="mt-12" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <Field label="Notes for payroll team" hint="Shown to your payroll team when they review this month">
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything your payroll team should know about this month…"
                  />
                </Field>
                <div className="row mt-8" style={{ justifyContent: "flex-end" }}>
                  <Button size="sm" variant="ghost" onClick={saveNotes} disabled={savingNotes}>
                    {savingNotes ? "Saving…" : "Save notes"}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <h3 className="mb-8" style={{ fontSize: 15 }}>Items ({items ? items.length : 0})</h3>

          <div className="grid" style={{ gap: 10 }}>
            {(items || []).map((it) => (
              <div className="item-row" key={it.id}>
                <div className="item-main">
                  <div className="row">
                    <span className="item-title">{TYPE_LABEL[it.item_type] || it.item_type}</span>
                    <Badge tone={it.status === "APPLIED" ? "green" : it.status === "FAILED" ? "red" : "slate"}>
                      {it.status}
                    </Badge>
                  </div>
                  <div className="item-sub">{summary(it)}</div>
                  {it.error && <div className="small" style={{ color: "var(--red)", marginTop: 4 }}>{it.error}</div>}
                </div>
                {editable && (
                  <Button size="sm" variant="danger" onClick={() => removeItem(it.id)}>Remove</Button>
                )}
              </div>
            ))}
            {(!items || items.length === 0) && (
              <Card><EmptyState title="No items yet" hint="Add joiners, revisions, exits, advances or one-off items below." /></Card>
            )}
          </div>

          {editable && (
            <div className="mt-24">
              <h3 className="mb-8" style={{ fontSize: 15 }}>Add an item</h3>
              <div className="type-grid mb-16">
                {ADDABLE_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`type-btn ${addingType === t.key ? "selected" : ""}`}
                    onClick={() => setAddingType(addingType === t.key ? null : t.key)}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {addingType && (
                <ItemForm
                  type={addingType}
                  employees={employees}
                  saving={savingItem}
                  onCancel={() => setAddingType(null)}
                  onSave={addItem}
                  releaseDefault={{
                    month: current.month === 12 ? 1 : current.month + 1,
                    year: current.month === 12 ? current.year + 1 : current.year,
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
