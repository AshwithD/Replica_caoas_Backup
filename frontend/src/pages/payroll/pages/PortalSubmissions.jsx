import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Inbox, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import {
  Badge, Button, Card, ErrorState, Input, Modal, Skeleton, Textarea,
} from "../_kit/components/primitives";
import { api } from "../_kit/api/client";
import PageHero from "../_kit/components/PageHero";
import Breadcrumb from "../_kit/components/Breadcrumb";
import EmptyState from "../_kit/components/EmptyState";

const STATUS_TONES = { DRAFT: "slate", SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };
const ITEM_TONES = { PENDING: "slate", APPLIED: "green", SKIPPED: "blue", FAILED: "red" };
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
  const [busy, setBusy] = useState(null); // "approve" | "reject" | "proceed"
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
  const summary = submission._last_summary;

  return (
    <Modal title={`${submission.client_name || "Client"} — ${String(submission.month).padStart(2, "0")}/${submission.year}`} onClose={onClose} size="l">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONES[submission.status] || "slate"}>{submission.status}</Badge>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submission.submitted_at ? `Submitted ${new Date(submission.submitted_at).toLocaleString()}` : ""}
          </span>
          {submission.approved_at && (
            <span className="text-xs" style={{ color: "var(--green-text)" }}>
              ✓ approved {new Date(submission.approved_at).toLocaleString()}
            </span>
          )}
        </div>

        {submission.notes && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>{submission.notes}</p>
        )}
        {submission.rejection_reason && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ background: "var(--red-bg-subtle)", color: "var(--red-text)" }}>
            Rejection reason: {submission.rejection_reason}
          </p>
        )}
        {summary && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last approval → applied {summary.applied}, failed {summary.failed}, skipped {summary.skipped}
          </p>
        )}

        {/* ── data already present ─────────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-3)" }}>
          {loading ? (
            <div className="p-4"><Skeleton className="h-32" /></div>
          ) : !items || items.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No items yet.</div>
          ) : (
            <div className="divide-y">
              {items.map((it) => {
                const isNote = it.item_type === "NOTE";
                return (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 px-4 py-2.5"
                    style={isNote ? { background: "var(--amber-bg-subtle)" } : undefined}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                          {isNote ? "📝 " : ""}{TYPE_LABELS[it.item_type] || it.item_type}
                        </span>
                        <Badge tone={ITEM_TONES[it.status] || "slate"}>{it.status}</Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: isNote ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                        {payloadSummary(it, employees)}
                      </p>
                      {it.error && <p className="text-xs mt-0.5" style={{ color: "var(--red-text)" }}>{it.error}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        {/* ── approve / reject (when client submitted) ─────────────────── */}
        {isSubmitted && (
          <div className="flex items-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Reject reason</label>
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

        {/* ── add input from your side ─────────────────────────────────── */}
        <div className="pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Add input from your side (client emailed a change you're keying in)
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {ITEM_TYPES.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={addingType === t.key ? "primary" : "secondary"}
                onClick={() => setAddingType(addingType === t.key ? null : t.key)}
              >
                {t.icon} {t.label}
              </Button>
            ))}
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

export default function PortalSubmissions() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSubmissions();
  const list = unwrapList(data);
  const [selected, setSelected] = useState(null);

  const onChanged = (res) => {
    const sub = res.submission || res;
    setSelected((s) => (s ? { ...s, ...sub, _last_summary: res.summary } : s));
    refetch();
  };

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
        subtitle="Review a client's monthly input, add any changes they emailed you, then Proceed straight to Batch Review — no Excel upload needed."
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
        <Card className="divide-y" style={{ borderColor: "var(--border-3)" }}>
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:opacity-90" onClick={() => setSelected(s)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--surface-3)" }}>
                <Inbox size={18} style={{ color: "var(--text-muted)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{s.client_name || `Client #${s.client}`}</span>
                  <Badge tone={STATUS_TONES[s.status] || "slate"}>{s.status}</Badge>
                  {s.approved_at && s.status !== "SUBMITTED" && <Badge tone="green">✓ approved</Badge>}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {String(s.month).padStart(2, "0")}/{s.year} · {s.item_count} item{s.item_count === 1 ? "" : "s"}
                  {s.approved_at ? ` · last approved ${new Date(s.approved_at).toLocaleDateString()}` : ""}
                </p>
                {s.note_preview && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--amber-text)" }} title={s.note_preview}>
                    📝 {s.note_preview}
                  </p>
                )}
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-subtle)" }} className="shrink-0" />
            </div>
          ))}
        </Card>
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
