import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, RefreshCcw, Upload, Eye, AlertCircle, CheckCircle2, Clock, Send, X, Trash2 } from "lucide-react";
import { api, apiPath } from "../_kit/api/client";
import { useAppMutations, useBatches, useClients } from "../_kit/hooks/hooks";
import { Badge, Button, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import { useConfirm } from "../_kit/components/ConfirmDialog";
import GlassDropdown from "../_kit/components/GlassDropdown";
import Breadcrumb from "../_kit/components/Breadcrumb";
import { formatDateTime, MONTHS, unwrapList, useSmartBack } from "../_kit/utils/utils";
import UploadPayrollModal from "../modals/UploadPayrollModal";
import WorkspaceHeader from "../_kit/components/WorkspaceHeader";
import Pagination from "../_kit/components/Pagination";
import { tableHeaderRowStyle } from "../_kit/styles/tableStyles";

const PAGE_SIZE = 10;

const statusTone = {
  UPLOADED:  "amber",
  REVIEWED:  "blue",
  SENDING:   "blue",
  COMPLETED: "green",
  FAILED:    "red",
};

const statusIcon = {
  UPLOADED:  Clock,
  REVIEWED:  Eye,
  SENDING:   Send,
  COMPLETED: CheckCircle2,
  FAILED:    AlertCircle,
};

const rowDivider = { borderTop: "1px solid var(--border-1)" };

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

/* ── Status dot colors for the dropdown options ── */
const statusDot = {
  UPLOADED:  "var(--amber-solid)",
  REVIEWED:  "var(--blue-solid)",
  SENDING:   "var(--blue-solid)",
  COMPLETED: "var(--green-solid-dark)",
  FAILED:    "var(--red-solid)",
};

/* Shared with PayrollWorkspace's tab-row status dropdown */
export const BATCH_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...Object.keys(statusTone).map((s) => ({
    value: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
    dot:   statusDot[s],
  })),
];

