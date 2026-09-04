import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react";
import {
  Badge, Button, Card, ErrorState, Input, Modal, Skeleton,
} from "../_kit/components/primitives";
import { useClients } from "../_kit/hooks/hooks";
import { api } from "../_kit/api/client";
import PageHero from "../_kit/components/PageHero";
import Breadcrumb from "../_kit/components/Breadcrumb";
import EmptyState from "../_kit/components/EmptyState";
import ClientLogo from "../_kit/components/ClientLogo";
import PasswordField, { passwordChecks } from "../_kit/components/PasswordField";

const ROLE_LABELS = { editor: "Editor", client_admin: "Client Admin" };

/**
 * Shows the client's actual current password in the list.
 *
 * The backend keeps a Fernet-encrypted copy alongside the hash purely so
 * payroll staff can read a credential back to the client they created it
 * for. It stays hidden until explicitly revealed so the value is not sitting
 * on screen during a screen-share, and can be copied in one click.
 */
function PasswordCell({ value }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  if (!value) {
    return (
      <span className="text-xs" style={{ color: "var(--text-subtle)" }} title="Set before passwords were recoverable — reset it to see the value.">
        password not recoverable
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <code
        className="rounded px-1.5 py-0.5 text-xs"
        style={{
          background: "var(--surface-2)", border: "1px solid var(--border-3)",
          color: shown ? "var(--text-primary)" : "var(--text-muted)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: shown ? 0 : "0.12em",
        }}
      >
        {shown ? value : "•".repeat(Math.min(value.length, 12))}
      </code>
      <button type="button" onClick={() => setShown((v) => !v)} className="p-0.5 hover:opacity-70"
        title={shown ? "Hide password" : "Show password"} aria-label={shown ? "Hide password" : "Show password"}
        style={{ color: "var(--text-muted)" }}>
        {shown ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button type="button" onClick={copy} className="p-0.5 hover:opacity-70" title="Copy password" aria-label="Copy password"
        style={{ color: copied ? "var(--green-text)" : "var(--text-muted)" }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </span>
  );
}
const ROLE_TONES = { editor: "blue", client_admin: "purple" };

function usePortalUsers() {
  const [state, setState] = useState({ data: undefined, isLoading: true, isError: false });
  const load = () => {
    setState((s) => ({ ...s, isLoading: true, isError: false }));
    api.get("payroll/portal-users/")
      .then((res) => setState({ data: res.data, isLoading: false, isError: false }))
      .catch(() => setState({ data: undefined, isLoading: false, isError: true }));
  };
  useEffect(load, []);
  return { ...state, refetch: load };
}

const EMPTY_FORM = {
  email: "", client: "", role: "editor", password: "", password_confirm: "",
  is_active: true, must_change_password: true,
};

function PortalUserModal({ user, clients, onClose, onSaved }) {
  const [form, setForm] = useState(
    user
      ? {
          email: user.email || "",
          client: String(user.client || ""),
          role: user.role || "editor",
          // Blank means "keep the current password" — the existing value is
          // shown separately in a read-only Current Password row above.
          password: "",
          password_confirm: "",
          is_active: user.is_active !== false,
          must_change_password: user.must_change_password !== false,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.client) { setError("A client must be selected."); return; }
    if (!user && !form.password) { setError("A password is required for a new portal user."); return; }
    // Validate client-side against the same rules the backend enforces, so
    // staff see the problem immediately instead of after a failed POST.
    if (form.password) {
      const failed = passwordChecks(form.password).filter((c) => !c.ok && !c.optional);
      if (failed.length) { setError(`Password is too weak — ${failed[0].label.toLowerCase()}.`); return; }
      if (form.password !== form.password_confirm) { setError("Passwords do not match."); return; }
    }
    setError(""); setSaving(true);
    const body = {
      email: form.email.trim().toLowerCase(),
      client: Number(form.client),
      role: form.role,
      is_active: form.is_active,
      must_change_password: form.must_change_password,
    };
    if (form.password) body.password = form.password;
    try {
      if (user) await api.patch(`payroll/portal-users/${user.id}/`, body);
      else await api.post("payroll/portal-users/", body);
      onSaved();
    } catch (err) {
      setError(
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.password?.[0]
            || err?.response?.data?.email?.[0]
            || "Failed to save portal user.",
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (label, node) => (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {node}
    </div>
  );

  const selectedClient = clients.find((c) => String(c.id) === String(form.client));
  const title = (
    <span className="flex items-center gap-3">
      <ClientLogo name={selectedClient?.name} logo={selectedClient?.logo || user?.client_logo} size={34} />
      <span>
        <span className="block text-base font-semibold" style={{ color: "var(--text-strong)" }}>
          {user ? "Edit Portal User" : "New Portal User"}
        </span>
        <span className="block text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {selectedClient?.name || user?.client_name || "Pick the client this login belongs to"}
        </span>
      </span>
    </span>
  );

  return (
    <Modal title={title} onClose={onClose} size="m">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {field("Email", (
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="hr@client.com" />
          ))}
          {field("Client", (
            <select
              value={form.client}
              onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }}
            >
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ))}
          {field("Role", (
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)", color: "var(--text-primary)" }}
            >
              <option value="editor">Editor</option>
              <option value="client_admin">Client Admin</option>
            </select>
          ))}
        </div>

        {/* Existing users: show the password that is live right now, above
            the reset field. Staff own these credentials and are usually here
            to read the current one back to the client, not to change it. */}
        {user && (
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Current Password
            </label>
            <div
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}
            >
              <PasswordCell value={user.password_plain} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {user.password_plain
                ? "This is the password the client logs in with today."
                : "This login was created before passwords were recoverable — set a new one below to make it visible."}
            </p>
          </div>
        )}

        {/* Password gets its own full-width row: staff read this value out to
            the client, so it is shown in clear text by default, can be
            generated/copied, and is checked against the backend's rules live. */}
        <PasswordField
          label={user ? "Reset Password (leave blank to keep the current one)" : "Password"}
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          confirmValue={form.password_confirm}
          onConfirmChange={(v) => setForm((f) => ({ ...f, password_confirm: v }))}
          optional={!!user}
          hint="Share this with the client securely. They will be asked to change it on first login if the option below is ticked."
        />

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={form.must_change_password} onChange={(e) => setForm((f) => ({ ...f, must_change_password: e.target.checked }))} />
            Must change password on next login
          </label>
        </div>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : user ? "Save Changes" : "Create User"}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function PortalUsers() {
  const navigate = useNavigate();
  const { data: users, isLoading, isError, refetch } = usePortalUsers();
  const clientsQuery = useClients();
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  const list = Array.isArray(users) ? users : users?.results || [];
  // payroll/clients/ carries the uploaded logo; keyed by id so a row can brand
  // itself even if the portal-user payload predates the client_logo field.
  const clientById = Object.fromEntries(clients.map((c) => [String(c.id), c]));
  const [modal, setModal] = useState(undefined); // undefined = closed, null = new
  const [busyId, setBusyId] = useState(null);

  const toggleActive = async (u) => {
    setBusyId(u.id);
    try {
      await api.patch(`payroll/portal-users/${u.id}/`, { is_active: u.is_active === false });
      refetch();
    } catch { /* surface nothing; refetch shows truth */ }
    finally { setBusyId(null); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete portal login for ${u.email}?`)) return;
    setBusyId(u.id);
    try { await api.delete(`payroll/portal-users/${u.id}/`); refetch(); }
    catch { /* noop */ }
    finally { setBusyId(null); }
  };

  return (
    <div className="payroll-scope p-4 space-y-6">
      <Breadcrumb items={[
        { label: "🏦 Payroll" },
        { label: "Dashboard", onClick: () => navigate("/payroll") },
        { label: "Portal Users" },
      ]} />
      <PageHero
        eyebrow="Client Portal"
        title="Portal Users"
        subtitle="Login credentials your clients use to open the payroll portal. Stored in the payroll module — never part of the internal staff accounts."
        action={<Button onClick={() => setModal(null)}><Plus size={16} /> New Portal User</Button>}
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <ErrorState message="Failed to load portal users." onRetry={refetch} />
      ) : list.length === 0 ? (
        <Card className="p-5">
          <EmptyState emoji="🔑" message="No portal users yet. Create the first login for a client." />
        </Card>
      ) : (
        <Card className="divide-y" style={{ borderColor: "var(--border-3)" }}>
          {list.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-4 py-3">
              {/* the client's own logo (payroll_logo), so a freshly created
                  login is recognisable instead of showing a placeholder icon;
                  clients without a logo fall back to their initials */}
              <ClientLogo
                name={u.client_name || clientById[String(u.client)]?.name}
                logo={u.client_logo || clientById[String(u.client)]?.logo}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>{u.email}</span>
                  <Badge tone={u.is_active === false ? "red" : "slate"}>{u.is_active === false ? "Inactive" : "Active"}</Badge>
                  <Badge tone={ROLE_TONES[u.role] || "slate"}>{ROLE_LABELS[u.role] || u.role}</Badge>
                  {u.must_change_password && <Badge tone="amber">password change pending</Badge>}
                </div>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {u.client_name || `Client #${u.client}`}
                  {u.last_login ? ` · last login ${new Date(u.last_login).toLocaleDateString()}` : " · never logged in"}
                </p>
                {/* The live password, revealable — staff own these credentials
                    and routinely have to read them back to the client. */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Password</span>
                  <PasswordCell value={u.password_plain} />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="secondary" disabled={busyId === u.id} onClick={() => setModal(u)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button size="sm" variant="secondary" disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                  {u.is_active === false ? "Activate" : "Deactivate"}
                </Button>
                <Button size="sm" variant="secondary" disabled={busyId === u.id} onClick={() => remove(u)} style={{ color: "var(--red-text)" }}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {modal !== undefined && (
        <PortalUserModal
          user={modal}
          clients={clients}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); refetch(); }}
        />
      )}
    </div>
  );
}
