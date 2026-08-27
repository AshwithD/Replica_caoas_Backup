import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAppMutations } from "../_kit/hooks/hooks";
import { Button, Input, Modal, Textarea } from "../_kit/components/primitives";
import MonthYearPicker from "../_kit/components/MonthYearPicker";
import { formatCurrency } from "../_kit/utils/utils";

// Statutory PF ceiling reserve, mirrors payroll/models.py EmployeeSalaryStructure.build_from_ctc()
const PF_WAGE_CEILING = 15000;
// Employer-side PF share ONLY, once Basic >= ceiling (below the ceiling,
// 12% of Basic). The employee's own 12% share is NOT carved out here —
// it's deducted separately every month as the payslip's EPF line
// (see calculations.py), so carving it out here too would double-charge
// the employee. Only the employer's share needs to be reserved at
// structuring time because it's a CTC cost that never appears as one of
// the employee's own salary components.
const PF_FLAT_RESERVE = 1800;

// Local YYYY-MM-01 for "this month", built from local date parts (not
// .toISOString(), which converts to UTC — for India (UTC+5:30), that
// would silently roll back to the previous month between 12:00–5:30 AM
// IST on the 1st of any month).
function currentMonthLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Derives Basic+DA, HRA, and Special Allowance from CTC per the firm's
 * confirmed structuring rule — kept in sync with the server-side version
 * in payroll/models.py EmployeeSalaryStructure.build_from_ctc(), which is
 * the version actually used when saving (this client copy only drives
 * the live preview as the user types, before submit).
 */
function getPfReserve(basicDa, pfOpted) {
  if (!pfOpted) return 0;
  return basicDa >= PF_WAGE_CEILING ? PF_FLAT_RESERVE : 0.12 * basicDa;
}

function computeFromCTC(ctcAnnual, currentLTA, pfOpted) {
  const monthlyPool = Number(ctcAnnual || 0) / 12;
  const half = 0.5 * monthlyPool;
  const lta = Number(currentLTA || 0);
  const floorApplies = monthlyPool >= 25000 && half < 25000;
  let basic = floorApplies ? 25000 : half;

  let hra = Math.max(0, Math.min(0.5 * basic, monthlyPool - basic - lta));
  let specialAllowance = Math.max(0, monthlyPool - basic - hra - lta);

  if (pfOpted) {
    const pfReserve = getPfReserve(basic, pfOpted);
    const fromSA = Math.min(specialAllowance, pfReserve);
    specialAllowance -= fromSA;
    let shortfall = pfReserve - fromSA;
    if (shortfall > 0) {
      const fromHRA = Math.min(hra, shortfall);
      hra -= fromHRA;
      shortfall -= fromHRA;
    }
    if (shortfall > 0) {
      basic = Math.max(0, basic - shortfall);
    }
  }

  return {
    original_basic_da: Math.round(basic * 100) / 100,
    original_hra: Math.round(hra * 100) / 100,
    original_special_allowance: Math.round(specialAllowance * 100) / 100,
    monthly_gross: Math.round(monthlyPool * 100) / 100,
  };
}

const moneyFields = [
  ["ctc_annual",                "CTC Annual"],
  ["monthly_gross",             "Monthly Gross"],
  ["original_basic_da",         "Basic + DA"],
  ["original_hra",              "HRA"],
  ["original_special_allowance","Special Allowance"],
  ["original_lta",              "Leave Travel Allowance"],
  ["nps_allowance",             "NPS Allowance (Employer)"],
  ["fbp",                       "FBP"],
  ["vpf",                       "VPF"],
];

const gridFields = moneyFields.filter(([key]) => key !== "ctc_annual");

