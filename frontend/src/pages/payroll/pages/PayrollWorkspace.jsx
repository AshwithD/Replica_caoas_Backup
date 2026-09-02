import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2, Layers, Clock3, CheckCircle2,
  AlertTriangle, Loader2, ArrowUpRight, FileSpreadsheet,
  LayoutGrid, List, ShieldCheck, Inbox, Bell,
} from "lucide-react";
import { useClients, useOverviewStats, useBatches } from "../_kit/hooks/hooks";
import { api } from "../_kit/api/client";
import { ErrorState, Skeleton, Button, Card, Badge } from "../_kit/components/primitives";
import { DashboardStatCard } from "../_kit/components/StatCard";
import Breadcrumb from "../_kit/components/Breadcrumb";
import WorkspaceHeader from "../_kit/components/WorkspaceHeader";
import EmptyState from "../_kit/components/EmptyState";
import { useSmartBack } from "../_kit/utils/utils";
import BatchList from "./BatchList";
import EmailLogBatches from "./EmailLogBatches";

/* ── "someone submitted something" signal ─────────────────────────────────
   The dashboard shouldn't need a click to reveal that a client sent their
   monthly input. This polls a tiny counter endpoint (two aggregate queries,
   no serialization) every 60s and, if that endpoint isn't deployed yet,
   falls back to counting the submissions list client-side. ─────────────── */
function usePortalAlerts() {
  const [stats, setStats] = useState({ awaiting_review: 0, pending_items: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api.get("payroll/portal-submissions/stats/");
        if (alive && res?.data && typeof res.data.awaiting_review === "number") {
          setStats(res.data);
          return;
        }
      } catch { /* fall through to the list */ }
      try {
        const res = await api.get("payroll/portal-submissions/");
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (!alive) return;
        setStats({
          awaiting_review: list.filter((s) => s.status === "SUBMITTED").length,
          pending_items: list.reduce((n, s) => n + Number(s.pending_item_count || 0), 0),
        });
      } catch { /* leave the badge hidden rather than break the dashboard */ }
    };
    load();
    const timer = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { alive = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, []);

  return stats;
}

/* ── one card per client — the real landing surface now that payroll is
   multi-client. Shows this client's own batch counts (computed client-side
   from the already-fetched batches list, filtered by client id — no extra
   endpoint needed) and jumps straight into "Upload Payroll" pre-scoped to
   this client. ────────────────────────────────────────────────────────── */
