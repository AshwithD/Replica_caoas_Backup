import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Mail, MoreHorizontal, CheckCircle2, Send, Eye, Edit3, Upload, ClipboardCheck, FileText, DownloadIcon, IdCard, TrendingDown, TrendingUp, Clock, CalendarClock, Wallet, Lock, Unlock, ChevronRight, ChevronLeft, X } from "lucide-react";
import { api, apiPath } from "../_kit/api/client";
import { useAppMutations, useBatch, useClients, useEditHistory, useRecords } from "../_kit/hooks/hooks";
import { Badge, Card, ErrorState, Skeleton, Button } from "../_kit/components/primitives";
import { StatCard } from "../_kit/components/StatCard";
import { useConfirm } from "../_kit/components/ConfirmDialog";
import WorkspaceHeader from "../_kit/components/WorkspaceHeader";
import Breadcrumb from "../_kit/components/Breadcrumb";
import { formatCurrency, formatDateTime, MONTHS, unwrapList, useSmartBack } from "../_kit/utils/utils";
import { tableHeaderRowStyle } from "../_kit/styles/tableStyles";
import { LedgerAdjustmentModal } from "../_kit/components/LedgerAdjustmentModal";
import { useAuthStore } from "../_kit/hooks/authStore";

/* ── shared table styles — same as BatchList / EmailLogs ── */
const thStyle = {
  padding:       "6px 10px",
  fontSize:      "10px",
  fontWeight:    600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color:         "var(--text-strong)",
  whiteSpace:    "nowrap",
};

const tdStyle = {
  padding:    "6px 10px",
  color:      "var(--text-body)",
  fontSize:   "12.5px",
  whiteSpace: "nowrap",
};

const rowDivider = { borderTop: "1px solid var(--border-1)" };

const recordStatusTone = {
  APPROVED:     "green",
  COMPLETED:    "green",
  EMAIL_SENT:   "green",
  EMAIL_FAILED: "red",
  REVIEWED:     "blue",
};

/* ── icon-only button, matches BatchList's IconBtn ── */
function IconBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150"
      style={{
        background: "var(--surface-3)",
        border: "1px solid var(--border-3)",
        color: "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--blue-bg)";
        e.currentTarget.style.border     = "1px solid var(--blue-border)";
        e.currentTarget.style.color      = "var(--blue-text-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface-3)";
        e.currentTarget.style.border     = "1px solid var(--border-3)";
        e.currentTarget.style.color      = "var(--text-secondary)";
      }}
    >
      {children}
    </button>
  );
}

