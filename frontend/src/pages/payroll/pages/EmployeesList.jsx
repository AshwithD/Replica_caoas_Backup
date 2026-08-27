import { useEffect, useRef, useState } from "react";
import { Users, UserCheck, UserX, Filter, Upload, Plus, Download, FileUp, FileSpreadsheet, X, Info, Eye } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { Badge, Button, Card, ErrorState, Modal, Skeleton, Input, Textarea } from "../_kit/components/primitives";
import PageHero from "../_kit/components/PageHero";
import EmptyState from "../_kit/components/EmptyState";
import GlassDropdown from "../_kit/components/GlassDropdown";
import { formatCurrency } from "../_kit/utils/utils";
import { api, apiPath } from "../_kit/api/client";
import { useClients, useAppMutations } from "../_kit/hooks/hooks";
import SalaryStructureModal from "../modals/SalaryStructureModal";
import MonthYearPicker from "../_kit/components/MonthYearPicker";

const STRUCTURE_FILTER_OPTIONS = [
  { value: "with", label: "Has Structure" },
  { value: "without", label: "No Structure" },
];

function useEmployeesWithStructure(search, clientId) {
  const [state, setState] = useState({ data: [], isLoading: true, isError: false });

  const load = () => {
    setState((s) => ({ ...s, isLoading: true, isError: false }));
    const params = {};
    if (search) params.search = search;
    if (clientId) params.client = clientId;
    api
      .get(apiPath("salary-structures/employees/"), { params })
      .then((res) => setState({ data: res.data, isLoading: false, isError: false }))
      .catch(() => setState({ data: [], isLoading: false, isError: true }));
  };

  useEffect(load, [search, clientId]);
  return { ...state, refetch: load };
}

/* ── file drop zone (mirrors UploadPayrollModal) ─────────────────────── */
function EmployeeFileDropZone({ file, onChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.name.endsWith(".xlsx")) onChange(f);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
      style={{
        minHeight: 96,
        background: dragging ? "var(--blue-bg)" : file ? "var(--green-bg-subtle)" : "var(--surface-2)",
        border: `2px dashed ${dragging ? "var(--blue-border)" : file ? "var(--green-border)" : "var(--border-4)"}`,
      }}
    >
      <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />

      {file ? (
        <>
          <FileSpreadsheet size={22} style={{ color: "var(--green-text-strong)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--green-text-strong)" }}>{file.name}</span>
          <span className="text-xs" style={{ color: "var(--green-text-strong)" }}>
            {(file.size / 1024).toFixed(1)} KB
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full"
            style={{ background: "var(--red-bg)", color: "var(--red-text-strong)" }}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <FileUp size={22} style={{ color: "var(--text-subtle)" }} />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Drop .xlsx here or <span style={{ color: "var(--blue-text)" }}>browse</span>
          </span>
        </>
      )}
    </div>
  );
}

