import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import {
  Download, FileText, TrendingUp, Wallet, Calendar, Pencil,
  User, Info as InfoIcon, Layers, Receipt, Briefcase,
  Building2, Mail, CircleDot, IndianRupee, Clock, CalendarClock, Lock, History,
  RefreshCw, Send, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Badge, Button, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import Breadcrumb from "../_kit/components/Breadcrumb";
import { formatCurrency, formatDateTime, MONTHS, unwrapList, useSmartBack } from "../_kit/utils/utils";
import { api, apiPath } from "../_kit/api/client";
import { useAdjustmentHistory, useClients, useEmployeeRecords, usePendingAdjustments, useSalaryStructureHistory, useAppMutations } from "../_kit/hooks/hooks";
import { EmployeeFormModal } from "./EmployeesList";
import SalaryStructureModal from "../modals/SalaryStructureModal";
import PayslipCorrectionModal from "../modals/PayslipCorrectionModal";
import { LedgerAdjustmentModal, LEDGER_TYPE_CONFIG, formatBalanceValue } from "../_kit/components/LedgerAdjustmentModal";

const STRUCTURE_ROWS = [
  ["ctc_annual", "CTC (Annual)"],
  ["monthly_gross", "Monthly Gross"],
  ["original_basic_da", "Basic + DA"],
  ["original_hra", "HRA"],
  ["original_special_allowance", "Special Allowance"],
  ["original_lta", "Leave Travel Allowance"],
  ["nps_allowance", "NPS Allowance (Employer)"],
  ["fbp", "FBP"],
  ["vpf", "VPF"],
];

const recordStatusTone = {
  DRAFT:       "slate",
  APPROVED:    "blue",
  EMAIL_SENT:  "green",
  EMAIL_FAILED: "red",
};

const TABS = [
  { key: "details",  label: "Details",  icon: User },
  { key: "payslips", label: "Payslips", icon: Receipt },
  { key: "adjustments", label: "Adjustment History", icon: History },
];

function TabRow({ active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-5 px-1" style={{ borderBottom: "1px solid var(--border-3)" }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? "var(--blue-text-strong)" : "var(--text-muted)",
              borderBottom: isActive ? "2px solid var(--blue-solid)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <Icon size={14} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
    </div>
  );
}

/* ── "Details" tab body — stat cards, then employee info + salary
   structure side by side in a 2-column grid. ─────────────────────── */
function EmployeeDetailsTab({ emp, clientName, totalPayslips, emailSent, totalPaid, latestRecord, structure, history, historyLoading, pendingAdjustments, onAdjust }) {
  const compOffBalance = latestRecord?.comp_off_closing_balance ?? 0;
  const leaveBalance = latestRecord?.leave_closing_balance ?? 0;
  const advanceBalance = latestRecord?.salary_advance_closing_balance ?? 0;
  const onHoldBalance = latestRecord?.on_hold_closing_balance ?? 0;

  const pendingSummary = (rows) => {
    if (!rows || rows.length === 0) return null;
    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const sign = total > 0 ? "+" : "";
    return `${rows.length} pending (${sign}${Number(total).toFixed(2)})`;
  };

  // Same chip set/coloring as BatchReview's per-record drawer, but these
  // reflect the employee's current running balances (from their most
  // recent payslip), not one specific month's record. Each is now
  // adjustable directly from here — see LedgerAdjustmentModal wiring in
  // the parent component — and shows a "pending" note when this employee
  // has adjustments still waiting for the next batch upload (no open
  // batch right now — see _current_open_record in payroll/views.py).
  let ledgerChips = [
    { key: "comp_off", label: "Comp-Off", icon: Clock, badge: `${Number(compOffBalance).toFixed(2)} Days`, color: "blue", highlight: compOffBalance > 0, pending: pendingSummary(pendingAdjustments?.comp_off) },
    { key: "leave", label: "Leave", icon: CalendarClock, badge: `${Number(leaveBalance).toFixed(2)} Days`, color: "purple", highlight: leaveBalance > 0, pending: pendingSummary(pendingAdjustments?.leave) },
    { key: "salary_advance", label: "Advance", icon: Wallet, badge: formatCurrency(advanceBalance), color: "green", highlight: advanceBalance > 0, pending: pendingSummary(pendingAdjustments?.salary_advance) },
    { key: "on_hold", label: "On-Hold", icon: Lock, badge: formatCurrency(onHoldBalance), color: "amber", highlight: onHoldBalance > 0, pending: pendingSummary(pendingAdjustments?.on_hold) },
  ];
  if (latestRecord?.is_probation) {
    ledgerChips = ledgerChips.filter((c) => c.key !== "comp_off" && c.key !== "leave");
  }

  const summaryChips = [
    { key: "payslips", label: "Payslips Generated", icon: FileText, badge: totalPayslips, color: "blue" },
    { key: "emails", label: "Emails Sent", icon: TrendingUp, badge: emailSent, color: "green" },
    { key: "net_paid", label: "Total Net Paid", icon: Wallet, badge: formatCurrency(totalPaid), color: "blue" },
    ...(latestRecord ? ledgerChips : []),
  ];

  return (
    <div className="space-y-3">
      <div className={`grid gap-2 sm:grid-cols-3 ${summaryChips.length > 3 ? "lg:grid-cols-7" : ""}`}>
        {summaryChips.map((chip) => {
          const Icon = chip.icon;
          const adjustable = chip.adjustable !== false && Boolean(ledgerChips.find((c) => c.key === chip.key));
          return (
            <Card key={chip.key} className="p-3 flex items-start gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                style={{ background: `var(--${chip.color}-bg)` }}
              >
                <Icon size={16} style={{ color: `var(--${chip.color}-text)` }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{chip.label}</div>
                  {adjustable && (
                    <button
                      type="button"
                      onClick={() => onAdjust(chip.key)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors shrink-0"
                      style={{ color: "var(--blue-text-strong)", background: "var(--blue-bg-subtle)" }}
                    >
                      Adjust
                    </button>
                  )}
                </div>
                <div
                  className="text-base font-semibold tabular-nums"
                  style={{ color: chip.highlight ? `var(--${chip.color}-text-strong)` : "var(--text-strong)" }}
                >
                  {chip.badge}
                </div>
                {chip.pending && (
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--amber-text-strong)" }}>
                    {chip.pending}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {/* Employee info + salary structure history */}
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div
              className="flex items-center px-5 py-3"
              style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-3)" }}
            >
              <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-strong)" }}>
                <InfoIcon size={14} /> EMPLOYEE INFORMATION
              </h3>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Info label="Client" icon={Building2} value={clientName} />
              <Info label="Position" icon={Briefcase} value={emp.position || "—"} />
              <Info label="Department" icon={Layers} value={emp.department || "—"} />
              <Info label="Email" icon={Mail} value={emp.email || "—"} />
              <Info label="Hire Date" icon={Calendar} value={formatDateTime(emp.hire_date)} />
              <Info label="Status" icon={CircleDot} value={<Badge tone={emp.status === "active" ? "green" : "slate"}>{emp.status}</Badge>} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-strong)" }}>
              Salary Structure History
            </h3>
            {historyLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : history.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No structure revisions recorded.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ border: "1px solid var(--border-1)" }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                      <span className="text-sm" style={{ color: "var(--text-strong)" }}>
                        Effective {h.effective_from}
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums" style={{ color: "var(--text-strong)" }}>
                      {formatCurrency(h.ctc_annual)} CTC
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Salary structure */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-strong)" }}>
            Current Salary Structure
          </h3>
          {structure ? (
            <>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                Effective from {structure.effective_from} · {structure.pf_opted ? "PF applicable" : "PF not applicable"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {STRUCTURE_ROWS.map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-lg px-3 py-2"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
                  >
                    <div className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <IndianRupee size={11} /> {label}
                    </div>
                    <div className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: "var(--text-strong)" }}>
                      {formatCurrency(structure[key])}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No salary structure has been set up for this employee yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── "Payslips" tab body ───────────────────────────────────────────────
   Per-employee payslip lifecycle, deliberately separated into three
   explicit steps — Edit Details → Regenerate PDF → Send Email — because
   corrections routinely surface AFTER the batch mail has gone out and the
   fix must be scoped to this one employee, never a whole-batch re-run.  */
function PayslipsTab({ records, recordsLoading, onDownload, onEdit, onRegenerate, onSend, busyId, feedback }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
          Payslips
        </h3>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Edit, regenerate and email a single month for this employee only.
        </span>
      </div>

      {feedback && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs mb-2"
          style={
            feedback.ok
              ? { background: "var(--green-bg-subtle)", border: "1px solid var(--green-border)", color: "var(--green-text)" }
              : { background: "var(--red-bg-subtle)", border: "1px solid var(--red-border)", color: "var(--red-text)" }
          }
        >
          {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {feedback.message}
        </div>
      )}

      {recordsLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : records.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No payslips generated for this employee yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-1)" }}>
          {/* Header row */}
          <div
            className="grid items-center px-3 py-1.5 text-xs font-semibold tracking-wide"
            style={{
              gridTemplateColumns: "1.1fr 0.9fr 0.9fr 2.2fr",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border-1)",
              color: "var(--text-muted)",
            }}
          >
            <span>MONTH / YEAR</span>
            <span>STATUS</span>
            <span className="text-right">AMOUNT</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {records.map((r, i) => {
            const busy = busyId === r.id;
            return (
              <div
                key={r.id}
                className="grid items-center px-3 py-2 text-sm"
                style={{
                  gridTemplateColumns: "1.1fr 0.9fr 0.9fr 2.2fr",
                  borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
                }}
              >
                <span className="font-medium" style={{ color: "var(--text-strong)" }}>
                  {MONTHS[(r.batch_month || 1) - 1]} {r.batch_year}
                </span>
                <span>
                  <Badge tone={recordStatusTone[r.status] || "slate"}>{r.status}</Badge>
                </span>
                <span className="text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatCurrency(r.net_salary)}
                </span>
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => onEdit(r)}>
                    <Pencil size={12} /> Edit Details
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => onRegenerate(r)}>
                    <RefreshCw size={12} /> {busy ? "Working…" : "Render PDF"}
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => onSend(r)}>
                    <Send size={12} /> {r.status === "EMAIL_SENT" ? "Resend Email" : "Send Email"}
                  </Button>
                  {r.pdf_path ? (
                    <button
                      className="inline-flex items-center gap-1 text-xs font-medium hover:underline px-1"
                      style={{ color: "var(--blue-text)" }}
                      onClick={() => onDownload(r.id, { month: r.batch_month, year: r.batch_year })}
                    >
                      <Download size={12} /> PDF
                    </button>
                  ) : (
                    <span className="text-xs px-1" style={{ color: "var(--text-muted)" }}>no pdf</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── "Adjustment History" tab body — one section per ledger type
   (Comp-Off, Leave, Advance, On-Hold), each with its own chronological
   history list. Advance additionally shows an "EMI Plans" block above its
   history, since it's the only type with a multi-month plan concept. ── */
function AdjustmentTypeSection({ typeKey, entries, isMoney, plans, onAdjust }) {
  const config = LEDGER_TYPE_CONFIG[typeKey];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
          {config.label}
        </h3>
        {onAdjust && (
          <button
            type="button"
            onClick={() => onAdjust(typeKey)}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors shrink-0"
            style={{ color: "var(--blue-text-strong)", background: "var(--blue-bg-subtle)" }}
          >
            Adjust
          </button>
        )}
      </div>
      {plans && plans.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>EMI Plans</div>
          {plans.map((plan) => {
            const fullyRecovered = plan.months_recovered >= plan.tenure_months;
            const disbursed = plan.disbursement_month != null;
            return (
              <div
                key={plan.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                    {formatCurrency(plan.total_amount)} over {plan.tenure_months} months ({formatCurrency(plan.emi_amount)}/mo)
                  </div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      {disbursed
                        ? `Disbursed ${MONTHS[(plan.disbursement_month || 1) - 1]} ${plan.disbursement_year}`
                        : `Pending disbursement (created ${formatDateTime(plan.created_at)})`}
                    </span>
                    <span>·</span>
                    <span style={{ color: fullyRecovered ? "var(--green-text-strong)" : "var(--text-muted)" }}>
                      {fullyRecovered ? "Fully recovered" : `${plan.months_remaining} month(s) remaining`}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--text-strong)" }}>
                  {plan.months_recovered}/{plan.tenure_months}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!entries || entries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No {config.label.toLowerCase()} adjustments yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((row) => {
            const isPositive = Number(row.amount) >= 0;
            return (
              <div
                key={row.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                style={{
                  background: isPositive ? "var(--green-bg-subtle)" : "var(--red-bg-subtle)",
                  border: `1px solid ${isPositive ? "var(--green-border)" : "var(--red-border)"}`,
                }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                    {row.reason || "—"}
                  </div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
                    <span>{formatDateTime(row.created_at)}</span>
                    {row.advance != null && (
                      <>
                        <span>·</span>
                        <span style={{ color: "var(--blue-text)" }}>
                          EMI plan ({row.advance_tenure_months}mo)
                        </span>
                      </>
                    )}
                    {row.applied_in_record == null && (
                      <>
                        <span>·</span>
                        <span style={{ color: "var(--amber-text-strong)" }}>Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="text-sm font-semibold tabular-nums shrink-0"
                  style={{ color: isPositive ? "var(--green-text-strong)" : "var(--red-text-strong)" }}
                >
                  {isPositive ? "+" : "-"}
                  {isMoney ? formatCurrency(Math.abs(row.amount)) : `${Math.abs(row.amount)} ${row.amount === 1 || row.amount === -1 ? "day" : "days"}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AdjustmentHistoryTab({ data, isLoading, onAdjust }) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="grid gap-3 lg:grid-cols-4 items-start">
      <AdjustmentTypeSection typeKey="comp_off" entries={data?.comp_off} isMoney={false} onAdjust={onAdjust} />
      <AdjustmentTypeSection typeKey="leave" entries={data?.leave} isMoney={false} onAdjust={onAdjust} />
      <AdjustmentTypeSection typeKey="salary_advance" entries={data?.salary_advance} isMoney plans={data?.salary_advance_plans} onAdjust={onAdjust} />
      <AdjustmentTypeSection typeKey="on_hold" entries={data?.on_hold} isMoney onAdjust={onAdjust} />
    </div>
  );
}

export default function EmployeeWorkspace({ employeeId }) {
  const navigate = useNavigate();
  const goBack = useSmartBack("/payroll/employees");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "details";
  const setTab = (tab) => setSearchParams({ tab });

  const clientsQuery = useClients();
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];

  const [empState, setEmpState] = useState({ data: null, isLoading: true, isError: false });
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showEditSalary, setShowEditSalary] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(null);
  // Per-employee payslip actions (edit → render PDF → send email)
  const [editingRecord, setEditingRecord] = useState(null);
  const [payslipBusyId, setPayslipBusyId] = useState(null);
  const [payslipFeedback, setPayslipFeedback] = useState(null);

  const fetchEmployee = () => {
    setEmpState((s) => ({ ...s, isLoading: true, isError: false }));
    return api
      .get(apiPath(`salary-structures/employees/${employeeId}/`))
      .then((res) => setEmpState({ data: res.data, isLoading: false, isError: false }))
      .catch(() => setEmpState({ data: null, isLoading: false, isError: true }));
  };

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const { data: emp, isLoading: empLoading, isError: empError } = empState;

  const historyQuery = useSalaryStructureHistory(employeeId);
  const history = unwrapList(historyQuery.data);

  const recordsQuery = useEmployeeRecords(employeeId);
  const records = unwrapList(recordsQuery.data);

  const pendingAdjustmentsQuery = usePendingAdjustments(employeeId);
  const adjustmentHistoryQuery = useAdjustmentHistory(employeeId);

  const { mutateSaveEmployee: mutateToggleStatus } = useAppMutations();
  const toggleEmployeeStatus = async () => {
    const nextStatus = emp?.status === "active" ? "inactive" : "active";
    try {
      await mutateToggleStatus.mutateAsync({ id: employeeId, data: { status: nextStatus } });
      fetchEmployee();
    } catch (err) {
      console.error("Failed to update employee status:", err);
    }
  };

  // ── Per-employee payslip actions ───────────────────────────────────
  // Deliberately three separate steps rather than one "send" button: a
  // correction after the batch mail went out needs the data fixed, the PDF
  // re-rendered from the corrected figures, and only then the mail resent —
  // for THIS employee alone, never the whole batch.
  const regeneratePDF = async (record) => {
    setPayslipBusyId(record.id);
    setPayslipFeedback(null);
    try {
      await api.post(apiPath(`records/${record.id}/regenerate-pdf/`));
      await recordsQuery.refetch();
      setPayslipFeedback({ ok: true, message: "Payslip PDF regenerated with the current figures." });
    } catch (err) {
      setPayslipFeedback({
        ok: false,
        message: err?.response?.data?.detail || "Failed to regenerate the payslip PDF.",
      });
    } finally {
      setPayslipBusyId(null);
    }
  };

  const sendEmail = async (record) => {
    setPayslipBusyId(record.id);
    setPayslipFeedback(null);
    try {
      // The backend renders the PDF first if it is missing/stale, so the
      // employee never receives an out-of-date attachment.
      const res = await api.post(apiPath(`records/${record.id}/resend/`));
      const { success, message } = res.data || {};
      await recordsQuery.refetch();
      setPayslipFeedback({
        ok: !!success,
        message: success ? "Payslip emailed to this employee." : message || "Failed to send the payslip email.",
      });
    } catch (err) {
      setPayslipFeedback({
        ok: false,
        message: err?.response?.data?.detail || "Failed to send the payslip email.",
      });
    } finally {
      setPayslipBusyId(null);
    }
  };

  const downloadPDF = async (recordId, batch) => {
    try {
      const response = await api.get(apiPath(`records/${recordId}/download-pdf/`), { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      const empClientName = (clients.find((c) => String(c.id) === String(emp?.client))?.name || "client").replace(/\s+/g, "");
      link.download = `${empClientName}_${(emp?.full_name || "").replace(/\s+/g, "")}_${MONTHS[batch.month - 1]}${batch.year}_payslip.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (empLoading) {
    return (
      <div className="payroll-scope p-4 space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (empError || !emp) {
    return (
      <div className="payroll-scope p-4">
        <ErrorState message="Failed to load employee details." onRetry={fetchEmployee} />
      </div>
    );
  }

  const structure = emp.salary_structure;
  const clientName = clients.find((c) => String(c.id) === String(emp.client))?.name || "Client";

  const totalPayslips = records.length;
  const emailSent = records.filter((r) => r.status === "EMAIL_SENT").length;
  const totalPaid = records.reduce((sum, r) => sum + (Number(r.net_salary) || 0), 0);

  // Latest record by batch period (records aren't returned in date order —
  // PayslipRecord's default ordering is by employee_code) — its closing
  // balances are the employee's current running ledger totals.
  const latestRecord = records.reduce((latest, r) => {
    if (!latest) return r;
    const rKey = (r.batch_year || 0) * 100 + (r.batch_month || 0);
    const latestKey = (latest.batch_year || 0) * 100 + (latest.batch_month || 0);
    return rKey > latestKey ? r : latest;
  }, null);

  return (
    <div className="payroll-scope flex min-h-full flex-col gap-3" style={{ zoom: 0.9 }}>
      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: () => navigate("/payroll") },
          { label: clientName, onClick: goBack },
          { label: emp.full_name },
        ]}
      />

      {/* Boxed header card — matches ClientWorkspace: avatar + name/status/chip
          on the left, actions on the right, tab row along the bottom. */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
            >
              <User size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold truncate" style={{ color: "var(--text-strong)" }}>
                  {emp.full_name}
                </h1>
                <Badge tone={emp.status === "active" ? "green" : "slate"}>
                  {(emp.status || "").toUpperCase()}
                </Badge>
                <span
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold"
                  style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", color: "var(--blue-text-strong)" }}
                >
                  <Briefcase size={11} /> {emp.position || "—"}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {emp.employee_code || "—"} · {clientName}
                {emp.hire_date ? ` · Since ${formatDateTime(emp.hire_date)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowEditEmployee(true)}>
              <Pencil size={13} /> Edit Employee
            </Button>
            <Button size="sm" onClick={() => setShowEditSalary(true)}>
              <Layers size={14} /> {structure ? "Update Structure" : "Add Structure"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={mutateToggleStatus.isPending}
              onClick={toggleEmployeeStatus}
              style={
                emp.status === "active"
                  ? { color: "var(--red-text)", border: "1px solid var(--red-border)", background: "var(--red-bg-subtle)" }
                  : { color: "var(--green-text)", border: "1px solid var(--green-border)", background: "var(--green-bg-subtle)" }
              }
            >
              {emp.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <TabRow active={activeTab} onChange={setTab} />
        </div>
      </Card>

      {activeTab === "details" && (
        <EmployeeDetailsTab
          emp={emp}
          clientName={clientName}
          totalPayslips={totalPayslips}
          emailSent={emailSent}
          totalPaid={totalPaid}
          latestRecord={latestRecord}
          structure={structure}
          history={history}
          historyLoading={historyQuery.isLoading}
          pendingAdjustments={pendingAdjustmentsQuery.data}
          onAdjust={(type) => setLedgerModalOpen(type)}
        />
      )}

      {activeTab === "payslips" && (
        <PayslipsTab
          records={records}
          recordsLoading={recordsQuery.isLoading}
          onDownload={downloadPDF}
          onEdit={(r) => { setPayslipFeedback(null); setEditingRecord(r); }}
          onRegenerate={regeneratePDF}
          onSend={sendEmail}
          busyId={payslipBusyId}
          feedback={payslipFeedback}
        />
      )}

      {activeTab === "adjustments" && (
        <AdjustmentHistoryTab
          data={adjustmentHistoryQuery.data}
          isLoading={adjustmentHistoryQuery.isLoading}
          onAdjust={(type) => setLedgerModalOpen(type)}
        />
      )}

      {showEditEmployee && (
        <EmployeeFormModal
          employee={emp}
          clients={clients}
          clientName={clientName}
          onClose={() => setShowEditEmployee(false)}
          onSaved={() => {
            setShowEditEmployee(false);
            fetchEmployee();
          }}
        />
      )}

      {showEditSalary && (
        <SalaryStructureModal
          employee={emp}
          onClose={() => {
            setShowEditSalary(false);
            fetchEmployee();
            historyQuery.refetch();
          }}
        />
      )}

      {editingRecord && (
        <PayslipCorrectionModal
          record={editingRecord}
          employeeName={emp.full_name}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null);
            recordsQuery.refetch();
            setPayslipFeedback({
              ok: true,
              message: "Payslip updated. Render the PDF again, then send the email to this employee.",
            });
          }}
        />
      )}

      {ledgerModalOpen && (
        <LedgerAdjustmentModal
          employee={emp}
          type={ledgerModalOpen}
          closingBalance={
            {
              comp_off: latestRecord?.comp_off_closing_balance,
              leave: latestRecord?.leave_closing_balance,
              salary_advance: latestRecord?.salary_advance_closing_balance,
              on_hold: latestRecord?.on_hold_closing_balance,
            }[ledgerModalOpen] ?? 0
          }
          pendingTotal={(pendingAdjustmentsQuery.data?.[ledgerModalOpen] || []).reduce(
            (sum, r) => sum + Number(r.amount || 0),
            0
          )}
          onClose={() => {
            setLedgerModalOpen(null);
            recordsQuery.refetch();
            pendingAdjustmentsQuery.refetch();
            adjustmentHistoryQuery.refetch();
          }}
        />
      )}
    </div>
  );
}