/* ── step tracker — compact inline layout, color reflects progress ── */
function StepTracker({ status, total, reviewedCount, sentCount, uploadedAt }) {
  const order = { UPLOADED: 0, REVIEWED: 1, COMPLETED: 2 };
  const current = order[status] ?? 0;

  const steps = [
    { key: "uploaded", label: "Uploaded", icon: Upload,         sub: formatDateTime(uploadedAt) },
    { key: "reviewed", label: "Reviewed", icon: ClipboardCheck, sub: `${reviewedCount}/${total}` },
    { key: "sent",     label: "Sent",     icon: Send,           sub: `${sentCount}/${total}` },
  ];

  const activeColors = [
    { bg: "var(--blue-bg-strong)", border: "var(--blue-border)", color: "var(--blue-text)" },
    { bg: "var(--purple-bg-strong)", border: "var(--purple-border)", color: "var(--purple-text)" },
    { bg: "var(--green-bg-strong)",  border: "var(--green-border)",  color: "var(--green-text)" },
  ];
  const pendingColor = { bg: "var(--surface-2)", border: "var(--border-5)", color: "var(--text-faint)" };

  return (
    <div className="flex items-center gap-2.5">
      {steps.map((s, i) => {
        const reached = current >= i;
        const c = reached ? activeColors[i] : pendingColor;
        const connectorDone = current > i;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-1.5" title={`${s.label} — ${s.sub}`}>
              <div className="relative flex items-center justify-center rounded-full transition-all duration-300 shrink-0"
                style={{
                  width: 26, height: 26,
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                }}>
                <s.icon size={12} style={{ color: c.color }} />
              </div>
              <div className="leading-tight">
                <div className="text-[11px] font-semibold" style={{ color: reached ? "var(--text-primary)" : "var(--text-subtle)" }}>
                  {s.label}
                </div>
                <div className="text-[9px]" style={{ color: reached ? "var(--text-muted)" : "var(--text-faint)" }}>
                  {s.sub}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="w-5 h-px mx-2" style={{ borderTop: `1.5px dashed ${connectorDone ? "var(--blue-border)" : "var(--border-3)"}` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── editable cell ──────────────────────────────────────────── */
function Editable({ record, field, editing, setEditing, save, money, locked, readOnly, accentBg, accentColor, suppressLockIcon }) {
  const active = !locked && editing?.id === record.id && editing?.field === field;
  if (active) return (
    <input
      autoFocus
      type="number"
      className="w-24 h-8 rounded-md px-2 text-sm"
      defaultValue={record[field]}
      onBlur={(e) => save(record, field, e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && save(record, field, e.currentTarget.value)}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
  if (locked) return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm cursor-not-allowed"
      style={{ background: accentBg || "var(--surface-2)", color: accentColor || "var(--text-muted)", cursor: "not-allowed" }}
      title={readOnly ? "Computed automatically — not directly editable" : "Locked — payslip already generated"}
    >
      {readOnly && !suppressLockIcon && <Lock size={10} />}
      {money ? formatCurrency(record[field]) : record[field]}
    </span>
  );
  return (
    <button
      className="rounded px-2 py-1 text-sm transition-colors"
      style={{ color: "var(--text-secondary)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--blue-bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      onClick={(e) => { e.stopPropagation(); setEditing({ id: record.id, field }); }}
    >
      {money ? formatCurrency(record[field]) : record[field]}
    </button>
  );
}

function ledgerChipDefs(record) {
  const compOffBalance = record.comp_off_closing_balance ?? 0;
  const leaveBalance = record.leave_closing_balance ?? 0;
  const advanceBalance = record.salary_advance_closing_balance ?? 0;
  const onHoldBalance = record.on_hold_closing_balance ?? 0;
  const chips = [
    { key: "comp_off", label: "Comp-Off", icon: Clock, badge: `${compOffBalance} Days`, color: "blue", highlight: compOffBalance > 0 },
    { key: "leave", label: "Leave", icon: CalendarClock, badge: `${leaveBalance} Days`, color: "purple", highlight: leaveBalance > 0 },
    { key: "salary_advance", label: "Advance", icon: Wallet, badge: formatCurrency(advanceBalance), color: "green", highlight: advanceBalance > 0 },
    { key: "on_hold", label: "On-Hold", icon: Lock, badge: formatCurrency(onHoldBalance), color: "amber", highlight: onHoldBalance > 0 },
  ];
  // Comp-off/leave ledgers are frozen during probation (see calculations.py)
  // — hide those chips rather than show a static/zero balance that never moves.
  if (record.is_probation) {
    return chips.filter((c) => c.key !== "comp_off" && c.key !== "leave");
  }
  return chips;
}

/* ── stat cards row — sits in the drawer header, always visible;
   clicking one shows its data directly below, no separate section needed ── */
function StatChipsRow({ chips, activeKey, onSelect }) {
  const gridColsClass = chips.length === 4 ? "grid-cols-4" : "grid-cols-2";
  return (
    <div className={`grid ${gridColsClass} gap-3`}>
      {chips.map((chip) => (
        <StatCard
          key={chip.key}
          compact
          icon={chip.icon}
          label={chip.label}
          value={chip.badge}
          accent={chip.color}
          active={activeKey === chip.key}
          highlight={chip.highlight}
          onClick={() => onSelect(chip.key)}
        />
      ))}
    </div>
  );
}

const ACCENT_COLORS = {
  blue:   { icon: "var(--chip-blue-icon)",   border: "var(--blue-border)",   text: "var(--blue-text-strong)",   wash: "var(--chip-blue-wash)" },
  green:  { icon: "var(--chip-green-icon)",  border: "var(--green-border)",  text: "var(--green-text-strong)",  wash: "var(--chip-green-wash)" },
  amber:  { icon: "var(--chip-amber-icon)",  border: "var(--amber-border)",  text: "var(--amber-text-strong)",  wash: "var(--chip-amber-wash)" },
  purple: { icon: "var(--chip-purple-icon)", border: "var(--purple-border)", text: "var(--purple-text-strong)", wash: "var(--chip-purple-wash)" },
};

/* ── expanded row detail ────────────────────────────────────── */
function InfoLine({ label, value, icon: Icon, accent }) {
  const a = accent || ACCENT_COLORS.blue;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
        {Icon && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
            style={{ background: a.wash, border: `1px solid ${a.border}` }}
          >
            <Icon size={10} style={{ color: a.text }} />
          </span>
        )}
        {label}
      </span>
      <span style={{ color: "var(--text-primary)" }}>{value ?? "—"}</span>
    </div>
  );
}

/* ── highlighted closing-balance band — mirrors the bold "Closing
   Balance" bar in the target mockup, sits inside a ledger panel
   below the line-item breakdown; tinted to match the active section ── */
function ClosingBalanceRow({ value, accent }) {
  const a = accent || ACCENT_COLORS.blue;
  return (
    <div
      className="mt-2 flex items-center justify-between rounded-lg px-3 py-2"
      style={{ background: a.wash, border: `1px solid ${a.border}` }}
    >
      <span className="text-sm font-semibold" style={{ color: a.text }}>Closing Balance</span>
      <span className="text-sm font-bold" style={{ color: a.text }}>{value ?? "—"}</span>
    </div>
  );
}

function ExpandedRecord({ record, editing, setEditing, saveCell, locked, canEditBreakdown }) {
  const [breakdownEditMode, setBreakdownEditMode] = useState(false);

  return (
    <div className="space-y-3">
      {/* Edit Breakdown Toggle */}
      {true && (
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {locked ? "Payslip breakdown (locked)" : breakdownEditMode ? "Editing payslip breakdown" : "Payslip breakdown (read-only)"}
          </span>
          <button
            type="button"
            disabled={locked}
            onClick={() => setBreakdownEditMode((v) => !v)}
            title={locked ? "Locked — payslip already generated" : undefined}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              breakdownEditMode
                ? { color: "var(--red-text)", border: "1px solid var(--red-border)", background: "var(--red-bg-subtle)" }
                : { color: "var(--blue-text)", border: "1px solid var(--blue-border)", background: "var(--blue-bg-subtle)" }
            }
          >
            {breakdownEditMode ? <Lock size={12} /> : <Edit3 size={12} />}
            {breakdownEditMode ? "Done editing" : "Edit breakdown"}
          </button>
        </div>
      )}

      {/* 2-Column Grid: Earnings and Deductions */}
      <div className="grid gap-3 lg:grid-cols-2">
        <BreakdownPanel
          title="Earnings"
          record={record}
          editing={editing}
          setEditing={setEditing}
          saveCell={saveCell}
          locked={locked}
          editMode={breakdownEditMode}
          fields={[
            { key: "basic_da", label: "Basic DA" },
            { key: "hra", label: "HRA" },
            { key: "lta", label: "LTA" },
            { key: "special_allowance", label: "Special Allowance" },
            { key: "nps_allowance_earned", label: "NPS Allowance Earned" },
            { key: "variable_pay", label: "Variable Pay" },
            { key: "commission_other", label: "Commission Other" },
            { key: "arrears", label: "Arrears" },
            { key: "salary_advance_disbursed", label: "Salary Advance Given", readOnly: true },
            { key: "on_hold_released", label: "On Hold Released", readOnly: true },
            { key: "earned_salary", label: "Earned Salary", readOnly: true, alwaysShow: true },
          ]}
        />

        <BreakdownPanel
          title="Deductions"
          record={record}
          editing={editing}
          setEditing={setEditing}
          saveCell={saveCell}
          locked={locked}
          editMode={breakdownEditMode}
          fields={[
            { key: "epf", label: "EPF" },
            { key: "vpf", label: "VPF" },
            { key: "professional_tax", label: "Professional Tax" },
            { key: "tds", label: "TDS" },
            { key: "nps_deduction", label: "NPS Deduction" },
            { key: "loan_deduction", label: "Loan Deduction" },
            { key: "lwf", label: "LWF" },
            { key: "other_deduction", label: "Other Deduction" },
            { key: "salary_advance_recovered", label: "Salary Advance Recovered", readOnly: true },
            { key: "on_hold_deducted", label: "On Hold Deducted", readOnly: true },
            { key: "total_deductions", label: "Total Deductions", readOnly: true, alwaysShow: true },
          ]}
          deduction
        />
      </div>
    </div>
  );
}

function BreakdownPanel({ 
  title, 
  record, 
  fields, 
  deduction, 
  editing, 
  setEditing, 
  saveCell, 
  locked, 
  editMode
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleFields = fields.filter(
    (f) => showAll || f.alwaysShow || Number(record[f.key] ?? 0) !== 0
  );
  const hiddenCount = fields.length - visibleFields.length;
  const accentBorder = deduction ? "var(--red-border)" : "var(--blue-border)";
  const accentText   = deduction ? "var(--red-text)"   : "var(--blue-text)";
  const accentBg      = deduction ? "var(--red-bg)"        : "var(--blue-bg)";
  const accentBgSubtle = deduction ? "var(--red-bg-subtle)" : "var(--blue-bg-subtle)";

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: `1px solid ${accentBorder}` }}>
      <div className="flex items-center justify-between mb-2">
        <p
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: accentText }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: accentBg }}
          >
            {deduction ? (
              <TrendingDown className="h-4 w-4" style={{ color: "var(--red-text-strong)" }} />
            ) : (
              <TrendingUp className="h-4 w-4" style={{ color: "var(--blue-text-strong)" }} />
            )}
          </span>
          {title}
        </p>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
            style={{ color: accentText, background: accentBgSubtle }}
          >
            {showAll ? "Hide zero" : `Show all (${hiddenCount})`}
          </button>
        )}
      </div>

      <div
        className="mb-2 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${accentBorder}, transparent)` }}
      />

      <div className="space-y-2">
        {visibleFields.map(({ key, label, readOnly }, index) => {
          const isTotal = key === "earned_salary" || key === "total_deductions";
          return (
          <div key={key}>
            {index === visibleFields.length - 1 && (
              <div
                className="my-2 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${accentBorder}, transparent)` }}
              />
            )}

            <div
              className="flex items-center justify-between text-sm"
              style={isTotal ? { background: accentBgSubtle, borderRadius: 8, padding: "6px 10px" } : undefined}
            >
              <span
                className="font-semibold"
                style={{
                  color: isTotal ? accentText : "var(--text-secondary)",
                  fontWeight: isTotal ? 600 : 400,
                }}
              >
                {label}
              </span>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: accentText }}>
                {isTotal && <Lock size={11} style={{ color: accentText }} />}
                <Editable
                  record={record}
                  field={key}
                  editing={editing}
                  setEditing={setEditing}
                  save={saveCell}
                  money
                  locked={locked || readOnly || !editMode}
                  readOnly={readOnly}
                  accentBg={isTotal ? "transparent" : accentBgSubtle}
                  accentColor={accentText}
                  suppressLockIcon={isTotal}
                />
              </span>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

/* ── edit history drawer ────────────────────────────────────── */
function RecordDrawer({ record, batch, editing, setEditing, saveCell, locked, canEditBreakdown, onClose, onPrev, onNext, hasPrev, hasNext, onRefetch }) {
  const [activeSection, setActiveSection] = useState(null);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(null);

  if (!record) return null;

  const employeeForModal = { id: record.employee, full_name: record.employee_name };
  const ledgerLocked = batch.status !== "UPLOADED";
  const onHoldBalance = record.on_hold_closing_balance ?? 0;

  const amberAccent = ACCENT_COLORS.amber;
  const chips = ledgerChipDefs(record);

  const selectChip = (key) => setActiveSection((prev) => (prev === key ? null : key));

  return (
    <div
      className="fixed inset-0 flex justify-end"
      style={{
        zIndex: 1100,
        // The global header is `-webkit-app-region: drag` (frameless
        // window title bar). That's a pure screen-coordinate hit test in
        // Chromium/Electron -- it ignores z-index/DOM nesting, so this
        // full-screen overlay (which visually sits above the header, e.g.
        // buttons rendered at the very top of the screen) would otherwise
        // have clicks swallowed as "start window drag" before React sees
        // them. Explicitly no-drag so the whole overlay stays clickable.
        WebkitAppRegion: "no-drag",
      }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 h-full overflow-y-auto p-5"
        style={{
          width: "50vw",
          minWidth: "480px",
          background: "var(--surface-2)",
          borderLeft: "1px solid var(--border-2)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrev}
              title="Previous employee"
              className="rounded-lg p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNext}
              title="Next employee"
              className="rounded-lg p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ── employee info header card — now clickable, toggles the details panel below ── */}
          <div
            className="flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5 cursor-pointer transition-colors"
            onClick={() => selectChip("employee_info")}
            style={{
              background: `linear-gradient(135deg, ${amberAccent.wash} 0%, var(--surface-1) 60%, var(--surface-1) 100%)`,
              border: `1px solid ${activeSection === "employee_info" ? amberAccent.border : "var(--border-2)"}`,
              boxShadow: activeSection === "employee_info" ? `0 0 0 1px ${amberAccent.border}` : undefined,
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: amberAccent.wash, border: `1px solid ${amberAccent.border}` }}
            >
              <IdCard size={16} style={{ color: amberAccent.text }} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {record.employee_code}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="truncate text-base font-bold" style={{ color: "var(--text-strong)" }}>
                  {record.employee_name}
                </div>
                {record.is_probation && <Badge tone="red">On Probation</Badge>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="rounded-lg p-1.5 transition-colors shrink-0"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <StatChipsRow chips={chips} activeKey={activeSection} onSelect={selectChip} />
        </div>

        {activeSection && (
          <div className="rounded-xl p-4 mb-5" style={{ background: "var(--surface-1)", border: `1px solid ${activeSection === "employee_info" ? amberAccent.border : (ACCENT_COLORS[ledgerChipDefs(record).find((c) => c.key === activeSection)?.color] || ACCENT_COLORS.blue).border}` }}>
            {activeSection === "employee_info" && (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: amberAccent.wash, border: `1px solid ${amberAccent.border}` }}
                  >
                    <IdCard size={13} style={{ color: amberAccent.text }} />
                  </div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                    Employee Details
                  </h4>
                </div>
                <div className="space-y-1.5">
                  <InfoLine label="Email" value={record.employee_email} icon={Mail} accent={amberAccent} />
                  <InfoLine label="Employee Code" value={record.employee_code} icon={IdCard} accent={amberAccent} />
                  <InfoLine label="Designation" value={record.employee_designation} icon={IdCard} accent={amberAccent} />
                  <InfoLine label="CTC" value={record.ctc_annual != null ? formatCurrency(record.ctc_annual) : "—"} icon={Wallet} accent={amberAccent} />
                  <InfoLine label="PF Applicable" value={record.pf_applicable ? "Yes" : "No"} icon={ClipboardCheck} accent={amberAccent} />
                  <InfoLine label="PT Applicable" value={record.pt_applicable ? "Yes" : "No"} icon={ClipboardCheck} accent={amberAccent} />
                </div>
              </>
            )}

            {activeSection !== "employee_info" && (() => {
              const activeChip = ledgerChipDefs(record).find((c) => c.key === activeSection);
              const AccentIcon = activeChip?.icon;
              const chipAccent = ACCENT_COLORS[activeChip?.color] || ACCENT_COLORS.blue;
              return (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {AccentIcon && (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ background: chipAccent.wash, border: `1px solid ${chipAccent.border}` }}
                        >
                          <AccentIcon size={13} style={{ color: chipAccent.text }} />
                        </div>
                      )}
                      <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                        {activeChip?.label} Balance Details
                      </h4>
                    </div>
                    <button
                      type="button"
                      disabled={ledgerLocked}
                      onClick={() => setLedgerModalOpen(activeSection)}
                      title={ledgerLocked ? "PDF already generated — adjust from Employee Detail instead" : undefined}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--blue-text-strong)", background: "var(--blue-bg-subtle)" }}
                    >
                      Adjust Balance
                    </button>
                  </div>

                {activeSection === "comp_off" && (
                  <div className="space-y-1.5">
                    <InfoLine label="Opening Balance" value={`${record.comp_off_opening_balance ?? 0} days`} icon={Clock} accent={chipAccent} />
                    <InfoLine label="Extra Working Days" value={`${record.extra_working_days ?? 0} days`} icon={TrendingUp} accent={chipAccent} />
                    <InfoLine label="Paid Leave Days (info only)" value={`${record.paid_leave_days ?? 0} days`} icon={CalendarClock} accent={chipAccent} />
                    <InfoLine label="LOP Days (info only)" value={`${record.lop_days ?? 0} days`} icon={TrendingDown} accent={chipAccent} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: chipAccent.wash, border: `1px solid ${chipAccent.border}` }}>
                          <ClipboardCheck size={10} style={{ color: chipAccent.text }} />
                        </span>
                        Days Covered (Leave/LOP)
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                        <Editable
                          record={record}
                          field="comp_off_days_used"
                          editing={editing}
                          setEditing={setEditing}
                          save={saveCell}
                          locked={locked}
                        /> days
                      </span>
                    </div>
                    <ClosingBalanceRow value={`${record.comp_off_closing_balance ?? 0} days`} accent={chipAccent} />
                  </div>
                )}
                {activeSection === "leave" && (
                  <div className="space-y-1.5">
                    <InfoLine label="Opening Balance" value={`${record.leave_opening_balance ?? 0} days`} icon={CalendarClock} accent={chipAccent} />
                    <InfoLine label="Accrued This Month" value={`${record.leave_accrued ?? 0} days`} icon={TrendingUp} accent={chipAccent} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: chipAccent.wash, border: `1px solid ${chipAccent.border}` }}>
                          <CalendarClock size={10} style={{ color: chipAccent.text }} />
                        </span>
                        Paid Leave Days
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                        <Editable
                          record={record}
                          field="paid_leave_days"
                          editing={editing}
                          setEditing={setEditing}
                          save={saveCell}
                          locked={locked}
                        /> days
                      </span>
                    </div>
                    <InfoLine label="LOP Days (info only)" value={`${record.lop_days ?? 0} days`} icon={TrendingDown} accent={chipAccent} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: chipAccent.wash, border: `1px solid ${chipAccent.border}` }}>
                          <ClipboardCheck size={10} style={{ color: chipAccent.text }} />
                        </span>
                        Days Covered (Leave/LOP)
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                        <Editable
                          record={record}
                          field="leave_used"
                          editing={editing}
                          setEditing={setEditing}
                          save={saveCell}
                          locked={locked}
                        /> days
                      </span>
                    </div>
                    <InfoLine label="Covered by Comp-Off" value={`${record.comp_off_days_used ?? 0} days`} icon={Clock} accent={chipAccent} />
                    <ClosingBalanceRow value={`${record.leave_closing_balance ?? 0} days`} accent={chipAccent} />
                  </div>
                )}
                {activeSection === "salary_advance" && (
                  <div className="space-y-1.5">
                    <InfoLine label="Opening Balance" value={formatCurrency(record.salary_advance_opening_balance ?? 0)} icon={Wallet} accent={chipAccent} />
                    <InfoLine label="Given This Month" value={formatCurrency(record.salary_advance_disbursed ?? 0)} icon={TrendingUp} accent={chipAccent} />
                    <InfoLine label="Recovered This Month" value={formatCurrency(record.salary_advance_recovered ?? 0)} icon={TrendingDown} accent={chipAccent} />
                    <ClosingBalanceRow value={formatCurrency(record.salary_advance_closing_balance ?? 0)} accent={chipAccent} />
                  </div>
                )}
                {activeSection === "on_hold" && (
                  <div className="space-y-1.5">
                    <InfoLine label="Opening Balance" value={formatCurrency(record.on_hold_opening_balance ?? 0)} icon={Lock} accent={chipAccent} />
                    <InfoLine label="Put On Hold This Month" value={formatCurrency(record.on_hold_deducted ?? 0)} icon={Lock} accent={chipAccent} />
                    <InfoLine label="Released This Month" value={formatCurrency(record.on_hold_released ?? 0)} icon={Unlock} accent={chipAccent} />
                    <ClosingBalanceRow value={formatCurrency(onHoldBalance)} accent={chipAccent} />
                  </div>
                )}
                <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                  {ledgerLocked
                    ? "PDF already generated for this batch — further corrections only via Employee Detail (applied to next month's payslip)."
                    : "Adjustments made here apply immediately to this month's balance and pay."}
                </p>
                </>
              );
            })()}
          </div>
        )}

        {ledgerModalOpen && (
          <LedgerAdjustmentModal
            employee={employeeForModal}
            type={ledgerModalOpen}
            onClose={() => {
              setLedgerModalOpen(null);
              onRefetch?.();
            }}
            appliesImmediately
          />
        )}

        <ExpandedRecord
          record={record}
          editing={editing}
          setEditing={setEditing}
          saveCell={saveCell}
          locked={locked}
          canEditBreakdown={canEditBreakdown}
        />
      </div>
    </div>
  );
}