function ClientCard({ client, batches, onOpen }) {
  const clientBatches = batches.filter((b) => String(b.client) === String(client.id));
  const pending = clientBatches.filter((b) => b.status === "UPLOADED").length;
  const latest = clientBatches[0];

  return (
    <Card
      className="p-4 flex flex-col gap-3 transition-all hover:brightness-105"
      style={{ cursor: "pointer" }}
      onClick={() => onOpen(client)}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
        >
          {client.logo ? (
            <img src={client.logo} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 size={18} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
            {client.name}
          </h3>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {client.email || "No email on file"}
          </p>
        </div>
        {pending > 0 && <Badge tone="amber">{pending} pending</Badge>}
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span><strong style={{ color: "var(--text-strong)" }}>{clientBatches.length}</strong> batches</span>
        {latest && (
          <span className="truncate">
            Latest: {String(latest.month).padStart(2, "0")}/{latest.year} · <Badge tone={latest.status === "COMPLETED" ? "green" : latest.status === "FAILED" ? "red" : "blue"}>{latest.status}</Badge>
          </span>
        )}
      </div>
    </Card>
  );
}

/* ── same data as ClientCard, laid out as a compact horizontal row for
   list view. ──────────────────────────────────────────────────────── */
function ClientListRow({ client, batches, onOpen, isLast }) {
  const clientBatches = batches.filter((b) => String(b.client) === String(client.id));
  const pending = clientBatches.filter((b) => b.status === "UPLOADED").length;
  const latest = clientBatches[0];

  return (
    <div
      className="px-1 py-2.5 flex items-center gap-4 transition-colors hover:opacity-90"
      style={{
        cursor: "pointer",
        borderBottom: isLast ? "none" : "1px solid var(--border-3)",
      }}
      onClick={() => onOpen(client)}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ background: "var(--surface-3)" }}
      >
        {client.logo ? (
          <img src={client.logo} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Building2 size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      <h3 className="text-sm font-semibold shrink-0 flex-1" style={{ color: "var(--text-strong)" }}>
        {client.name}
      </h3>

      <p className="hidden sm:block text-xs w-48 shrink-0 truncate" style={{ color: "var(--text-muted)" }}>
        {client.email || "No email on file"}
      </p>

      <div className="hidden sm:block text-xs w-20 shrink-0" style={{ color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-strong)" }}>{clientBatches.length}</strong> batches
      </div>

      {latest && (
        <div className="hidden md:flex items-center gap-2 text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
          <span>Latest: {String(latest.month).padStart(2, "0")}/{latest.year}</span>
          <Badge tone={latest.status === "COMPLETED" ? "green" : latest.status === "FAILED" ? "red" : "blue"}>{latest.status}</Badge>
        </div>
      )}

      {pending > 0 && <Badge tone="amber">{pending} pending</Badge>}

      <ArrowUpRight size={15} style={{ color: "var(--text-subtle)" }} className="shrink-0" />
    </div>
  );
}

export default function PayrollWorkspace() {
  // "overview" = the dashboard-style landing screen.
  // "batches" / "emails" = defer entirely to the standalone list component —
  // no workspace stat cards, no workspace filter row, just the full list
  // experience nested inside the workspace shell.
  //
  // This is driven by the ?view= URL param (not bare local state) so that
  // it survives being pushed onto browser history: opening the batches tab
  // pushes /payroll?view=batches, and navigating into a batch review pushes
  // /payroll/batches/:id on top of that. That way the back button on
  // BatchReview (which pops history) lands back on the batches tab instead
  // of remounting the Workspace fresh at "overview".
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "overview";
  const [clientView, setClientView] = useState("grid"); // "grid" | "list"
  const navigate = useNavigate();
  const smartBack = useSmartBack("/payroll");

  const clientsQuery = useClients();
  const allClients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  // Payroll Workspace only ever runs payroll for active clients — an
  // inactive client (toggled off in Firm Details) simply drops out of this
  // list here, without being deleted or altered; re-activating it in Firm
  // Details is what brings it back.
  const clients = allClients.filter((c) => c.is_active !== false);
  const statsQuery = useOverviewStats();
  const stats = statsQuery.data;
  const batchesQuery = useBatches({});
  const batches = batchesQuery.data?.results ?? batchesQuery.data ?? [];
  // Client-portal signal for the header button / banner below.
  const portal = usePortalAlerts();
  const awaiting = Number(portal.awaiting_review || 0);

  const openBatches    = () => navigate("/payroll?view=batches");
  const openBatchesWithStatus = (status) => navigate(`/payroll?view=batches&status=${status}`);
  const openEmails     = () => navigate("/payroll?view=emails");
  const openEmailsWithOutcome = (outcome) => navigate(`/payroll?view=emails&outcome=${outcome}`);
  const backToOverview = smartBack;

  const totalBatches  = Object.values(stats?.status_overview ?? {}).reduce((a, b) => a + b, 0);
  const pendingReview = stats?.pending_review ?? 0;
  const inProgress    = stats?.status_overview?.in_progress ?? 0;
  const emailsSent    = stats?.emails_sent ?? 0;
  const failedEmails  = stats?.failed_emails ?? 0;

  const overviewStatCards = (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <DashboardStatCard icon={Building2}     value={clients.length}   label="Clients"
        subtext="active payroll clients" tone="slate"  onClick={() => navigate("/payroll/firm-details")} />
      <DashboardStatCard icon={Layers}        value={totalBatches}     label="Total Batches"
        subtext="all batches"            tone="blue"   onClick={openBatches} />
      <DashboardStatCard icon={Loader2}       value={inProgress}       label="In Progress"
        subtext="uploaded · reviewing"    tone="purple" onClick={() => openBatchesWithStatus("SENDING")} />
      <DashboardStatCard icon={Clock3}        value={pendingReview}    label="Pending Review"
        subtext="needs action"           tone="amber"  onClick={() => openBatchesWithStatus("UPLOADED")} />
      <DashboardStatCard icon={CheckCircle2}  value={emailsSent}       label="Emails Sent"
        subtext="delivered payslips"      tone="green"  onClick={() => openEmailsWithOutcome("sent")} />
      <DashboardStatCard icon={AlertTriangle} value={failedEmails}     label="Failed Emails"
        subtext="needs retry"            tone="red"    onClick={() => openEmailsWithOutcome("failed")} />
    </div>
  );

  return (
    <div className="flex min-h-full flex-col gap-3" style={{ zoom: 0.9 }}>

      {view === "overview" && (
        <Breadcrumb
          items={[
            { label: "🏦 Payroll" },
            { label: "Dashboard" },
          ]}
        />
      )}

      {/* Header only shows on overview — the standalone BatchList/EmailLogs
          bring their own sticky WorkspaceHeader (with title, back button,
          and filter bar) in non-embedded mode, and we don't want to stack
          two headers. */}
      {view === "overview" && (
        <Card className="px-4 py-1">
          <WorkspaceHeader
            title="Payroll Automation"
            subtitle="Multi-client payroll — pick a client below to upload this month's payroll."
            actions={
              <>
                <Button size="sm" variant="secondary" onClick={() => navigate("/payroll/portal-users")}>
                  <ShieldCheck size={14} /> Portal Users
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/payroll/portal-submissions")}
                  title={
                    awaiting > 0
                      ? `${awaiting} client submission${awaiting === 1 ? "" : "s"} awaiting your review`
                      : "No submissions awaiting review"
                  }
                  aria-label={
                    awaiting > 0
                      ? `Portal Submissions, ${awaiting} awaiting review`
                      : "Portal Submissions"
                  }
                  style={
                    awaiting > 0
                      ? { background: "var(--amber-bg)", border: "1px solid var(--amber-border)", color: "var(--amber-text-strong)" }
                      : undefined
                  }
                >
                  <span style={{ position: "relative", display: "inline-flex" }}>
                    <Inbox size={14} />
                    {awaiting > 0 && (
                      // unread dot — visible even when the button is narrow
                      <span
                        style={{
                          position: "absolute", top: -3, right: -3, width: 7, height: 7,
                          borderRadius: "50%", background: "var(--red-solid)",
                          boxShadow: "0 0 0 2px var(--surface-1)",
                        }}
                      />
                    )}
                  </span>
                  Portal Submissions
                  {awaiting > 0 && (
                    <span
                      style={{
                        minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                        background: "var(--red-solid)", color: "#fff",
                        fontSize: 11, fontWeight: 700, lineHeight: "18px", textAlign: "center",
                      }}
                    >
                      {awaiting > 99 ? "99+" : awaiting}
                    </span>
                  )}
                </Button>
              </>
            }
          />
        </Card>
      )}

      {/* Nobody should have to open the page to find out a client submitted. */}
      {view === "overview" && awaiting > 0 && (
        <Card
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          style={{ background: "var(--amber-bg-subtle)", borderColor: "var(--amber-border)" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--amber-bg-strong)", color: "var(--amber-text-strong)" }}
          >
            <Bell size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
              {awaiting} client submission{awaiting === 1 ? "" : "s"} awaiting your review
            </span>
            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
              {portal.pending_items > 0
                ? `${portal.pending_items} change${portal.pending_items === 1 ? "" : "s"} still to be applied`
                : "Open Portal Submissions to approve and apply the changes."}
              {portal.last_submitted_at
                ? ` · latest ${new Date(portal.last_submitted_at).toLocaleString()}`
                : ""}
            </span>
          </span>
          <Button size="sm" onClick={() => navigate("/payroll/portal-submissions")}>
            Review now <ArrowUpRight size={14} />
          </Button>
        </Card>
      )}

      {view === "overview" && <div className="h-1" />}

      {statsQuery.isLoading ? (
        <Skeleton className="h-32" />
      ) : statsQuery.isError ? (
        <ErrorState message="Failed to load payroll overview." onRetry={statsQuery.refetch} />
      ) : view === "overview" ? (
        <div className="flex flex-1 flex-col gap-5">
          {/* Stat cards */}
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : overviewStatCards}

          {/* Clients — the real landing surface now */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Clients</h3>
              <div className="flex items-center gap-3">
                {clients.length > 0 && (
                  <div
                    className="flex items-center gap-0.5 rounded-lg p-0.5"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
                  >
                    <button
                      onClick={() => setClientView("grid")}
                      title="Grid view"
                      className="flex items-center justify-center rounded-md p-1.5 transition-all"
                      style={{
                        background: clientView === "grid" ? "var(--surface-1)" : "transparent",
                        color: clientView === "grid" ? "var(--text-strong)" : "var(--text-muted)",
                        border: clientView === "grid" ? "1px solid var(--border-3)" : "1px solid transparent",
                      }}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setClientView("list")}
                      title="List view"
                      className="flex items-center justify-center rounded-md p-1.5 transition-all"
                      style={{
                        background: clientView === "list" ? "var(--surface-1)" : "transparent",
                        color: clientView === "list" ? "var(--text-strong)" : "var(--text-muted)",
                        border: clientView === "list" ? "1px solid var(--border-3)" : "1px solid transparent",
                      }}
                    >
                      <List size={14} />
                    </button>
                  </div>
                )}
                {/* Always available — even with no active clients, this is the
                    way through to Firm Details to switch payroll on for one. */}
                {(
                  <button
                    onClick={() => navigate("/payroll/firm-details")}
                    className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: "var(--blue-text)" }}
                  >
                    Manage all <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {clientsQuery.isLoading || batchesQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : clientsQuery.isError ? (
              <ErrorState message="Failed to load clients." onRetry={clientsQuery.refetch} />
            ) : clients.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  emoji="🏢"
                  message="No clients running payroll yet — open Manage all to switch payroll on for a client."
                />
              </Card>
            ) : clientView === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    batches={batches}
                    onOpen={(c) => navigate(`/payroll/clients/${c.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col rounded-xl px-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}>
                {clients.map((client, i) => (
                  <ClientListRow
                    key={client.id}
                    client={client}
                    batches={batches}
                    onOpen={(c) => navigate(`/payroll/clients/${c.id}`)}
                    isLast={i === clients.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick links to the two full lists — batches/emails are one
              click away, without permanently occupying overview space
              with preview panels. */}
          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={openBatches}
              className="group flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:brightness-110"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)" }}>
                <FileSpreadsheet size={17} style={{ color: "var(--blue-text-strong)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>All Payroll Batches</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{totalBatches} total · {pendingReview} pending review</p>
              </div>
              <ArrowUpRight size={16} style={{ color: "var(--text-subtle)" }} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={openEmails}
              className="group flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:brightness-110"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--purple-bg)", border: "1px solid var(--purple-border)" }}>
                <CheckCircle2 size={17} style={{ color: "var(--purple-text-strong)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Email Delivery Logs</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{emailsSent} sent · {failedEmails} failed</p>
              </div>
              <ArrowUpRight size={16} style={{ color: "var(--text-subtle)" }} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      ) : view === "batches" ? (
        /* Full standalone BatchList — its own sticky header (with back
           button), filter bar, upload button. No workspace stat cards
           to compete for space. */
        <BatchList onBack={backToOverview} />
      ) : (
        /* Full standalone EmailLogBatches — same treatment. Clicking a
           batch navigates to /payroll/email-logs/:batchId for the
           detailed per-batch log (EmailLogs.jsx). */
        <EmailLogBatches onBack={backToOverview} />
      )}

    </div>
  );
}