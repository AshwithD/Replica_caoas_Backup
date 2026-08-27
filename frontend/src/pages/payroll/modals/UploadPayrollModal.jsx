import { useRef, useState } from "react";
import { Download, FileUp, FileSpreadsheet, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api, apiPath } from "../_kit/api/client";
import { useAppMutations } from "../_kit/hooks/hooks";
import { Button, Modal } from "../_kit/components/primitives";
import { MONTHS } from "../_kit/utils/utils";

/* ── month/year picker ───────────────────────────────────────────────── */
function MonthYearPicker({ month, year, onChange }) {
  const [viewYear, setViewYear] = useState(year);

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-5)" }}>
      {/* year nav */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button type="button"
          onClick={() => setViewYear((y) => y - 1)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ background: "var(--border-1)", border: "1px solid var(--border-3)", color: "var(--text-secondary)" }}>
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{viewYear}</span>
        <button type="button"
          onClick={() => setViewYear((y) => y + 1)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ background: "var(--border-1)", border: "1px solid var(--border-3)", color: "var(--text-secondary)" }}>
          <ChevronRight size={14} />
        </button>
      </div>
      {/* month grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS.map((m, i) => {
          const isSelected = i + 1 === month && viewYear === year;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(i + 1, viewYear)}
              className="rounded-lg py-1.5 text-xs font-medium transition-all"
              style={{
                background: isSelected ? "var(--blue-border)"  : "var(--surface-2)",
                border:     isSelected ? "1px solid var(--blue-border)" : "1px solid var(--border-2)",
                color:      isSelected ? "var(--blue-text-strong)" : "var(--text-muted)",
              }}
            >
              {m.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── file drop zone ──────────────────────────────────────────────────── */
function FileDropZone({ file, onChange }) {
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

/* ── main ────────────────────────────────────────────────────────────── */
export default function UploadPayrollModal({ clients = [], onClose, onUploaded }) {
  const { mutateUploadBatch, mutateCancelBatch } = useAppMutations();

  const [form, setForm] = useState({
    client_id: clients.length === 1 ? clients[0].id : "",
    month:   new Date().getMonth() + 1,
    year:    new Date().getFullYear(),
    file:    null,
  });
  const [result, setResult] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, value));
    mutateUploadBatch.mutate(fd, {
      onSuccess: (data) => {
        setResult(data);
        const realWarnings = (data.warnings || []).filter((w) => !w.toLowerCase().includes("ignored"));
        if (!realWarnings.length) onUploaded?.(data.batch);
      },
    });
  };


  const downloadTemplate = async () => {
    try {
      const response = await api.get(
        apiPath("template/download/"),
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Payroll_Template.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Template download failed:", err);
    }
  };

  /* only show warnings that aren't "ignored static column" noise */
  const realWarnings = (result?.warnings || []).filter((w) => !w.toLowerCase().includes("ignored"));

  const error = mutateUploadBatch.error?.response;

  const guardedClose = () => {
    if (mutateUploadBatch.isPending) return;
    // A batch may already exist server-side at this point — the upload
    // endpoint creates it as soon as parsing succeeds, even if the
    // response came back with warnings and the user hasn't clicked
    // "Proceed to Review" yet. Closing/Cancelling here previously just
    // dismissed the modal and left that batch sitting in the DB as an
    // orphan. If the batch was never explicitly confirmed, cancel it
    // (soft-delete → FAILED) instead of silently abandoning it.
    if (result?.batch?.id) {
      mutateCancelBatch.mutate(result.batch.id);
    }
    onClose?.();
  };

  return (
    <Modal title="Upload Payroll" onClose={guardedClose} size="m">
      <form onSubmit={submit} className="space-y-5">

        {/* client selector — required, since batches/employees are scoped
            per client now */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}>Client</label>
          <select
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* month/year picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}>
            Payroll Period
            <span className="ml-2 normal-case font-normal" style={{ color: "var(--text-subtle)" }}>
              {MONTHS[form.month - 1]} {form.year}
            </span>
          </label>
          <MonthYearPicker
            month={form.month}
            year={form.year}
            onChange={(month, year) => setForm({ ...form, month, year })}
          />
        </div>

        {/* file drop zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}>Excel File</label>
          <FileDropZone
            file={form.file}
            onChange={(file) => setForm({ ...form, file })}
          />
        </div>

        {/* info banner */}
        <div className="rounded-lg px-4 py-3 text-xs leading-relaxed"
          style={{ background: "var(--blue-bg-subtle)", border: "1px solid var(--blue-bg-strong)", color: "var(--blue-text-strong)" }}>
          Employee Code is required to match records. Static data (name, PAN, bank, CTC) is managed in CAOAS — not in this Excel.
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button"
            onClick={downloadTemplate}
            className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium">
            <Download size={15} /> Download Template
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={guardedClose}
              disabled={mutateUploadBatch.isPending}
              title={mutateUploadBatch.isPending ? "Upload in progress — please wait" : undefined}
              className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button type="submit" disabled={mutateUploadBatch.isPending || !form.file || !form.client_id}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--blue-bg-strong)", border: "1px solid var(--blue-border)",
                color: "var(--blue-text-strong)", opacity: (!form.file || !form.client_id || mutateUploadBatch.isPending) ? .5 : 1,
                cursor: (!form.file || !form.client_id || mutateUploadBatch.isPending) ? "not-allowed" : "pointer",
              }}>
              <FileUp size={15} />
              {mutateUploadBatch.isPending ? "Uploading…" : "Upload"}
            </button>
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
        {error?.status === 422 && <ValidationErrors data={error.data} />}

        {/* warnings (ignored-column noise filtered out) */}
        {realWarnings.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background: "var(--amber-bg-subtle)", border: "1px solid var(--amber-bg-strong)" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--amber-text-strong)" }}>
              Upload completed with {realWarnings.length} warning{realWarnings.length !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-1.5 mb-4">
              {realWarnings.map((w) => (
                <li key={w} className="flex gap-2 text-xs" style={{ color: "var(--amber-text-strong)" }}>
                  <span style={{ color: "var(--amber-text-strong)", flexShrink: 0 }}>·</span> {w}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => onUploaded?.(result.batch)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--amber-bg-strong)", border: "1px solid var(--amber-border)", color: "var(--amber-text-strong)" }}>
              Proceed to Review
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}

/* ── validation error table ──────────────────────────────────────────── */
function ValidationErrors({ data }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: "var(--red-bg-subtle)", border: "1px solid var(--red-bg-strong)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--red-text-strong)" }}>
        Upload rejected — {data?.total_errors} row{data?.total_errors !== 1 ? "s" : ""} with errors
      </p>
      <p className="text-xs mt-1 mb-4" style={{ color: "var(--red-text-strong)" }}>
        Fix all errors in Excel and re-upload. No pay period has been created.
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