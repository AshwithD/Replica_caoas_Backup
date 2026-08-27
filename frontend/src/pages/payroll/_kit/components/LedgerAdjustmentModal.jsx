import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button, Modal } from "./primitives";
import { api, apiPath } from "../api/client";

/**
 * pages/payroll/_kit/LedgerAdjustmentModal.jsx
 *
 * Self-contained ledger-adjustment modal for BatchReview.jsx, covering all
 * four ledger types: comp_off, leave, salary_advance, on_hold.
 *
 * Instead of asking for a signed number, the user picks Grant (adds to the
 * balance) or Deduct (subtracts from it) and enters a positive amount/day
 * count — the sign is applied on submit. For salary_advance grants, there's
 * an additional one-time vs EMI choice: one-time posts a plain positive
 * SalaryAdvanceAdjustment (same endpoint pattern as leave/comp-off/on-hold),
 * while EMI posts to the salary-advances/ endpoint with tenure_months,
 * which creates the plan + its disbursement adjustment server-side and
 * auto-generates monthly recovery adjustments on later batches.
 *
 * Props: employee ({id, ...}), type ("comp_off" | "leave" | "salary_advance" | "on_hold"), onClose
 */

const TYPE_CONFIG = {
  comp_off: { label: "Comp-Off", endpoint: "comp-off-adjustments/", unit: "days", grantWord: "Grant", deductWord: "Deduct" },
  leave: { label: "Leave", endpoint: "leave-adjustments/", unit: "days", grantWord: "Grant", deductWord: "Deduct" },
  salary_advance: { label: "Salary Advance", endpoint: "salary-advance-adjustments/", unit: "₹", grantWord: "Grant Advance", deductWord: "Record Recovery" },
  on_hold: { label: "On-Hold", endpoint: "on-hold-adjustments/", unit: "₹", grantWord: "Put On Hold", deductWord: "Release" },
};

export function LedgerAdjustmentModal({ employee, type, onClose }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.leave;
  const isMoney = config.unit === "₹";
  const isSalaryAdvance = type === "salary_advance";

  const [direction, setDirection] = useState("grant"); // "grant" | "deduct"
  const [advanceMode, setAdvanceMode] = useState("one_time"); // "one_time" | "emi" — salary_advance grants only
  const [amount, setAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEmiGrant = isSalaryAdvance && direction === "grant" && advanceMode === "emi";

  const submit = async () => {
    if (!amount || Number(amount) <= 0 || !reason.trim()) {
      setError("A positive amount and reason are both required.");
      return;
    }
    if (isEmiGrant && (!tenureMonths || Number(tenureMonths) < 1)) {
      setError("Number of months is required for an EMI plan.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (isEmiGrant) {
        await api.post(apiPath("salary-advances/"), {
          employee: employee?.id,
          total_amount: amount,
          tenure_months: tenureMonths,
          reason: reason.trim(),
        });
      } else {
        const signedAmount = direction === "deduct" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
        await api.post(apiPath(config.endpoint), {
          employee: employee?.id,
          amount: signedAmount,
          reason: reason.trim(),
        });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save adjustment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Adjust ${config.label} Balance`} onClose={onClose} size="s">
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {employee?.full_name || employee?.employee_code} — choose whether to{" "}
          {config.grantWord.toLowerCase()} or {config.deductWord.toLowerCase()}, then enter the
          amount. Takes effect on the next payroll batch.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection("grant")}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{
              border: `1px solid ${direction === "grant" ? "var(--green-border)" : "var(--border-4)"}`,
              background: direction === "grant" ? "var(--green-bg-subtle)" : "var(--surface-1)",
              color: direction === "grant" ? "var(--green-text-strong)" : "var(--text-secondary)",
            }}
          >
            <Plus size={13} /> {config.grantWord}
          </button>
          <button
            type="button"
            onClick={() => setDirection("deduct")}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{
              border: `1px solid ${direction === "deduct" ? "var(--red-border)" : "var(--border-4)"}`,
              background: direction === "deduct" ? "var(--red-bg-subtle)" : "var(--surface-1)",
              color: direction === "deduct" ? "var(--red-text-strong)" : "var(--text-secondary)",
            }}
          >
            <Minus size={13} /> {config.deductWord}
          </button>
        </div>

        {isSalaryAdvance && direction === "grant" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdvanceMode("one_time")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                border: `1px solid ${advanceMode === "one_time" ? "var(--blue-border)" : "var(--border-4)"}`,
                background: advanceMode === "one_time" ? "var(--blue-bg-subtle)" : "var(--surface-1)",
                color: advanceMode === "one_time" ? "var(--blue-text-strong)" : "var(--text-secondary)",
              }}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => setAdvanceMode("emi")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                border: `1px solid ${advanceMode === "emi" ? "var(--blue-border)" : "var(--border-4)"}`,
                background: advanceMode === "emi" ? "var(--blue-bg-subtle)" : "var(--surface-1)",
                color: advanceMode === "emi" ? "var(--blue-text-strong)" : "var(--text-secondary)",
              }}
            >
              EMI (Monthly)
            </button>
          </div>
        )}

        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {isMoney ? "Amount (₹)" : "Amount (days)"}
        </label>
        <input
          type="number"
          min="0"
          step={isMoney ? "1" : "0.5"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter a positive amount"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />

        {isEmiGrant && (
          <>
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Number of Months
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(e.target.value)}
              placeholder="e.g. 6"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
            {amount && tenureMonths > 0 && (
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                ≈ ₹{(Number(amount) / Number(tenureMonths)).toFixed(2)} recovered per month for {tenureMonths} month(s).
              </p>
            )}
          </>
        )}

        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />

        {error && (
          <p className="text-xs" style={{ color: "var(--red-text)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-1">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Save Adjustment"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}