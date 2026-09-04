import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Input, Modal } from "../_kit/components/primitives";
import { api, apiPath } from "../_kit/api/client";
import { MONTHS } from "../_kit/utils/utils";

/**
 * Per-employee payslip correction — "Edit Details" step of the
 * Employee Workspace payslip flow (add/fix details → regenerate PDF →
 * send email, all scoped to ONE employee).
 *
 * This exists because mistakes surface *after* a batch has been emailed,
 * and re-running the whole batch is the wrong remedy — only this one
 * employee's payslip must change. The backend allows the edit only when
 * `post_send_correction` is passed (PayslipRecordViewSet.partial_update),
 * still writes every change to PayslipRecordEdit, and drops the record
 * back to DRAFT so the stale PDF has to be regenerated and re-sent.
 */
const SECTIONS = [
  {
    title: "Attendance",
    fields: [
      ["days_in_month", "Days in Month"],
      ["actual_working_days", "Actual Working Days"],
      ["extra_working_days", "Extra Working Days"],
      ["paid_leave_days", "Paid Leave Days"],
      ["lop_days", "LOP Days"],
    ],
  },
  {
    title: "Earnings",
    fields: [
      ["basic_da", "Basic + DA"],
      ["hra", "HRA"],
      ["lta", "LTA"],
      ["special_allowance", "Special Allowance"],
      ["nps_allowance_earned", "NPS Allowance"],
      ["variable_pay", "Variable Pay"],
      ["commission_other", "Commission / Other"],
      ["arrears", "Arrears"],
      ["reimbursements", "Reimbursements"],
    ],
  },
  {
    title: "Deductions",
    fields: [
      ["tds", "TDS"],
      ["epf", "EPF (employee)"],
      ["vpf", "VPF"],
      ["professional_tax", "Professional Tax"],
      ["nps_deduction", "NPS Deduction"],
      ["vpf_arrears", "VPF Arrears"],
      ["nps_deduction_arrears", "NPS Deduction Arrears"],
      ["loan_deduction", "Loan Deduction"],
      ["lwf", "LWF"],
      ["other_deduction", "Other Deduction"],
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map(([k]) => k));

export default function PayslipCorrectionModal({ record, employeeName, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(ALL_KEYS.map((k) => [k, record?.[k] ?? 0]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const alreadySent = record?.status === "EMAIL_SENT";
  const period = `${MONTHS[(record?.batch_month || 1) - 1]} ${record?.batch_year || ""}`;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      // Only send fields the user actually changed — keeps the audit trail
      // (PayslipRecordEdit) free of no-op rows.
      const changed = {};
      ALL_KEYS.forEach((k) => {
        if (String(form[k] ?? "") !== String(record?.[k] ?? "")) changed[k] = form[k] === "" ? 0 : form[k];
      });
      if (Object.keys(changed).length === 0) {
        onClose();
        return;
      }
      const res = await api.patch(apiPath(`records/${record.id}/`), {
        ...changed,
        post_send_correction: true,
      });
      onSaved?.(res.data);
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.detail || (data && JSON.stringify(data)) || "Failed to save payslip changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Payslip — ${employeeName} · ${period}`} onClose={onClose} size="l">
      <div className="space-y-4">
        {alreadySent && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: "var(--amber-bg, #fff7ed)", border: "1px solid var(--amber-border, #fed7aa)", color: "var(--amber-text, #9a3412)" }}
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              This payslip has already been emailed. Saving records a correction in the edit
              history and resets it to DRAFT — you must regenerate the PDF and send the email
              again for this employee.
            </span>
          </div>
        )}

        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <h4 className="text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
              {section.title.toUpperCase()}
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              {section.fields.map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form[key] ?? ""}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Gross, total deductions and net salary are always recomputed by payroll — you never key
          them in. Editing attendance re-derives the prorated pay components automatically.
        </p>

        {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </div>
    </Modal>
  );
}