/* ── validation error table (mirrors UploadPayrollModal) ─────────────── */
function EmployeeValidationErrors({ data }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-bg-strong)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--red-text-strong)" }}>
        Import rejected — {data?.total_errors} row{data?.total_errors !== 1 ? "s" : ""} with errors
      </p>
      <p className="text-xs mt-1 mb-4" style={{ color: "var(--red-text-strong)" }}>
        Fix all errors in Excel and re-upload. No employees were created or updated.
      </p>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Row", "Employee Code", "Error"].map((h) => (
              <th key={h} className="text-left pb-2 font-medium px-2"
                style={{ color: "var(--red-text-strong)", borderBottom: "1px solid var(--red-bg-strong)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.errors?.map((row) => (
            <tr key={`${row.row}-${row.employee_code}`}
              style={{ borderBottom: "1px solid var(--red-bg-subtle)" }}>
              <td className="px-2 py-2" style={{ color: "var(--red-text-strong)" }}>{row.row}</td>
              <td className="px-2 py-2" style={{ color: "var(--red-text-strong)" }}>{row.employee_code || "—"}</td>
              <td className="px-2 py-2" style={{ color: "var(--red-text-strong)" }}>{row.errors.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── bulk employee-master import modal ──────────────────────────────── */
export function ImportEmployeesModal({ clientId, onClose, onImported }) {
  const { mutateImportEmployees } = useAppMutations();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const downloadTemplate = async () => {
    try {
      // Try to get the backend template first
      const response = await api.get(apiPath("template/employee-template/"), { responseType: "blob" });
      
      // If successful, use it but it's the basic one
      // For enhanced template with salary structure, we'll need backend support
      // For now, download what backend provides
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Employee_Master_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Template download failed:", err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("client_id", clientId);
    fd.append("file", file);
    mutateImportEmployees.mutate(fd, {
      onSuccess: (data) => {
        setResult(data);
        onImported?.();
      },
    });
  };

  const error = mutateImportEmployees.error?.response;

  return (
    <Modal title="Import Employees" onClose={onClose} size="m">
      <form onSubmit={submit} className="space-y-5">

        {/* file drop zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}>Excel File</label>
          <EmployeeFileDropZone file={file} onChange={setFile} />
        </div>

        {/* info banner */}
        <div className="rounded-lg px-4 py-3 text-xs leading-relaxed flex items-start gap-2"
          style={{ background: "var(--blue-bg-subtle)", border: "1px solid var(--blue-bg-strong)", color: "var(--blue-text-strong)" }}>
          <Info size={13} className="shrink-0 mt-0.5" />
          Rows are matched by Employee Code — existing employees are updated, new codes are created. Salary structure is auto-calculated from CTC for new employees only, using the PF Applicable value from that row.
        </div>

        {/* Template columns guide */}
        <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
          <p className="font-semibold mb-2" style={{ color: "var(--text-strong)" }}>Template Columns:</p>
          <div className="space-y-1.5">
            <div>
              <p style={{ color: "var(--text-strong)" }}>Employee Master:</p>
              <p style={{ color: "var(--text-muted)" }}>employee_code, first_name, last_name, email, pan_number, department, position, hire_date, ctc, status, pf_applicable</p>
            </div>
            <div>
              <p style={{ color: "var(--text-strong)" }}>Salary Structure:</p>
              <p style={{ color: "var(--text-muted)" }}>Basic/HRA/Special Allowance aren't entered in Excel — they're auto-calculated from CTC when a new structure is created. PF Applicable (yes/no, defaults to yes) controls whether that auto-calculation reserves employer PF. Employees who already have a structure are left untouched — edit their structure from the employee page instead.</p>
            </div>
          </div>
        </div>

        {/* 400 error */}
        {error?.status === 400 && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-bg-strong)", color: "var(--red-text-strong)" }}>
            {error.data?.detail}
          </div>
        )}

        {/* 422 validation errors */}
        {error?.status === 422 && <EmployeeValidationErrors data={error.data} />}

        {/* success */}
        {result && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--green-bg-subtle)", border: "1px solid var(--green-border)", color: "var(--green-text-strong)" }}>
            {result.created} created, {result.updated} updated.
          </div>
        )}

        {/* actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button"
            onClick={downloadTemplate}
            className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium">
            <Download size={15} /> Download Template
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              disabled={mutateImportEmployees.isPending}
              className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button type="submit" disabled={!file || mutateImportEmployees.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--blue-bg-strong)", border: "1px solid var(--blue-border)",
                color: "var(--blue-text-strong)", opacity: (!file || mutateImportEmployees.isPending) ? .5 : 1,
                cursor: (!file || mutateImportEmployees.isPending) ? "not-allowed" : "pointer",
              }}>
              <FileUp size={15} />
              {mutateImportEmployees.isPending ? "Importing…" : "Import"}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}

/* ── single employee add/edit modal ─────────────────────────────────── */
const EMPLOYEE_FIELDS = [
  ["employee_code", "Employee Code", "text"],
  ["first_name", "First Name", "text"],
  ["last_name", "Last Name", "text"],
  ["email", "Email", "email"],
  ["pan_number", "PAN Number", "text"],
  ["department", "Department", "text"],
  ["position", "Position", "text"],
  ["hire_date", "Hire Date", "date"],
  ["ctc", "CTC (Annual)", "number"],
];

// Tab bar component for EmployeeFormModal
function TabBar({ activeTab, onChange, isEditMode }) {
  const tabs = [
    { key: "info", label: "Employee Info" },
    { key: "salary", label: "Salary Structure" },
  ];

  return (
    <div className="flex gap-4 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-3)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          disabled={isEditMode && tab.key === "salary"}
          className="text-sm font-medium pb-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: activeTab === tab.key ? "var(--blue-text-strong)" : "var(--text-muted)",
            borderBottom: activeTab === tab.key ? "2px solid var(--blue-solid)" : "2px solid transparent",
            marginBottom: -1,
          }}
          title={isEditMode && tab.key === "salary" ? "Salary structure is only available when adding new employees" : ""}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Helper function for current month in local time
function currentMonthLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

// PF calculation helpers
const PF_WAGE_CEILING = 15000;
const PF_FLAT_RESERVE = 1800;

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

const SALARY_STRUCTURE_FIELDS = [
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

// Helper components for forms
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

export function EmployeeFormModal({ employee, clients = [], defaultClientId, clientName, onClose, onSaved }) {
  const { mutateSaveEmployee, mutateUpdateSalaryStructure } = useAppMutations();
  const isEditMode = !!employee;
  const [activeTab, setActiveTab] = useState("info");

  // Employee form state - initialize with employee data if provided
  const [form, setForm] = useState({
    employee_code: employee?.employee_code || "",
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    email: employee?.email || "",
    pan_number: employee?.pan_number || "",
    department: employee?.department || "",
    position: employee?.position || "",
    hire_date: employee?.hire_date || "",
    ctc: employee?.ctc ?? "",
    status: employee?.status || "active",
    client: employee?.client || defaultClientId || (clients.length === 1 ? clients[0].id : ""),
  });
  const [error, setError] = useState("");

  // Update form whenever employee object changes (for edit mode)
  useEffect(() => {
    if (employee) {
      setForm({
        employee_code: employee.employee_code || "",
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        email: employee.email || "",
        pan_number: employee.pan_number || "",
        department: employee.department || "",
        position: employee.position || "",
        hire_date: employee.hire_date || "",
        ctc: employee.ctc ?? "",
        status: employee.status || "active",
        client: employee.client || defaultClientId || (clients.length === 1 ? clients[0].id : ""),
      });
    }
  }, [employee]);

  // Salary structure form (react-hook-form)
  const { register, watch, control, handleSubmit, setValue, formState: { errors: salaryErrors } } = useForm({
    defaultValues: {
      effective_from: currentMonthLocal(),
      change_reason: "",
      ctc_annual: 0,
      fbp: 0,
      monthly_gross: 0,
      original_basic_da: 0,
      original_hra: 0,
      original_lta: 0,
      original_special_allowance: 0,
      nps_allowance: 0,
      vpf: 0,
      pf_opted: true,
    },
  });

  const salaryValues = watch();
  const monthlyGross = Number(salaryValues.monthly_gross || 0);
  const componentSum = ["original_basic_da", "original_hra", "original_lta", "original_special_allowance", "nps_allowance"]
    .reduce((sum, key) => sum + Number(salaryValues[key] || 0), 0);
  const pfReserve = getPfReserve(Number(salaryValues.original_basic_da || 0), salaryValues.pf_opted);
  const componentSumWithPf = Math.round((componentSum + pfReserve) * 100) / 100;
  const mismatch = Math.round(monthlyGross * 100) !== Math.round(componentSumWithPf * 100);

  // Auto-compute from CTC
  useEffect(() => {
    if (!salaryValues.ctc_annual || Number(salaryValues.ctc_annual) <= 0) return;
    const result = computeFromCTC(salaryValues.ctc_annual, salaryValues.original_lta, salaryValues.pf_opted);
    setValue("original_basic_da", result.original_basic_da, { shouldDirty: true });
    setValue("original_hra", result.original_hra, { shouldDirty: true });
    setValue("original_special_allowance", result.original_special_allowance, { shouldDirty: true });
    setValue("monthly_gross", result.monthly_gross, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaryValues.ctc_annual, salaryValues.original_lta, salaryValues.pf_opted]);

  const saveEmployee = async () => {
    if (!form.employee_code.trim() || !form.first_name.trim()) {
      setError("Employee Code and First Name are required.");
      return;
    }
    if (!form.client) {
      setError("Select a client.");
      return;
    }
    setError("");
    try {
      const payload = { ...form, ctc: form.ctc === "" ? null : form.ctc, hire_date: form.hire_date || null };
      const savedEmployee = await mutateSaveEmployee.mutateAsync({ id: employee?.id, data: payload });
      
      // If adding new employee and salary structure tab has data, save it too
      if (!isEditMode && activeTab === "salary" && Number(salaryValues.ctc_annual) > 0) {
        const salaryPayload = {};
        SALARY_STRUCTURE_FIELDS.forEach(([key]) => {
          salaryPayload[key] = Number(salaryValues[key] || 0);
        });
        salaryPayload.effective_from = salaryValues.effective_from;
        if (salaryPayload.effective_from?.length === 7) salaryPayload.effective_from += "-01";
        
        await mutateUpdateSalaryStructure.mutateAsync({ id: savedEmployee.id, data: salaryPayload });
      }
      
      onSaved();
    } catch (err) {
      const d = err?.response?.data;
      let message = "Failed to save employee.";
      if (typeof d === "string") {
        message = d;
      } else if (d?.detail) {
        message = d.detail;
      } else if (d?.employee_code) {
        const codeMsg = Array.isArray(d.employee_code) ? d.employee_code.join(", ") : d.employee_code;
        message = `Employee Code: ${codeMsg}`;
      } else if (d && typeof d === "object") {
        message = Object.entries(d)
          .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" · ");
      }
      setError(message);
    }
  };

  const onSalaryStructureSubmit = async (data) => {
    // When in edit mode with salary structure tab
    const payload = { ...data };
    if (payload.effective_from?.length === 7) payload.effective_from += "-01";
    SALARY_STRUCTURE_FIELDS.forEach(([key]) => { payload[key] = Number(payload[key] || 0); });
    
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
    <Modal title={employee ? "Edit Employee" : "Add Employee"} onClose={onClose} size="m">
      {/* Tab bar — only show salary tab if not editing */}
      {!isEditMode && (
        <TabBar activeTab={activeTab} onChange={setActiveTab} isEditMode={isEditMode} />
      )}

      {/* TAB 1: Employee Information */}
      {activeTab === "info" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Client</label>
            {employee ? (
              <div
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ border: "1px solid var(--border-4)", background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                {clientName || clients.find((c) => String(c.id) === String(form.client))?.name || form.client || "—"}
              </div>
            ) : (
              <select
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {EMPLOYEE_FIELDS.map(([key, label, type]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
                <input
                  key={`${key}-${employee?.id || 'new'}`}
                  type={type}
                  value={form[key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: "var(--red-text)" }}>{error}</p>}

          <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
            <Button variant="secondary" onClick={onClose} disabled={mutateSaveEmployee.isPending || mutateUpdateSalaryStructure.isPending}>Cancel</Button>
            {!isEditMode && (
              <Button variant="secondary" onClick={() => setActiveTab("salary")} disabled={mutateSaveEmployee.isPending}>
                Next: Salary Structure →
              </Button>
            )}
            <Button onClick={saveEmployee} disabled={mutateSaveEmployee.isPending || mutateUpdateSalaryStructure.isPending}>
              {mutateSaveEmployee.isPending ? "Saving…" : isEditMode ? "Update Employee" : "Save & Continue"}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: Salary Structure (only for new employees) */}
      {activeTab === "salary" && !isEditMode && (
        <form onSubmit={handleSubmit(onSalaryStructureSubmit)} className="space-y-4">
          <div className="rounded-lg px-3 py-2 text-xs leading-relaxed flex items-start gap-2"
            style={{ background: "var(--blue-bg-subtle)", border: "1px solid var(--blue-bg-strong)", color: "var(--blue-text-strong)" }}>
            <Info size={13} className="shrink-0 mt-0.5" />
            Set up salary structure for this employee. All fields are optional — you can add this later.
          </div>

          <div className="grid gap-4 items-start md:grid-cols-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-strong)" }}>
                Effective From
              </label>
              <Controller
                name="effective_from"
                control={control}
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
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 items-start">
            <FieldRow label="CTC Annual">
              <Input
                type="number"
                min="0"
                step="0.01"
                className="max-w-[220px]"
                {...register("ctc_annual", {
                  min: { value: 0, message: "Must be 0 or more" },
                })}
              />
              {salaryErrors.ctc_annual && <FieldError msg={salaryErrors.ctc_annual.message} />}
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
              {SALARY_STRUCTURE_FIELDS.filter(([key]) => key !== "ctc_annual").map(([key, label]) => (
                <FieldRow key={key} label={label}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="max-w-[220px]"
                    {...register(key, { min: { value: 0, message: "Must be 0 or more" } })}
                  />
                  {salaryErrors[key] && <FieldError msg={salaryErrors[key].message} />}
                </FieldRow>
              ))}
            </div>
          </div>

          <div className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
            <p>
              Monthly Gross: <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(monthlyGross)}</span>
              {"  ·  "}
              Component Sum: <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(componentSum)}</span>
              {salaryValues.pf_opted && pfReserve > 0 && (
                <>
                  {"  ·  "}
                  + PF Reserve: <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(pfReserve)}</span>
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

          <div className="flex justify-between gap-2 pt-1" style={{ borderTop: "1px solid var(--border-1)" }}>
            <Button type="button" variant="secondary" onClick={() => setActiveTab("info")}>
              ← Back to Info
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={mutateUpdateSalaryStructure.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutateUpdateSalaryStructure.isPending}>
                {mutateUpdateSalaryStructure.isPending ? "Saving…" : "Save Employee & Structure"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function EmployeesList({ onOpenEmployee, embedded = false, lockedClientId }) {
  const { mutateSaveEmployee: mutateToggleStatus } = useAppMutations();
  const [search, setSearch] = useState("");
  const [structureFilter, setStructureFilter] = useState("");
  const clientsQuery = useClients();
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  // In embedded mode (mounted inside a single client's ClientWorkspace tab)
  // the client is fixed by the parent and never changes — no local state,
  // no dropdown. Standalone mode keeps its own selectable clientId as before.
  const [internalClientId, setInternalClientId] = useState("");
  const clientId = embedded ? lockedClientId : internalClientId;
  const setClientId = embedded ? () => {} : setInternalClientId;
  const { data: employees, isLoading, isError, refetch } = useEmployeesWithStructure(search, clientId);

  const toggleEmployeeStatus = async (emp) => {
    const nextStatus = emp.status === "active" ? "inactive" : "active";
    try {
      await mutateToggleStatus.mutateAsync({ id: emp.id, data: { status: nextStatus } });
      refetch();
    } catch (err) {
      console.error("Failed to update employee status:", err);
    }
  };
  const [editing, setEditing] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);

  const filtered = employees.filter((emp) => {
    if (structureFilter === "with") return !!emp.salary_structure;
    if (structureFilter === "without") return !emp.salary_structure;
    return true;
  });

  const withStructure = employees.filter((e) => e.salary_structure).length;
  const withoutStructure = employees.length - withStructure;

  const actions = (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => setAdding(true)} disabled={!clientId}
        title={!clientId ? "Select a client first" : undefined}>
        <Plus size={16} />
        Add Employee
      </Button>
      <Button onClick={() => setImporting(true)} disabled={!clientId}
        title={!clientId ? "Select a client first" : undefined}>
        <Upload size={16} />
        Import Employees
      </Button>
    </div>
  );

  const filterBar = (
    <Card className="p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        <Filter size={14} /> Filters
      </div>
      {/* Client dropdown only makes sense in standalone (cross-client) mode
          — embedded mode is already scoped to one client by the parent. */}
      {!embedded && (
        <GlassDropdown
          value={clientId}
          onChange={setClientId}
          options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
          placeholder="Client"
          width="w-48"
        />
      )}
      <GlassDropdown
        value={structureFilter}
        onChange={setStructureFilter}
        options={STRUCTURE_FILTER_OPTIONS}
        placeholder="Structure"
        width="w-44"
      />
      <input
        placeholder="Search name or code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ml-auto rounded-lg px-3 py-1.5 text-sm outline-none"
        style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
      />
    </Card>
  );

  return (
    <div className={embedded ? "space-y-4" : "payroll-scope p-4 space-y-6"}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <span><strong style={{ color: "var(--text-strong)" }}>{employees.length}</strong> total</span>
            <span><strong style={{ color: "var(--green-text-strong)" }}>{withStructure}</strong> with structure</span>
            <span><strong style={{ color: "var(--amber-text-strong)" }}>{withoutStructure}</strong> without structure</span>
          </div>
        </div>
      ) : (
        <PageHero
          eyebrow="Payroll"
          title="Employees"
          subtitle="Every employee on file, per client, with their current salary structure."
          stats={[
            { label: "Total Employees", value: employees.length, icon: Users, tone: "blue" },
            { label: "With Structure", value: withStructure, hint: "Ready for payroll", icon: UserCheck, tone: "green" },
            { label: "Without Structure", value: withoutStructure, hint: "Needs setup", icon: UserX, tone: "amber" },
          ]}
          action={actions}
        />
      )}

      {filterBar}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Failed to load employees." onRetry={refetch} />}

      {!isLoading && !isError && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-3)" }}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
                Employees
              </h3>
              <Badge tone="slate">{filtered.length} records</Badge>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState emoji="👥" message="No employees match this filter." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-3)" }}>
                  {["Employee", "Position", "CTC", "Monthly Gross", "Structure", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: "1px solid var(--border-2)" }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="font-medium text-left hover:underline"
                          style={{ color: "var(--text-strong)" }}
                          onClick={() => onOpenEmployee?.(emp.id)}
                        >
                          {emp.full_name}
                        </button>
                        {emp.status !== "active" && <Badge tone="red">Inactive</Badge>}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {emp.employee_code || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                      {emp.position || "—"}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                      {formatCurrency(emp.ctc)}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                      {emp.salary_structure ? formatCurrency(emp.salary_structure.monthly_gross) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {emp.salary_structure ? (
                        <Badge tone="green">Effective {emp.salary_structure.effective_from}</Badge>
                      ) : (
                        <Badge tone="amber">Not set</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onOpenEmployee?.(emp.id)}>
                          <Eye size={13} /> View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingEmployee(emp)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(emp)}>
                          {emp.salary_structure ? "Update Structure" : "Add Structure"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={mutateToggleStatus.isPending}
                          onClick={() => toggleEmployeeStatus(emp)}
                          style={
                            emp.status === "active"
                              ? { color: "var(--red-text)", border: "1px solid var(--red-border)", background: "var(--red-bg-subtle)" }
                              : { color: "var(--green-text)", border: "1px solid var(--green-border)", background: "var(--green-bg-subtle)" }
                          }
                        >
                          {emp.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {editing && (
        <SalaryStructureModal
          employee={editing}
          onClose={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      {importing && (
        <ImportEmployeesModal
          clientId={clientId}
          onClose={() => setImporting(false)}
          onImported={refetch}
        />
      )}

      {adding && (
        <EmployeeFormModal
          clients={clients}
          defaultClientId={clientId}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refetch();
          }}
        />
      )}

      {editingEmployee && (
        <EmployeeFormModal
          employee={editingEmployee}
          clients={clients}
          clientName={clients.find((c) => String(c.id) === String(editingEmployee.client))?.name || (embedded ? clients.find((c) => String(c.id) === String(clientId))?.name : undefined)}
          onClose={() => setEditingEmployee(null)}
          onSaved={() => {
            setEditingEmployee(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}