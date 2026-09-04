import { useState } from "react";
import { Building2, Palette } from "lucide-react";
import { Button, Input, Modal } from "../_kit/components/primitives";
import { useAppMutations } from "../_kit/hooks/hooks";
import ChooseDesignModal from "./ChooseDesignModal";

/**
 * "Edit Payroll Settings" modal.
 *
 * Payroll does NOT own client identity — name / email / phone / PAN / TAN /
 * GSTIN / address all live on the master `clients.Client` row and are edited
 * in the Client module. Payroll only owns the `ClientProfile` extension
 * (README §5, §7.10), so this modal renders exactly those four fields:
 *
 *   payroll_logo           → payslip letterhead logo
 *   payroll_email          → payslip / portal mail override
 *   pf_establishment_code  → printed on payslips
 *   pdf_design             → payslip layout 1-8
 *
 * Nothing else is sent to the API, so a payroll user can never overwrite a
 * field belonging to the Client module.
 */
export default function PayrollSettingsModal({ client, onClose, onSaved }) {
  const { mutateSaveClient } = useAppMutations();

  const [payrollEmail, setPayrollEmail] = useState(client?.payroll_email || "");
  const [pfCode, setPfCode] = useState(client?.pf_establishment_code || "");
  const [logoFile, setLogoFile] = useState(null);
  const [design, setDesign] = useState(client?.pdf_design || 1);
  const [choosingDesign, setChoosingDesign] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    try {
      // Payroll-owned fields only — deliberately no identity fields here.
      const body = new FormData();
      body.append("payroll_email", payrollEmail ?? "");
      body.append("pf_establishment_code", pfCode ?? "");
      body.append("pdf_design", design);
      if (logoFile) body.append("logo", logoFile);
      await mutateSaveClient.mutateAsync({ id: client?.id, formData: body });
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save payroll settings.");
    }
  };

  return (
    <Modal title="Edit Payroll Settings" onClose={onClose} size="m">
      <div className="space-y-4">
        {/* ── Payslip logo (payroll's own copy) ───────────────────────── */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg shrink-0"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
          >
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="logo preview" className="h-full w-full object-contain p-1" />
            ) : client?.logo ? (
              <img src={client.logo} alt="payslip logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 size={22} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
              Payslip Logo
            </label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-xs" />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Used on payslip letterheads — payroll&apos;s own copy of the logo.
            </p>
          </div>
        </div>

        {/* ── Payroll email ──────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Payroll Email
          </label>
          <Input type="email" value={payrollEmail} onChange={(e) => setPayrollEmail(e.target.value)} placeholder={client?.email || "payroll@client.com"} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Payslips and portal mail go here. Leave blank to use the client&apos;s email.
          </p>
        </div>

        {/* ── PF establishment code ──────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            PF Establishment Code
          </label>
          <Input type="text" value={pfCode} onChange={(e) => setPfCode(e.target.value)} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Printed on payslips where applicable.
          </p>
        </div>

        {/* ── Payslip design ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Payslip Design
            </label>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Design {design} selected
            </span>
          </div>
          <div
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
          >
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Design {design}
            </span>
            <Button size="sm" variant="secondary" onClick={() => setChoosingDesign(true)} disabled={!client}>
              <Palette size={13} /> Choose Design
            </Button>
          </div>
        </div>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Button variant="secondary" onClick={onClose} disabled={mutateSaveClient.isPending}>Cancel</Button>
          <Button onClick={save} disabled={mutateSaveClient.isPending}>
            {mutateSaveClient.isPending ? "Saving…" : "Save Payroll Settings"}
          </Button>
        </div>
      </div>

      {choosingDesign && client && (
        <ChooseDesignModal
          client={client}
          onClose={() => setChoosingDesign(false)}
          onSaved={(picked) => {
            setDesign(picked ?? client?.pdf_design ?? 1);
            setChoosingDesign(false);
          }}
        />
      )}
    </Modal>
  );
}
