import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Mail, Phone, FileText, Pencil } from "lucide-react";
import { Badge, Button, Card, ErrorState, Input, Modal, Skeleton, Textarea } from "../_kit/components/primitives";
import { useClients, useAppMutations } from "../_kit/hooks/hooks";
import PageHero from "../_kit/components/PageHero";
import EmptyState from "../_kit/components/EmptyState";
import Breadcrumb from "../_kit/components/Breadcrumb";

const FIELDS = [
  ["name", "Client Name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "text"],
  ["pan", "PAN", "text"],
  ["tan", "TAN", "text"],
  ["gstin", "GSTIN", "text"],
  ["pf_establishment_code", "PF Establishment Code", "text"],
];

export function ClientFormModal({ client, onClose, onSaved }) {
  const { mutateSaveClient } = useAppMutations();
  const [form, setForm] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    pan: client?.pan || "",
    tan: client?.tan || "",
    gstin: client?.gstin || "",
    pf_establishment_code: client?.pf_establishment_code || "",
    address: client?.address || "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) {
      setError("Client name is required.");
      return;
    }
    setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v ?? ""));
      if (logoFile) body.append("logo", logoFile);
      await mutateSaveClient.mutateAsync({ id: client?.id, formData: body });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save client details.");
    }
  };

  return (
    <Modal title={client ? "Edit Client" : "Add Client"} onClose={onClose} size="m">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg shrink-0"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
          >
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="logo preview" className="h-full w-full object-contain p-1" />
            ) : client?.logo ? (
              <img src={client.logo} alt="client logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 size={22} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
              Client Logo
            </label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-xs" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {FIELDS.map(([key, label, type]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
              </label>
              <Input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Address
          </label>
          <Textarea rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Button variant="secondary" onClick={onClose} disabled={mutateSaveClient.isPending}>Cancel</Button>
          <Button onClick={save} disabled={mutateSaveClient.isPending}>
            {mutateSaveClient.isPending ? "Saving…" : "Save Client"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
            {client.is_active === false && <Badge tone="red">Inactive</Badge>}
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
        subtitle="The CA firm's payroll-service clients — each one runs its own monthly payroll and employee master."
        action={
          <Button onClick={() => setModalClient(null)}>
            <Plus size={16} />
            Add Client
          </Button>
        }
      />

      {list.length === 0 ? (
        <Card className="p-5">
          <EmptyState emoji="🏢" message="No clients added yet. Click “Add Client” to onboard the first one." />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((client) => (
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