/* ─────────────────────────────────────────────────────────────
   PagingFooter — shared visual pattern used across the app
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function BatchList({ embedded = false, filters: controlledFilters, onBack }) {
  const [params]                    = useSearchParams();
  const [uploadOpen, setUploadOpen] = useState(params.get("action") === "upload");
  // Standalone mode seeds its filters from the URL (e.g. a stat card on
  // the overview linking to /payroll?view=batches&status=SENDING) so the
  // right subset renders immediately, not just after a manual pick.
  const [internalFilters, setInternalFilters] = useState({
    status: params.get("status") || "",
    year: params.get("year") || "",
  });
  const [page, setPage] = useState(1);

  // In embedded mode the parent workspace owns filter state (status/month/year);
  // standalone mode manages its own status/year filters locally. No company
  // dimension — Payroll only ever runs for the single internal firm now.
  const filters = embedded
    ? {
        status: controlledFilters?.status || "",
        month: controlledFilters?.month,
        year: controlledFilters?.year || "",
        client: controlledFilters?.client,
      }
    : internalFilters;
  const setFilters = embedded ? () => {} : setInternalFilters;

  const batchesQuery            = useBatches(filters);
  const clientsQuery            = useClients();
  const clients                 = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  const { mutateSendEmails, mutateDiscardBatch } = useAppMutations();
  const navigate                = useNavigate();
  const confirm                 = useConfirm();
  // Standalone mode (mounted directly by the /payroll/batches route, e.g.
  // from a Dashboard shortcut or a deep link) has no parent supplying
  // `onBack` the way PayrollWorkspace's embedded mode does — without this,
  // the header's back arrow simply never rendered. Falls back to /payroll
  // (its natural parent) only when there's no real history to go back to.
  const smartBack = useSmartBack("/payroll");

  const batches   = unwrapList(batchesQuery.data);

  // Reset to page 1 whenever the filtered dataset changes shape, so the
  // user never lands on a now-empty page after switching filters.
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.year, filters.month]);

  const totalPages = Math.max(1, Math.ceil(batches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBatches = batches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const statusOptions = BATCH_STATUS_OPTIONS;

  const anyFilter = filters.status || filters.year || filters.client;

  const downloadDetailedXLSX = async (batchId) => {
    try {
      const response = await api.get(
        apiPath(`batches/${batchId}/export-detailed-xlsx/`),
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll_${batchId}_detailed.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const batchTable = () => (
    
    <div className="mt-0">
      {batchesQuery.isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : batchesQuery.isError ? (
        <ErrorState onRetry={batchesQuery.refetch} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  style={tableHeaderRowStyle}
                >
                  {["Period","Status","Records","Sent","Failed","Created","Actions"].map((col) => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedBatches.length > 0 ? (
                  pagedBatches.map((batch) => {
                    const StatusIcon = statusIcon[batch.status] || Clock;
                    return (
                      <tr
                        key={batch.id}
                        style={{ ...rowDivider, cursor: "pointer" }}
                        className="transition-colors duration-150"
                        onClick={() => navigate(`/payroll/batches/${batch.id}`)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>
                          {MONTHS[(batch.month || 1) - 1]} {batch.year}
                        </td>
                        <td style={tdStyle}>
                          <Badge tone={statusTone[batch.status] || "slate"}>
                            <StatusIcon size={11} className="mr-1 inline" />
                            {batch.status}
                          </Badge>
                        </td>
                        <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>{batch.total_records}</td>
                        <td style={{ ...tdStyle, color: "var(--green-text-strong)" }}>{batch.email_sent}</td>
                        <td style={{ ...tdStyle, color: batch.email_failed > 0 ? "var(--red-text-strong)" : "var(--text-secondary)" }}>
                          {batch.email_failed}
                        </td>
                        <td style={{ ...tdStyle, color: "var(--text-tertiary)", fontSize: "12px" }}>
                          {formatDateTime(batch.created_at)}
                        </td>
                        <td style={{ ...tdStyle, paddingRight: "10px" ,color: "var(--text-tertiary)", fontSize: "12px" }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <IconBtn
                              title="Export detailed payroll (xlsx)"
                              onClick={() => downloadDetailedXLSX(batch.id)}
                            ><Download size={13} />
                            </IconBtn>
                            <p>Download</p>

                            {batch.status === "FAILED" && (
                              <>
                                <IconBtn title="Retry send" onClick={() => mutateSendEmails.mutate(batch.id)}>
                                  <RefreshCcw size={13} />
                                </IconBtn>
                                <IconBtn
                                  title="Delete batch permanently"
                                  onClick={() => {
                                    confirm({
                                      title: "Delete this batch?",
                                      description: "Permanently delete this failed batch and its payslip records? This cannot be undone.",
                                      variant: "danger",
                                      confirmLabel: "Delete",
                                      onConfirm: () => mutateDiscardBatch.mutateAsync(batch.id),
                                    });
                                  }}
                                >
                                  <Trash2 size={13} style={{ color: "var(--red-text-strong)" }} />
                                </IconBtn>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center gap-3 py-16">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-bg-strong)" }}
                        >
                          <Upload size={22} className="text-blue-400" />
                        </div>
                        <p className="text-sm text-slate-500">No batches found.</p>
                        {!anyFilter && (
                          <Button onClick={() => setUploadOpen(true)}>Upload First Payroll</Button>
                        )}
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
            totalCount={batches.length}
            onPageChange={setPage}
            noun="batches"
          />
        </Card>
      )}
    </div>
  );

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
        value={filters.status}
        onChange={(v) => setFilters({ ...filters, status: v })}
        options={statusOptions}
        placeholder="All Statuses"
        width="w-40"
      />

      <div className="h-5 w-px shrink-0" style={{ background: "var(--border-3)" }} />

      <GlassDropdown
        value={filters.client}
        onChange={(v) => setFilters({ ...filters, client: v })}
        options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
        placeholder="All Clients"
        width="w-40"
      />

      <div className="h-5 w-px shrink-0" style={{ background: "var(--border-3)" }} />

      {/* Year text input */}
      <input
        className="h-8 w-20 rounded-lg px-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
        style={{
          background:           "var(--border-1)",
          border:               "1px solid var(--border-4)",
          backdropFilter:       "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        placeholder="Year"
        value={filters.year}
        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
        onFocus={(e) => {
          e.target.style.border    = "1px solid var(--blue-border)";
          e.target.style.boxShadow = "0 0 0 3px var(--blue-bg-subtle)";
        }}
        onBlur={(e) => {
          e.target.style.border    = "1px solid var(--border-4)";
          e.target.style.boxShadow = "none";
        }}
      />

      {/* Clear */}
      {anyFilter && (
        <button
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 transition-all hover:text-slate-200"
          style={{
            background: "var(--surface-3)",
            border:     "1px solid var(--surface-5)",
          }}
          onClick={() => setFilters({ status: "", year: "", client: "" })}
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );

  if (embedded) {
    // Filters + Upload live in PayrollWorkspace's tab row now — just render the table.
    return (
      <div style={{ position: "relative", zIndex: 0 }}>
        {batchTable()}
        {uploadOpen && (
          <UploadPayrollModal
            clients={clients}
            onClose={() => setUploadOpen(false)}
            onUploaded={(batch) => navigate(`/payroll/batches/${batch.id}`)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 0 }}>

      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: onBack || smartBack },
          { label: "Batches" },
        ]}
      />

      <WorkspaceHeader
        title="Payroll Batches"
        onBack={onBack || smartBack}
        actions={filterBar}
      />

      {/* ── Table ─────────────────────────────────────────────────── */}
      {batchTable()}

      {uploadOpen && (
        <UploadPayrollModal
          clients={clients}
          onClose={() => setUploadOpen(false)}
          onUploaded={(batch) => navigate(`/payroll/batches/${batch.id}`)}
        />
      )}
    </div>
  );
}

/* ── Text action button ── */
function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-400 transition-all duration-150 hover:text-blue-300"
      style={{ background: "var(--blue-bg-subtle)", border: "1px solid var(--blue-bg-strong)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--blue-bg-strong)";
        e.currentTarget.style.border     = "1px solid var(--blue-border)";
        e.currentTarget.style.boxShadow  = "0 0 12px var(--blue-bg-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--blue-bg-subtle)";
        e.currentTarget.style.border     = "1px solid var(--blue-bg-strong)";
        e.currentTarget.style.boxShadow  = "none";
      }}
    >
      {label}
    </button>
  );
}

/* ── Icon-only button ── */
function IconBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:text-slate-200"
      style={{ background: "var(--surface-2)", border: "1px solid var(--surface-5)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-5)";
        e.currentTarget.style.border     = "1px solid var(--surface-8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface-2)";
        e.currentTarget.style.border     = "1px solid var(--surface-5)";
      }}
    >
      {children}
    </button>
  );
}