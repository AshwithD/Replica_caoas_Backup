import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCcw, Mail, CheckCircle2, XCircle, BarChart3, X, Download } from "lucide-react";
import { api, apiPath } from "../_kit/api/client";
import { useAppMutations, useBatch, useClients, useEmailLogs } from "../_kit/hooks/hooks";
import { Badge, Button, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import { formatDateTime, MONTHS, unwrapList, useSmartBack } from "../_kit/utils/utils";
import WorkspaceHeader from "../_kit/components/WorkspaceHeader";
import Breadcrumb from "../_kit/components/Breadcrumb";
import Pagination from "../_kit/components/Pagination";
import GlassDropdown from "../_kit/components/GlassDropdown";

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────────
   PagingFooter — shared visual pattern used across the app
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const thStyle = {
  padding:       "8px 12px",
  fontSize:      "10px",
  fontWeight:    600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color:         "var(--text-strong)",
  whiteSpace:    "nowrap",
};

const tdStyle = {
  padding:    "8px 12px",
  color:      "var(--text-body)",
  fontSize:   "13px",
  whiteSpace: "nowrap",
};

const rowDivider = { borderTop: "1px solid var(--border-1)" };

/* Shared with PayrollWorkspace's tab-row status dropdown */
export const EMAIL_STATUS_OPTIONS = [
  { value: "",      label: "All Statuses" },
  { value: "true",  label: "Sent",   dot: "var(--green-solid-dark)" },
  { value: "false", label: "Failed", dot: "var(--red-solid)" },
];

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function EmailLogs({ onBack }) {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [internalFilters, setInternalFilters] = useState({ success: "" });
  const [page, setPage] = useState(1);

  // Detail view for a single batch — batchId comes from the route
  // (/payroll/email-logs/:batchId). Pick it via EmailLogBatches first.
  const filters = { success: internalFilters.success, batch: batchId };
  const setFilters = setInternalFilters;

  const logsQuery               = useEmailLogs(filters);
  const batchQuery              = useBatch(batchId);
  const batch                   = batchQuery.data;
  const clientsQuery            = useClients();
  const clients                 = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  const { mutateResendEmail }   = useAppMutations();
  // Back goes to the batch-grouped email log list, not the overview.
  const smartBack = useSmartBack("/payroll/email-logs");

  const downloadCSV = async () => {
    try {
      const response = await api.get(apiPath(`batches/${batchId}/export-csv/`), { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      const clientName = clients.find((c) => String(c.id) === String(batch?.client))?.name || "client";
      const monthLabel = batch ? MONTHS[(batch.month || 1) - 1] : "";
      const fileClientName = clientName.replace(/\s+/g, "");
      link.download = batch
        ? `${fileClientName}_${monthLabel}_${batch.year}_emailstatus.csv`
        : `email_log_${batchId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Email log CSV download failed:", err);
    }
  };

  const logs      = unwrapList(logsQuery.data);

  // Reset to page 1 whenever the filtered dataset changes shape, so the
  // user never lands on a now-empty page after switching filters.
  useEffect(() => {
    setPage(1);
  }, [filters.success, batchId]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const sent       = logs.filter((l) => l.success).length;
  const failed     = logs.filter((l) => !l.success).length;
  const failRate   = logs.length ? Math.round((failed / logs.length) * 100) : 0;

  // For each failed log, check whether a later attempt for the same
  // payslip_record eventually succeeded. Used to visually de-emphasize
  // failures that were already fixed by a subsequent retry, instead of
  // deleting/hiding history rows.
  const resolvedAttemptByRecord = {};
  logs.forEach((l) => {
    if (l.success && l.payslip_record != null) {
      const prev = resolvedAttemptByRecord[l.payslip_record];
      if (prev === undefined || l.attempt_number > prev) {
        resolvedAttemptByRecord[l.payslip_record] = l.attempt_number;
      }
    }
  });
  const getResolvedAt = (log) => {
    if (log.success || log.payslip_record == null) return null;
    const succeededAttempt = resolvedAttemptByRecord[log.payslip_record];
    return succeededAttempt && succeededAttempt > log.attempt_number ? succeededAttempt : null;
  };

  const statusOptions = EMAIL_STATUS_OPTIONS;

  const anyFilter = filters.success;

  const filterBar = (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background:           "var(--surface-1)",
        backdropFilter:       "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border:               "1px solid var(--surface-5)",
        boxShadow:            "inset 0 1px 0 var(--surface-2)",
      }}
    >
      <GlassDropdown
        value={filters.success}
        onChange={(v) => setFilters({ ...filters, success: v })}
        options={statusOptions}
        placeholder="All Statuses"
        width="w-36"
      />

      {anyFilter && (
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 transition-all hover:text-slate-200"
          style={{ background: "var(--surface-3)", border: "1px solid var(--surface-5)" }}
          onClick={() => setFilters({ success: "" })}
        >
          <X size={11} />
          Clear
        </button>
      )}

      <button
        className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
        style={{ background: "#001F5B", color: "var(--text-white)", border: "1px solid transparent" }}
        onClick={downloadCSV}
      >
        <Download size={12} /> Download CSV
      </button>
    </div>
  );

  return (

    <div className="flex flex-col gap-0" style={{ minHeight: 0 , zoom:0.9 }}>

      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: () => navigate("/payroll") },
          { label: clients.find((c) => String(c.id) === String(batch?.client))?.name || "Client", onClick: onBack || smartBack },
          { label: batch ? `${MONTHS[(batch.month || 1) - 1]} ${batch.year}` : "Batch" },
        ]}
      />

      <WorkspaceHeader
        title={batch ? `Email Log — ${MONTHS[(batch.month || 1) - 1]} ${batch.year}` : "Email Logs"}
        subtitle="Every payslip send attempt, including failures and retries."
        onBack={onBack || smartBack}
        actions={filterBar}
      />

      {/* ── Table ── */}
      <div className="mt-0">
        {logsTable()}
      </div>
    </div>
  );

  function logsTable() {
    return logsQuery.isLoading ? (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    ) : logsQuery.isError ? (
      <ErrorState onRetry={logsQuery.refetch} />
    ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--surface-5)" }}>
                {["Code", "Name", "Email", "Period", "Attempt", "Status", "Error", "Sent At", "Actions"].map((col) => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedLogs.length > 0 ? (
                pagedLogs.map((log) => {
                const resolvedAt = getResolvedAt(log);
                return (
                  <tr
                    key={log.id}
                    style={{ ...rowDivider, opacity: resolvedAt ? 0.55 : 1 }}
                    className="transition-colors duration-150"
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Code */}
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {log.employee_code || "—"}
                    </td>

                    {/* Name */}
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-strong)" }}>
                      {log.employee_name}
                    </td>

                    {/* Email */}
                    <td style={{ ...tdStyle, color: "var(--text-tertiary)", fontSize: "12px" }}>
                      {log.recipient_email}
                    </td>

                    {/* Period */}
                    <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>
                      {MONTHS[(log.batch_month || 1) - 1]} {log.batch_year}
                    </td>

                    {/* Attempt # */}
                    <td style={{ ...tdStyle, color: "var(--text-tertiary)", textAlign: "center" }}>
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{
                          background: log.attempt_number > 1 ? "var(--amber-bg)" : "var(--border-1)",
                          color:      log.attempt_number > 1 ? "var(--amber-text-strong)" : "var(--text-tertiary)",
                          border:     log.attempt_number > 1 ? "1px solid var(--amber-border)" : "1px solid var(--surface-5)",
                        }}
                      >
                        {log.attempt_number}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <Badge tone={log.success ? "green" : "red"}>
                        {log.success
                          ? <><CheckCircle2 size={11} className="mr-1 inline" />Sent</>
                          : <><XCircle size={11} className="mr-1 inline" />Failed</>
                        }
                      </Badge>
                      {resolvedAt && (
                        <span
                          className="ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--green-bg-subtle)", color: "var(--green-text-strong)", border: "1px solid var(--green-bg-strong)" }}
                        >
                          <CheckCircle2 size={9} />
                          Resolved at attempt {resolvedAt}
                        </span>
                      )}
                    </td>

                    {/* Error */}
                    <td
                      style={{ ...tdStyle, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", color: log.error_message ? "var(--red-text-strong)" : "#334155", fontSize: "12px" }}
                      title={log.error_message || ""}
                    >
                      {log.error_message || "—"}
                    </td>

                    {/* Sent At */}
                    <td style={{ ...tdStyle, color: "var(--text-tertiary)", fontSize: "12px" }}>
                      {formatDateTime(log.sent_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, paddingRight: "10px" }}>
                      {!log.success && !resolvedAt && (
                        <button
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-all duration-150"
                          style={{ background: "var(--amber-bg-subtle)", border: "1px solid var(--amber-bg-strong)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--amber-bg-strong)";
                            e.currentTarget.style.border     = "1px solid var(--amber-border)";
                            e.currentTarget.style.boxShadow  = "0 0 12px var(--amber-bg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--amber-bg-subtle)";
                            e.currentTarget.style.border     = "1px solid var(--amber-bg-strong)";
                            e.currentTarget.style.boxShadow  = "none";
                          }}
                          onClick={() => mutateResendEmail.mutate(log.payslip_record)}
                        >
                          <RefreshCcw size={11} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-bg-strong)" }}
                      >
                        <Mail size={22} className="text-blue-400" />
                      </div>
                      <p className="text-sm text-slate-500">No email logs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalCount={logs.length}
          onPageChange={setPage}
          noun="logs"
        />
      </Card>
    );
  }
}