function EditHistoryDrawer({ record, onClose }) {
  const { data } = useEditHistory(record.id);
  const edits = unwrapList(data);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{
        // The global header is `-webkit-app-region: drag` (frameless
        // window title bar). That's a pure screen-coordinate hit test in
        // Chromium/Electron -- it ignores z-index/DOM nesting, so this
        // full-screen overlay (which visually sits above the header, e.g.
        // buttons rendered at the very top of the screen) would otherwise
        // have clicks swallowed as "start window drag" before React sees
        // them. Explicitly no-drag so the whole overlay stays clickable.
        WebkitAppRegion: "no-drag",
      }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="sidebar relative z-10 w-full max-w-md p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Edit History</p>
            <h2 className="mt-1 text-base font-semibold">{record.employee_name}</h2>
          </div>
          <button className="btn-glass rounded-lg px-3 py-1.5 text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-3">
          {edits.length === 0
            ? <p className="text-sm text-slate-500">No edits made yet.</p>
            : edits.map((edit) => (
              <div key={edit.id} className="glass rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <b className="text-slate-200">{edit.field_name}</b>
                  <span className="text-slate-400">{edit.old_value} → {edit.new_value}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{edit.edited_by_display} · {formatDateTime(edit.created_at)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ── send results modal ─────────────────────────────────────── */
function SendResultsModal({ results, records, batchId, batch, elapsedMs, onClose, onRetry }) {
  const failed = results.results?.filter((r) => !r.success) || [];
  const allOk = failed.length === 0;

  const formatElapsed = (ms) => {
    if (!ms || ms < 0) return null;
    if (ms < 1000) return `${ms}ms`;
    const secs = ms / 1000;
    return secs < 60 ? `${secs.toFixed(1)}s` : `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
  };
  const timeTaken = formatElapsed(elapsedMs);

  const downloadCSV = async () => {
    try {
      const response = await api.get(apiPath(`batches/${batchId}/export-csv/`), { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = batch ? `${MONTHS[batch.month - 1]}_${batch.year}_payroll.csv` : `payroll_${batchId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ animation: "sendResultsFadeIn .18s ease-out" }}>
      <style>{`
        @keyframes sendResultsFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sendResultsScaleIn { from { opacity: 0; transform: scale(.94) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes sendResultsCheckPop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sendResultsCheckDraw {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes sendResultsRing {
          0%   { transform: scale(.8); opacity: .5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/65" onClick={onClose} />

      <div
        className="glass relative z-10 w-full max-w-xl overflow-hidden rounded-3xl p-7"
        style={{
          background: "var(--modal-panel-bg)",
          border: "1px solid var(--border-3)",
          boxShadow: "0 24px 70px var(--shadow-md), 0 0 0 1px var(--surface-2) inset",
          animation: "sendResultsScaleIn .22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: allOk ? "var(--green-solid)" : "var(--amber-solid)" }}
        />

        <div className="relative mb-6 flex items-start gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <span
              className="absolute h-16 w-16 rounded-2xl"
              style={{
                background: allOk ? "var(--green-border)" : "var(--amber-border)",
                animation: "sendResultsRing 1.4s ease-out .25s 1",
              }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl ring-1"
              style={{
                background: allOk ? "var(--green-bg)" : "var(--amber-bg)",
                borderColor: allOk ? "var(--green-border)" : "var(--amber-border)",
                animation: "sendResultsCheckPop .45s cubic-bezier(0.16,1,0.3,1) .05s both",
              }}
            >
              <svg className="h-8 w-8" fill="none" stroke={allOk ? "var(--green-text)" : "var(--amber-text)"} strokeWidth="2.5" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={allOk ? "M5 13l4 4L19 7" : "M12 9v4m0 4h.01M10.29 3.86l-8.4 14.54A1 1 0 0 0 2.75 20h18.5a1 1 0 0 0 .86-1.6L13.71 3.86a1 1 0 0 0-1.72 0Z"}
                  style={allOk ? { strokeDasharray: 24, strokeDashoffset: 24, animation: "sendResultsCheckDraw .4s ease-out .35s forwards" } : undefined}
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 pt-1">
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
              {allOk ? "Emails Sent Successfully" : "Payroll Emails Completed"}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {allOk
                ? "Every payslip in this batch was delivered."
                : `${failed.length} of ${records.length} email${records.length === 1 ? "" : "s"} need attention.`}
            </p>
          </div>
        </div>

        <div className="relative mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-3)", background: "var(--surface-3)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Total Sent</p>
            <p className="mt-1.5 text-2xl font-bold" style={{ color: "var(--green-text)" }}>{results.total_sent}</p>
          </div>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-3)", background: "var(--surface-3)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Failed</p>
            <p className="mt-1.5 text-2xl font-bold" style={{ color: failed.length > 0 ? "var(--red-text)" : "var(--text-faint)" }}>
              {failed.length}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-3)", background: "var(--surface-3)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Time Taken</p>
            <p className="mt-1.5 text-2xl font-bold" style={{ color: "var(--blue-text)" }}>{timeTaken || "—"}</p>
          </div>
        </div>

        {failed.length > 0 && (
          <div className="relative mb-2 max-h-52 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border-3)" }}>
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                <tr>
                  {["Code", "Name", "Email", "Error", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {failed.map((fail) => {
                  const rec = records.find((r) => r.id === fail.record);
                  return (
                    <tr key={fail.record} style={{ borderTop: "1px solid var(--border-2)" }}>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--text-secondary)" }}>{fail.employee_code}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{rec?.employee_name}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-tertiary)" }}>{rec?.employee_email}</td>
                      <td className="px-3 py-2" style={{ color: "var(--red-text)" }}>{fail.message}</td>
                      <td className="px-3 py-2">
                        <button
                          className="rounded-md px-2.5 py-1 text-xs font-medium"
                          style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", color: "var(--blue-text-strong)" }}
                          onClick={() => onRetry(fail.record)}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-5" style={{ borderTop: "1px solid var(--border-3)" }}>
          {failed.length > 0 && (
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", color: "var(--amber-text)" }}
              onClick={() => failed.forEach((f) => onRetry(f.record))}
            >
              Retry Failed
            </button>
          )}

          <button
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-4)", color: "var(--text-primary)" }}
            onClick={downloadCSV}
          >
            <Download size={14} /> Download CSV
          </button>

          <button
            className="rounded-lg px-5 py-2 text-sm font-semibold"
            style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green-text-strong)" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────── */
export default function BatchReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const smartBack = useSmartBack("/payroll/batches");
  const batchQuery = useBatch(id);
  const recordsQuery = useRecords(id);
  const clientsQuery = useClients();
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : clientsQuery.data?.results || [];
  const { mutateMarkReviewed, mutateSendEmails, mutateUpdateRecord, mutateResendEmail } = useAppMutations();
  const confirm = useConfirm();
  const { user } = useAuthStore();
  const canEditBreakdown = user?.role === "ADMIN";
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [sendResults, setSendResults] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendElapsedMs, setSendElapsedMs] = useState(null);
  const records = unwrapList(recordsQuery.data);

  // Poll while the batch is SENDING so the page (and the stuck-banner
  // below) reflects the real backend state even if the user just leaves
  // this tab open, rather than only updating on manual refresh/refetch.
  const batchStatus = batchQuery.data?.status;
  useEffect(() => {
    if (batchStatus !== "SENDING") return;
    const interval = setInterval(() => batchQuery.refetch(), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchStatus, id]);

  if (batchQuery.isLoading || recordsQuery.isLoading) return <Skeleton className="h-96" />;
  if (batchQuery.isError || recordsQuery.isError) return <ErrorState onRetry={() => { batchQuery.refetch(); recordsQuery.refetch(); }} />;

  const batch = batchQuery.data;
  const counts = records.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  const reviewedCount = records.filter((r) => ["APPROVED", "COMPLETED", "EMAIL_SENT", "REVIEWED"].includes(r.status)).length;
  const sentCount = records.filter((r) => r.status === "EMAIL_SENT" || r.status === "COMPLETED").length;

  const expandedIndex = expanded != null ? records.findIndex((r) => r.id === expanded) : -1;
  const expandedRecord = expandedIndex >= 0 ? records[expandedIndex] : null;
  const goPrevRecord = () => { if (expandedIndex > 0) setExpanded(records[expandedIndex - 1].id); };
  const goNextRecord = () => { if (expandedIndex >= 0 && expandedIndex < records.length - 1) setExpanded(records[expandedIndex + 1].id); };

  const approve = () => {
    mutateMarkReviewed.mutate(id, {
      onSuccess: () => {
        batchQuery.refetch();
        recordsQuery.refetch();
      },
    });
  };
  const send = () => {
    confirm({
      title: "Send salary slips?",
      description: `Send ${records.length} salary slips to employees. Continue?`,
      variant: "primary",
      confirmLabel: "Send",
      onConfirm: async () => {
        const startedAt = Date.now();
        setIsSending(true);
        try {
          // Backend now dispatches this to a background Celery task and
          // returns immediately (202) instead of blocking for however
          // long a large batch takes to actually send — poll for
          // completion instead of waiting on the original request.
          const dispatch = await mutateSendEmails.mutateAsync(id);
          const taskId = dispatch.task_id;

          const poll = async () => {
            const res = await api.get(apiPath(`batches/${id}/send-emails-status/${taskId}/`));
            const { state, result, error } = res.data;
            if (state === "SUCCESS") {
              setSendElapsedMs(Date.now() - startedAt);
              setSendResults(result);
              setIsSending(false);
            } else if (state === "FAILURE") {
              setSendElapsedMs(Date.now() - startedAt);
              setSendResults({
                batch_status: "FAILED",
                total_sent: 0,
                total_failed: records.length,
                results: [],
                error,
              });
              setIsSending(false);
            } else {
              setTimeout(poll, 1500);
            }
          };
          poll();
        } catch (err) {
          setIsSending(false);
          throw err;
        }
      },
    });
  };
  const saveCell = (record, field, value) =>
    mutateUpdateRecord.mutate({ id: record.id, data: { [field]: value } }, { onSuccess: () => setEditing(null) });

  // A batch can only ever leave SENDING via the Celery task that's
  // actually running it — if that task dies unexpectedly (worker crash,
  // an unhandled exception mid-send), the batch is left SENDING forever
  // with nothing to move it forward and no error visible anywhere in the
  // UI. Surface that here: if it's been sitting in SENDING for longer
  // than a live send realistically takes, treat it as stuck and offer a
  // way out instead of leaving the page looking like it's still working.
  const STUCK_SENDING_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
  const sendingSince = batch.status === "SENDING" ? new Date(batch.updated_at).getTime() : null;
  const looksStuck = !isSending && sendingSince && (Date.now() - sendingSince > STUCK_SENDING_THRESHOLD_MS);

  const downloadDetailedXLSX = async () => {
    try {
      const response = await api.get(
        apiPath(`batches/${id}/export-detailed-xlsx/`),
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${MONTHS[batch.month - 1]}_${batch.year}_payroll_detailed.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Detailed export failed:", err);
    }
  };

  const downloadPDF = async (recordId, employeeName) => {
    try {
      const response = await api.get(
        apiPath(`records/${recordId}/download-pdf/`),
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${(employeeName || "").replace(/\s+/g, "")}_${MONTHS[batch.month - 1]}${batch.year}-payslip.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  return (
    <div className="flex min-h-full flex-col" style={{ zoom: 0.9 }}>
      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: () => navigate("/payroll") },
          { label: clients.find((c) => String(c.id) === String(batch.client))?.name || "Client", onClick: smartBack },
          { label: `${MONTHS[batch.month - 1]} ${batch.year}` },
        ]}
      />
      <WorkspaceHeader
        companyName={<span>{MONTHS[batch.month - 1]} {batch.year}</span>}
        onBack={smartBack}
        subtitle={
          <>
            <span>{batch.total_records} employees</span>
            <span className="mx-1.5" style={{ color: "var(--text-muted)" }}>·</span>
            <span>uploaded by {batch.uploaded_by_display} on {formatDateTime(batch.created_at)}</span>
          </>
        }
      />

      {/* ── stuck-in-SENDING banner ──────────────────────────────────
          Only shows once the batch has been SENDING for longer than a
          real send should take. "Force Recheck" just refetches (in case
          the task actually did finish and this is stale UI state);
          "Retry Sending" re-dispatches send-emails — the backend already
          accepts SENDING as a valid state to retry from. */}
      {looksStuck && (
        <Card className="mt-3 p-4" style={{ background: "var(--amber-bg-subtle)", border: "1px solid var(--amber-bg-strong)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--amber-text-strong)" }}>
                This batch has been "Sending" for a while with no update.
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--amber-text-strong)" }}>
                The background email job may have failed to finish. You can recheck its status, or retry sending —
                already-sent payslips won't be re-sent.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => { batchQuery.refetch(); recordsQuery.refetch(); }}>
                Force Recheck
              </Button>
              <Button onClick={send} disabled={mutateSendEmails.isPending || isSending}>
                <Send size={14} /> Retry Sending
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── table ── */}
      <Card className="overflow-hidden mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr style={tableHeaderRowStyle}>
                {["Code", "Name", "Days Present", "LOP", "Paid Leave", "Gross", "Net", "Status", "Edits", "Actions"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <Fragment key={record.id}>
                  <tr
                    style={rowDivider}
                    className="cursor-pointer transition-colors duration-150"
                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = expanded === record.id ? "rgba(33, 66, 120, 0.06)" : "var(--surface-1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = expanded === record.id ? "var(--blue-bg-subtle)" : "transparent"; }}
                  >
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px", color: "var(--text-secondary)" }}>{record.employee_code}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text-strong)" }}>{record.employee_name}</td>
                    <td style={{ padding: "3px 6px" }}><Editable record={record} field="actual_working_days" editing={editing} setEditing={setEditing} save={saveCell} locked={batch.status === "COMPLETED" || !!record.pdf_path} /></td>
                    <td style={{ padding: "3px 6px" }}><Editable record={record} field="lop_days" editing={editing} setEditing={setEditing} save={saveCell} locked={batch.status === "COMPLETED" || !!record.pdf_path} /></td>
                    <td style={{ padding: "3px 6px" }}><Editable record={record} field="paid_leave_days" editing={editing} setEditing={setEditing} save={saveCell} locked={batch.status === "COMPLETED" || !!record.pdf_path} /></td>
                    <td style={{ padding: "3px 6px" }}><Editable record={record} field="gross_salary" editing={editing} setEditing={setEditing} save={saveCell} money locked={batch.status === "COMPLETED" || !!record.pdf_path} /></td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color: record.net_salary < 0 ? "var(--red-text)" : "var(--green-text)",
                    }}>
                      {record.net_salary < 0 ? "-" : ""}{formatCurrency(Math.abs(record.net_salary))}
                    </td>
                    <td style={tdStyle}>
                      <Badge tone={recordStatusTone[record.status] || "amber"}>{record.status}</Badge>
                    </td>
                    <td style={tdStyle}>
                      <button
                        className="rounded-full px-2 py-0.5 text-xs font-bold transition-colors"
                        style={{
                          background: record.edit_count ? "var(--blue-bg-subtle)" : "var(--surface-2)",
                          color:      record.edit_count ? "var(--blue-text-strong)" : "var(--text-tertiary)",
                          border:     record.edit_count ? "1px solid var(--blue-bg-strong)" : "1px solid var(--surface-5)",
                        }}
                        onClick={(e) => { e.stopPropagation(); setHistoryRecord(record); }}
                      >
                        {record.edit_count}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, paddingRight: "10px" }}>
                      <div className="flex items-center gap-1">
                        <IconBtn title="Expand" onClick={(e) => { e.stopPropagation(); setExpanded(expanded === record.id ? null : record.id); }}>
                          <Eye size={12} />
                        </IconBtn>
                        <IconBtn title="Download PDF" onClick={(e) => { e.stopPropagation(); downloadPDF(record.id, record.employee_name); }}>
                          <DownloadIcon size={12} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── bottom bar ── */}
      <Card
        className="mt-auto p-4"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          background: "linear-gradient(120deg, var(--blue-bg) 0%, var(--purple-bg-subtle) 35%, var(--green-bg-subtle) 70%, var(--surface-1) 100%)",
          border: "1px solid var(--blue-bg)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <StepTracker
              status={batch.status}
              total={records.length}
              reviewedCount={reviewedCount}
              sentCount={sentCount}
              uploadedAt={batch.created_at}
            />
            {(counts.EMAIL_FAILED || 0) > 0 && (
              <>
                <div className="w-px h-8" style={{ background: "var(--surface-5)" }} />
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-lg"
                    style={{ width: 32, height: 32, background: "var(--red-bg)", border: "1px solid var(--red-border)" }}>
                    <FileText size={14} style={{ color: "var(--red-text)" }} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{counts.EMAIL_FAILED}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Failed</div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button  variant="Secondary"
              onClick={downloadDetailedXLSX}
            >
              <Download size={14} /> Export
            </Button>
            {counts.DRAFT > 0 && (
              <Button
                className="disabled:opacity-50"
                onClick={approve}
                disabled={mutateMarkReviewed.isPending}
              >
                <CheckCircle2 size={14} />
                {mutateMarkReviewed.isPending ? "Generating PDFs…" : "Approve & Generate PDFs"}
              </Button>
            )}
            {batch.status === "REVIEWED" && (
              <Button
                className=" disabled:opacity-50"
  
                onClick={send}
                disabled={mutateSendEmails.isPending || isSending}
              >
                <Send size={14} /> {isSending ? "Sending…" : "Send All Emails"}
              </Button>
            )}
            {batch.status === "FAILED" && (
              <Button
                className=" disabled:opacity-50"
                onClick={send}
                disabled={mutateSendEmails.isPending || isSending}
              >
                <Send size={14} /> {isSending ? "Sending…" : "Retry Send"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {historyRecord && <EditHistoryDrawer record={historyRecord} onClose={() => setHistoryRecord(null)} />}

      {expandedRecord && (
        <RecordDrawer
          record={expandedRecord}
          batch={batch}
          editing={editing}
          setEditing={setEditing}
          saveCell={saveCell}
          locked={batch.status === "COMPLETED" || !!expandedRecord.pdf_path}
          canEditBreakdown={canEditBreakdown}
          onClose={() => setExpanded(null)}
          onPrev={goPrevRecord}
          onNext={goNextRecord}
          hasPrev={expandedIndex > 0}
          hasNext={expandedIndex >= 0 && expandedIndex < records.length - 1}
          onRefetch={() => recordsQuery.refetch()}
        />
      )}
      {sendResults && (
        <SendResultsModal
          results={sendResults}
          records={records}
          batchId={id}
          batch={batch}
          elapsedMs={sendElapsedMs}
          onClose={() => { setSendResults(null); setSendElapsedMs(null); }}
          onRetry={(rid) => mutateResendEmail.mutate(rid)}
        />
      )}
    </div>
  );
}