export function SalaryStructureForm({ employee, onSaved, onCancel }) {
  // employee.salary_structure comes from
  // payroll.serializers.EmployeeWithStructureSerializer (see
  // payroll/views.py EmployeeSalaryStructureViewSet.list_employees /
  // employee_detail) — the newer project's `employee.latest_salary_structure`
  // property doesn't exist here, so the payroll API returns it as a plain
  // nested field on the employee payload instead.
  const current = employee?.salary_structure;
  const { mutateUpdateSalaryStructure } = useAppMutations();

  const { register, watch, control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      effective_from:            currentMonthLocal(),
      change_reason:             "",
      ctc_annual:                current?.ctc_annual ?? 0,
      fbp:                       current?.fbp ?? 0,
      monthly_gross:             current?.monthly_gross ?? 0,
      original_basic_da:         current?.original_basic_da ?? 0,
      original_hra:              current?.original_hra ?? 0,
      original_lta:              current?.original_lta ?? 0,
      original_special_allowance:current?.original_special_allowance ?? 0,
      nps_allowance:             current?.nps_allowance ?? 0,
      vpf:                       current?.vpf ?? 0,
      pf_opted:                  current?.pf_opted ?? true,
    },
  });

  const values       = watch();
  const monthlyGross = Number(values.monthly_gross || 0);
  const componentSum = ["original_basic_da", "original_hra", "original_lta", "original_special_allowance", "nps_allowance"]
    .reduce((sum, key) => sum + Number(values[key] || 0), 0);
  const pfReserve    = getPfReserve(Number(values.original_basic_da || 0), values.pf_opted);
  const componentSumWithPf = Math.round((componentSum + pfReserve) * 100) / 100;
  const mismatch     = Math.round(monthlyGross * 100) !== Math.round(componentSumWithPf * 100);

  useEffect(() => {
    if (!values.ctc_annual || Number(values.ctc_annual) <= 0) return;
    const result = computeFromCTC(values.ctc_annual, values.original_lta, values.pf_opted);
    setValue("original_basic_da", result.original_basic_da, { shouldDirty: true });
    setValue("original_hra", result.original_hra, { shouldDirty: true });
    setValue("original_special_allowance", result.original_special_allowance, { shouldDirty: true });
    setValue("monthly_gross", result.monthly_gross, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.ctc_annual, values.original_lta, values.pf_opted]);

  const diffs = useMemo(() => {
    if (!current) return [];
    return moneyFields
      .map(([key, label]) => ({ key, label, old: Number(current[key] || 0), next: Number(values[key] || 0) }))
      .filter((item) => item.old !== item.next);
  }, [current, values]);

  const submit = (data) => {
    const payload = { ...data };
    if (payload.effective_from?.length === 7) payload.effective_from += "-01";
    moneyFields.forEach(([key]) => { payload[key] = Number(payload[key] || 0); });
    mutateUpdateSalaryStructure.mutate({ id: employee.id, data: payload }, { onSuccess: onSaved });
  };

  const apiError = mutateUpdateSalaryStructure.error;
  const apiErrorMessage = (() => {
    if (!apiError) return null;
    const d = apiError?.response?.data;
    if (!d) return apiError.message || "An unexpected error occurred.";
    if (typeof d === "string") return d;
    if (d.detail) return d.detail;
    return Object.entries(d)
      .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join(" · ");
  })();

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">

      {/* Effective From + Change Reason row */}
      <div className={`grid gap-4 items-start ${current ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-strong)" }}>
            Effective From
          </label>
          <Controller
            name="effective_from"
            control={control}
            rules={{ required: "Effective date is required" }}
            render={({ field }) => {
              const [y, m] = field.value ? field.value.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
              return (
                <MonthYearPicker
                  month={m}
                  year={y}
                  onChange={(month, year) => field.onChange(`${year}-${String(month).padStart(2, "0")}-01`)}
                />
              );
            }}
          />
          {errors.effective_from && <FieldError msg={errors.effective_from.message} />}
        </div>

        {current && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-strong)" }}>
              Change Reason
            </label>
            <Textarea
              rows={4}
              className="min-h-0"
              {...register("change_reason", { required: "Change reason is required" })}
              placeholder="Annual increment, promotion, correction…"
            />
            {errors.change_reason && <FieldError msg={errors.change_reason.message} />}
          </div>
        )}
      </div>

      {/* Diff panel — full width below */}
      {current && diffs.length > 0 && (
        <div className="rounded-lg p-3 text-[11px] leading-relaxed"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
          <p className="font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>
            Diff vs Current
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-0.5">
            {diffs.map((item) => {
              const up = item.next > item.old;
              return (
                <p key={item.key} style={{ color: up ? "var(--green-text-strong)" : "var(--red-text-strong)" }}>
                  {item.label}: {up ? "▲" : "▼"} {formatCurrency(Math.abs(item.next - item.old))}
                </p>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-2.5 md:grid-cols-2 items-start">
        <FieldRow label="CTC Annual">
          <Input
            type="number"
            min="0"
            step="0.01"
            className="max-w-[220px]"
            {...register("ctc_annual", {
              required: "CTC Annual is required",
              min: { value: 0, message: "Must be 0 or more" },
            })}
          />
          {errors.ctc_annual && <FieldError msg={errors.ctc_annual.message} />}
        </FieldRow>
        <label className="flex items-center gap-2 text-xs font-medium whitespace-nowrap rounded-xl px-3 py-2.5 w-fit"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-strong)" }}>
          <input type="checkbox" {...register("pf_opted")} className="h-4 w-4" />
          PF Applicable
        </label>
      </div>
      <p className="text-[11px] -mt-2" style={{ color: "var(--text-subtle)" }}>
        Basic + DA, HRA, Special Allowance and Monthly Gross auto-fill from CTC (LTA stays manual).
        Values remain fully editable afterward.
      </p>

      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>
          Salary Components
        </p>
        <div className="grid gap-2.5 md:grid-cols-2">
          {gridFields.map(([key, label]) => (
            <FieldRow key={key} label={label}>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="max-w-[220px]"
                {...register(key, { min: { value: 0, message: "Must be 0 or more" } })}
              />
              {errors[key] && <FieldError msg={errors[key].message} />}
            </FieldRow>
          ))}
        </div>
      </div>

      <div className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
        <p>
          Monthly Gross: <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(monthlyGross)}</span>
          {"  ·  "}
          Component Sum: <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(componentSum)}</span>
          {values.pf_opted && pfReserve > 0 && (
            <>
              {"  ·  "}
              + PF Reserve (HRA/SA): <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(pfReserve)}</span>
              {"  =  "}
              <span className="font-semibold tabular-nums" style={{ color: mismatch ? "var(--amber-text-strong)" : "var(--text-primary)" }}>{formatCurrency(componentSumWithPf)}</span>
            </>
          )}
        </p>
        {mismatch && (
          <p style={{ color: "var(--amber-text-strong)" }}>
            Monthly Gross doesn't match component sum + PF reserve. You can still save.
          </p>
        )}
      </div>

      {apiErrorMessage && (
        <div className="rounded-lg px-3 py-1.5 text-xs leading-relaxed"
          style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-bg-strong)", color: "var(--red-text-strong)" }}>
          {apiErrorMessage}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={mutateUpdateSalaryStructure.isPending}>
          {mutateUpdateSalaryStructure.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function SalaryStructureModal({ employee, onClose }) {
  return (
    <Modal title={`Update Salary Structure — ${employee?.full_name}`} onClose={onClose} size="m">
      <SalaryStructureForm employee={employee} onSaved={onClose} onCancel={onClose} />
    </Modal>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <label className="text-xs font-medium w-36 shrink-0 pt-2.5" style={{ color: "var(--text-strong)" }}>
        {label}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <p className="text-xs mt-1" style={{ color: "var(--red-text-strong)" }}>{msg}</p>
  );
}