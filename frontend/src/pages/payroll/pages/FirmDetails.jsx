import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, Phone, FileText, Pencil, Search } from "lucide-react";
import { Badge, Button, Card, ErrorState, Input, Skeleton } from "../_kit/components/primitives";
import { useClients, useAppMutations } from "../_kit/hooks/hooks";
import PageHero from "../_kit/components/PageHero";
import EmptyState from "../_kit/components/EmptyState";
import Breadcrumb from "../_kit/components/Breadcrumb";
import ClientFormModal from "../modals/PayrollSettingsModal";

/**
 * Payroll never edits client identity (name/email/phone/PAN/TAN/GSTIN/
 * address) — those belong to the Client module's `clients.Client` master
 * row. Editing here only exposes the payroll-owned `ClientProfile` fields,
 * so `ClientFormModal` is now just the payroll-settings modal, kept under
 * its old name so existing imports keep working.
 */
export { default as ClientFormModal } from "../modals/PayrollSettingsModal";

function ClientCard({ client, onEdit, onToggleStatus, togglePending }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-xl shrink-0"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
        >
          {client.logo ? (
            <img src={client.logo} alt="client logo" className="h-full w-full object-contain p-1.5" />
          ) : (
            <Building2 size={24} style={{ color: "var(--text-muted)" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold truncate" style={{ color: "var(--text-strong)" }}>
              {client.name}
            </h3>
            {client.master_is_active === false
              ? <Badge tone="red">Deactivated in Client module</Badge>
              : client.is_active === false && <Badge tone="red">Payroll inactive</Badge>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1 text-sm">
            {client.address && (
              <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
                <Building2 size={13} className="shrink-0" /> <span className="truncate">{client.address}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
                <Mail size={13} className="shrink-0" /> <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
                <Phone size={13} className="shrink-0" /> <span className="truncate">{client.phone}</span>
              </div>
            )}
            {client.gstin && (
              <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
                <FileText size={13} className="shrink-0" /> <span className="truncate">GSTIN: {client.gstin}</span>
              </div>
            )}
            {client.pan && (
              <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
                <FileText size={13} className="shrink-0" /> <span className="truncate">PAN: {client.pan}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={() => onEdit(client)}>
            <Pencil size={13} /> Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={togglePending}
            onClick={() => onToggleStatus(client)}
            style={
              client.is_active === false
                ? { color: "var(--green-text)", border: "1px solid var(--green-border)", background: "var(--green-bg-subtle)" }
                : { color: "var(--red-text)", border: "1px solid var(--red-border)", background: "var(--red-bg-subtle)" }
            }
          >
            {client.is_active === false ? "Activate" : "Deactivate"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function FirmDetails() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError, refetch } = useClients();
  const { mutateSaveClient } = useAppMutations();
  const list = Array.isArray(clients) ? clients : clients?.results || [];
  const [modalClient, setModalClient] = useState(undefined); // undefined = closed, null = "add new"
  const [query, setQuery] = useState("");

  // The "Clients / active payroll clients" stat card links here with
  // ?status=active, so the drill-down must apply the same condition the card
  // counted with — previously it landed on the unfiltered list, which showed
  // inactive clients too.
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") === "active" ? "active"
    : searchParams.get("status") === "inactive" ? "inactive" : "all";
  const setStatus = (next) => {
    const p = new URLSearchParams(searchParams);
    if (next === "all") p.delete("status"); else p.set("status", next);
    setSearchParams(p, { replace: true });
  };

  // A client is an active payroll client only when BOTH the master
  // clients.Client.is_active switch and the payroll toggle are on.
  const isActivePayrollClient = (c) =>
    c.is_effectively_active !== undefined
      ? c.is_effectively_active === true
      : c.is_active === true;

  const statusFiltered = useMemo(() => {
    if (status === "active") return list.filter(isActivePayrollClient);
    if (status === "inactive") return list.filter((c) => !isActivePayrollClient(c));
    return list;
  }, [list, status]);

  // Search on top of the status filter — the list keeps whatever order the
  // API returns it in.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter((c) =>
      ["name", "email", "payroll_email", "phone", "pan", "tan", "gstin"]
        .some((k) => String(c[k] || "").toLowerCase().includes(q))
    );
  }, [statusFiltered, query]);

  const toggleClientStatus = async (client) => {
    const nextActive = client.is_active === false ? true : false;
    try {
      await mutateSaveClient.mutateAsync({ id: client.id, formData: { is_active: nextActive } });
      refetch();
    } catch (err) {
      console.error("Failed to update client status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="payroll-scope p-4 space-y-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isError) return <div className="payroll-scope p-4"><ErrorState message="Failed to load clients." onRetry={refetch} /></div>;

  return (
    <div className="payroll-scope p-4 space-y-6">
      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: () => navigate("/payroll") },
          { label: "Clients" },
        ]}
      />
      <PageHero
        eyebrow="Payroll"
        title="Clients"
        subtitle="The CA firm's payroll-service clients — each one runs its own monthly payroll and employee master. Clients are added in the Client module; switch payroll on for one here."
      />

      {/* ── search ─────────────────────────────────────────────────────── */}
      {list.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status filter — reflects/controls ?status= in the URL so the
              stat-card drill-down is visible and undoable. */}
          <div className="flex items-center gap-1 rounded-lg p-0.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}>
            {[
              { key: "all", label: `All (${list.length})` },
              { key: "active", label: `Active (${list.filter(isActivePayrollClient).length})` },
              { key: "inactive", label: `Inactive (${list.filter((c) => !isActivePayrollClient(c)).length})` },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatus(opt.key)}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                style={status === opt.key
                  ? { background: "#001F5B", color: "var(--text-white)" }
                  : { color: "var(--text-secondary)" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative w-full" style={{ maxWidth: 320 }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, PAN, GSTIN…"
              style={{ paddingLeft: 30 }}
            />
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <Card className="p-5">
          <EmptyState emoji="🏢" message="No clients yet. Add one in the Client module — it will appear here, ready to switch payroll on." />
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            emoji="🔍"
            message={query
              ? `No ${status === "all" ? "" : `${status} `}client matches “${query}”.`
              : `No ${status} clients.`}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setModalClient}
              onToggleStatus={toggleClientStatus}
              togglePending={mutateSaveClient.isPending}
            />
          ))}
        </div>
      )}

      {modalClient !== undefined && (
        <ClientFormModal
          client={modalClient}
          onClose={() => setModalClient(undefined)}
          onSaved={() => {
            setModalClient(undefined);
            refetch();
          }}
        />
      )}
    </div>
  );
}