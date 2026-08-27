import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, Clock, Send, Eye, ChevronRight, X } from "lucide-react";
import { useBatches, useClients } from "../_kit/hooks/hooks";
import { Badge, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import Breadcrumb from "../_kit/components/Breadcrumb";
import GlassDropdown from "../_kit/components/GlassDropdown";
import { formatDateTime, MONTHS, unwrapList, useSmartBack } from "../_kit/utils/utils";
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

/* ─────────────────────────────────────────────────────────────
   PagingFooter — shared visual pattern used across the app
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Main page — batch-grouped email log list. Clicking a batch
   opens its detailed email log (EmailLogs.jsx in detail mode).
───────────────────────────────────────────────────────────── */
export default function EmailLogBatches({ embedded = false, filters = {}, onBack }) {
  const [page, setPage] = useState(1);
  const [clientFilter, setClientFilter] = useState("");
  const [outcomeOverride, setOutcomeOverride] = useState(null); // null = follow URL, "" = explicitly cleared
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const smartBack = useSmartBack("/payroll");

  const clientsQuery = useClients();
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];

  // In embedded mode the parent already scopes filters (e.g. ClientWorkspace
  // locks to one client) — only apply the local dropdown when standalone.
  const effectiveFilters = embedded ? filters : { ...filters, client: clientFilter || undefined };

  const batchesQuery = useBatches(effectiveFilters);
  const allBatches = unwrapList(batchesQuery.data);

  // Standalone mode also supports an `outcome` URL param (e.g. from the
  // overview's Emails Sent / Failed Emails stat cards) — since sent/failed
  // are per-batch counts, not a batch field the backend can filter on,
  // this narrows the already-fetched list client-side. outcomeOverride
  // lets the user clear it without touching the URL.
  const outcome = embedded ? null : (outcomeOverride !== null ? outcomeOverride : searchParams.get("outcome"));
  const batches = !outcome
    ? allBatches
    : outcome === "failed"
      ? allBatches.filter((b) => (b.email_failed || 0) > 0)
      : outcome === "sent"
        ? allBatches.filter((b) => (b.email_sent || 0) > 0)
        : allBatches;

  useEffect(() => { setPage(1); }, [batches.length]);

  const totalPages = Math.max(1, Math.ceil(batches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBatches = batches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openBatch = (batchId) => navigate(`/payroll/email-logs/${batchId}`);

  const table = (
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
                <tr style={tableHeaderRowStyle}>
                  {["Period", "Status", "Sent", "Failed", "Created"].map((col) => (
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
                        onClick={() => openBatch(batch.id)}
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
                        <td style={{ ...tdStyle, color: "var(--green-text-strong)" }}>{batch.email_sent}</td>
                        <td style={{ ...tdStyle, color: batch.email_failed > 0 ? "var(--red-text-strong)" : "var(--text-secondary)" }}>
                          {batch.email_failed}
                        </td>
                        <td style={{ ...tdStyle, color: "var(--text-tertiary)", fontSize: "12px" }}>
                          {formatDateTime(batch.created_at)}
                        </td>
                       
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center gap-3 py-16">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-bg-strong)" }}
                        >
                          <Mail size={22} className="text-blue-400" />
                        </div>
                        <p className="text-sm text-slate-500">No batches found.</p>
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
        value={clientFilter}
        onChange={setClientFilter}
        options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
        placeholder="All Clients"
        width="w-40"
      />

      {outcome && (
        <span
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
          style={{
            background: outcome === "failed" ? "var(--red-bg-subtle)" : "var(--green-bg-subtle)",
            border: `1px solid ${outcome === "failed" ? "var(--red-bg-strong)" : "var(--green-border)"}`,
            color: outcome === "failed" ? "var(--red-text-strong)" : "var(--green-text-strong)",
          }}
        >
          {outcome === "failed" ? "Batches with failed emails" : "Batches with sent emails"}
        </span>
      )}

      {(clientFilter || outcome) && (
        <button
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 transition-all hover:text-slate-200"
          style={{ background: "var(--surface-3)", border: "1px solid var(--surface-5)" }}
          onClick={() => {
            setClientFilter("");
            setOutcomeOverride("");
          }}
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );

  if (embedded) {
    return <div style={{ position: "relative", zIndex: 0 }}>{table}</div>;
  }

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 0 }}>
      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: onBack || smartBack },
          { label: "Email Logs" },
        ]}
      />
      <WorkspaceHeader
        title="Email Logs"
        subtitle="Select a batch to see its payslip email delivery log."
        onBack={onBack || smartBack}
        actions={filterBar}
      />
      {table}
    </div>
  );
}