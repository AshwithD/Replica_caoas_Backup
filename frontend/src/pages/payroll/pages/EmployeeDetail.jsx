import { useEffect, useState } from "react";
import { Badge, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import WorkspaceHeader from "../_kit/components/WorkspaceHeader";
import { formatCurrency, formatDateTime, useSmartBack } from "../_kit/utils/utils";
import { api, apiPath } from "../_kit/api/client";

const STRUCTURE_ROWS = [
  ["ctc_annual", "CTC (Annual)"],
  ["monthly_gross", "Monthly Gross"],
  ["original_basic_da", "Basic + DA"],
  ["original_hra", "HRA"],
  ["original_special_allowance", "Special Allowance"],
  ["original_lta", "Leave Travel Allowance"],
  ["nps_allowance", "NPS Allowance (Employer)"],
  ["fbp", "FBP"],
  ["vpf", "VPF"],
];

export default function EmployeeDetail({ employeeId }) {
  const goBack = useSmartBack("/payroll/employees");
  const [state, setState] = useState({ data: null, isLoading: true, isError: false });

  useEffect(() => {
    setState({ data: null, isLoading: true, isError: false });
    api
      .get(apiPath(`salary-structures/employees/${employeeId}/`))
      .then((res) => setState({ data: res.data, isLoading: false, isError: false }))
      .catch(() => setState({ data: null, isLoading: false, isError: true }));
  }, [employeeId]);

  const { data: emp, isLoading, isError } = state;

  if (isLoading) {
    return (
      <div className="payroll-scope p-4 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (isError || !emp) {
    return (
      <div className="payroll-scope p-4">
        <ErrorState message="Failed to load employee details." />
      </div>
    );
  }

  const structure = emp.salary_structure;

  return (
    <div className="payroll-scope p-4 max-w-3xl mx-auto space-y-4">
      <WorkspaceHeader title={emp.full_name} subtitle={emp.employee_code || "—"} onBack={goBack} />

      <Card className="p-5 grid gap-3 md:grid-cols-2">
        <Info label="Position" value={emp.position || "—"} />
        <Info label="Department" value={emp.department || "—"} />
        <Info label="Email" value={emp.email || "—"} />
        <Info label="Hire Date" value={formatDateTime(emp.hire_date)} />
        <Info label="Status" value={<Badge tone={emp.status === "active" ? "green" : "slate"}>{emp.status}</Badge>} />
        <Info label="Base CTC (employee record)" value={formatCurrency(emp.ctc)} />
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-strong)" }}>
          Current Salary Structure
        </h3>
        {structure ? (
          <>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Effective from {structure.effective_from} · {structure.pf_opted ? "PF applicable" : "PF not applicable"}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {STRUCTURE_ROWS.map(([key, label]) => (
                <div key={key} className="flex justify-between text-sm py-1" style={{ borderBottom: "1px solid var(--border-1)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span className="font-medium tabular-nums" style={{ color: "var(--text-strong)" }}>
                    {formatCurrency(structure[key])}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No salary structure has been set up for this employee yet.
          </p>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
    </div>
  );
}
