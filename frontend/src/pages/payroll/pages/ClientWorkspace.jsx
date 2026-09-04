import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Building2, Mail, Pencil, Upload, UserPlus, Users, Layers,
  Info, IndianRupee, Phone, CreditCard, Receipt, Hash, Landmark,
  MapPin, ClipboardList, Palette, Image as ImageIcon,
} from "lucide-react";
import { useClient, useBatches, useEmailLogs } from "../_kit/hooks/hooks";
import { Badge, Button, Card, ErrorState, Skeleton } from "../_kit/components/primitives";
import Breadcrumb from "../_kit/components/Breadcrumb";
import EmptyState from "../_kit/components/EmptyState";
import { useSmartBack, unwrapList, formatDateTime } from "../_kit/utils/utils";
import BatchList from "./BatchList";
import EmailLogBatches from "./EmailLogBatches";
import EmployeesList from "./EmployeesList";
import UploadPayrollModal from "../modals/UploadPayrollModal";
import ChooseDesignModal from "../modals/ChooseDesignModal";
import { ClientFormModal } from "./FirmDetails";
import { EmployeeFormModal, ImportEmployeesModal } from "./EmployeesList";

const TABS = [
  { key: "details",   label: "Client Details", icon: Building2 },
  { key: "employees", label: "Employees",      icon: Users },
  { key: "batches",   label: "Payroll Batches", icon: Layers },
  { key: "emails",    label: "Email Logs",      icon: Mail },
];

function TabRow({ active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-5 px-1" style={{ borderBottom: "1px solid var(--border-3)" }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? "var(--blue-text-strong)" : "var(--text-muted)",
              borderBottom: isActive ? "2px solid var(--blue-solid)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <Icon size={14} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Plain white bordered info box — matches the reference's
   Task ID / Period / Due Date / Sub-Service row exactly (label on top,
   bold value below, no icon, no color). ─────────────────────────────── */
function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-base font-semibold mt-1" style={{ color: "var(--text-strong)" }}>{value}</p>
    </div>
  );
}

function InfoField({ label, value, required, icon: Icon }) {
  return (
    <div className="min-w-0">
      <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        {Icon && <Icon size={11} />}
        {label}{required && <span style={{ color: "var(--red-solid)" }}> *</span>}
      </p>
      <p className="text-sm font-semibold mt-1 truncate" style={{ color: "var(--text-strong)" }}>{value || "—"}</p>
    </div>
  );
}

/* ── "Client Details" tab body — 4 info boxes, an info banner, and the
   Client Information panel, matching the reference screen 1:1. ──────── */
function ClientDetailsTab({ client, batches, emailsSent, emailsFailed, onEdited }) {
  const [editing, setEditing] = useState(false);
  const latestBatch = batches[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoBox label="Total Batches" value={batches.length} />
        <InfoBox label="Latest Period" value={latestBatch ? `${String(latestBatch.month).padStart(2, "0")}/${latestBatch.year}` : "—"} />
        <InfoBox label="Emails Sent" value={emailsSent} />
        <InfoBox label="Failed Emails" value={emailsFailed} />
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
        style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", color: "var(--blue-text-strong)" }}
      >
        <Info size={15} />
        Everything below — employees, batches, and email logs — is scoped to this client only.
      </div>

      <Card className="overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-3)" }}
        >
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-strong)" }}>
            <ClipboardList size={14} /> CLIENT INFORMATION
          </h3>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={13} /> Edit
          </Button>
        </div>

        {/* One single section: the Client-module identity fields (read-only
            here — they're owned by the Client module) followed by the
            payroll-owned ClientProfile fields, which are what the Edit
            button above actually edits. */}
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <InfoField label="CLIENT NAME"           value={client.name}                  required icon={Building2} />
          <InfoField label="EMAIL"                 value={client.email}                          icon={Mail} />
          <InfoField label="PHONE"                 value={client.phone}                          icon={Phone} />
          <InfoField label="PAN"                   value={client.pan}                            icon={CreditCard} />
          <InfoField label="GSTIN"                 value={client.gstin}                          icon={Receipt} />
          <InfoField label="TAN"                   value={client.tan}                            icon={Hash} />
          <InfoField label="ADDRESS"               value={client.address}                        icon={MapPin} />
          <InfoField label="PAYROLL EMAIL"         value={client.payroll_email || client.email}  icon={Mail} />
          <InfoField label="PF ESTABLISHMENT CODE" value={client.pf_establishment_code}          icon={Landmark} />
          <InfoField label="PAYSLIP DESIGN"        value={client.pdf_design ? `Design ${client.pdf_design}` : "—"} icon={Palette} />
          <InfoField label="PAYSLIP LOGO"          value={client.logo ? "Uploaded" : "Not uploaded"} icon={ImageIcon} />
        </div>

      </Card>

      {editing && (
        <ClientFormModal
          client={client}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onEdited();
          }}
        />
      )}
    </div>
  );
}

export default function ClientWorkspace() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "details";
  const navigate = useNavigate();
  const smartBack = useSmartBack("/payroll");

  const clientQuery = useClient(id);
  const client = clientQuery.data;

  // Client-scoped counts — filtered server-side now that
  // PayrollBatchViewSet/EmailLogViewSet both accept ?client=.
  const batchesQuery = useBatches({ client: id });
  const batches = unwrapList(batchesQuery.data);
  const emailLogsQuery = useEmailLogs({ client: id });
  const emailLogs = unwrapList(emailLogsQuery.data);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [choosingDesign, setChoosingDesign] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [importingEmployees, setImportingEmployees] = useState(false);
  // Bumped whenever an employee is added/imported so the embedded
  // EmployeesList (which manages its own fetch internally, no shared
  // query cache) remounts and re-fetches instead of showing stale data.
  const [employeesRefreshKey, setEmployeesRefreshKey] = useState(0);

  const setTab = (tab) => setSearchParams({ tab });

  const emailsSent = emailLogs.filter((l) => l.success).length;
  const emailsFailed = emailLogs.filter((l) => !l.success).length;

  if (clientQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <ErrorState message="This client could not be found." onRetry={clientQuery.refetch} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-3" style={{ zoom: 0.9 }}>
      <Breadcrumb
        items={[
          { label: "🏦 Payroll" },
          { label: "Dashboard", onClick: smartBack },
          { label: client.name.toUpperCase() },
        ]}
      />

      {/* Boxed header card — name + status badge on the left, a Payroll
          chip on the right, mirroring the reference's title/badge row
          plus its top-right "GSTR-1" chip. */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-3)" }}
            >
              {client.logo ? (
                <img src={client.logo} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 size={22} style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold truncate" style={{ color: "var(--text-strong)" }}>
                  {client.name.toUpperCase()}
                </h1>
                <Badge tone="blue">ACTIVE</Badge>
                <span
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold"
                  style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", color: "var(--blue-text-strong)" }}
                >
                  <IndianRupee size={11} /> Payroll
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Client since {formatDateTime(client.created_at)} · {batches.length} payroll batches on file
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddingEmployee(true)}>
              <UserPlus size={14} /> Add Employee
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setImportingEmployees(true)}>
              <Upload size={14} /> Import Employees
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setChoosingDesign(true)}>
              <Palette size={14} /> Choose Design
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload size={14} /> Upload Payroll
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <TabRow active={activeTab} onChange={setTab} />
        </div>
      </Card>

      {activeTab === "details" && (
        <ClientDetailsTab
          client={client}
          batches={batches}
          emailsSent={emailsSent}
          emailsFailed={emailsFailed}
          onEdited={clientQuery.refetch}
        />
      )}

      {activeTab === "employees" && (
        <EmployeesList
          key={employeesRefreshKey}
          embedded
          lockedClientId={id}
          onOpenEmployee={(empId) => navigate(`/payroll/employees/${empId}`)}
        />
      )}

      {activeTab === "batches" && (
        <BatchList embedded filters={{ client: id }} />
      )}

      {activeTab === "emails" && (
        <EmailLogBatches embedded filters={{ client: id }} />
      )}

      {batches.length === 0 && activeTab === "details" && (
        <Card className="p-6">
          <EmptyState emoji="🧾" message="No payroll batches yet for this client — upload the first month's payroll to get started." />
        </Card>
      )}

      {uploadOpen && (
        <UploadPayrollModal
          clients={[client]}
          onClose={() => setUploadOpen(false)}
          onUploaded={(batch) => {
            setUploadOpen(false);
            navigate(`/payroll/batches/${batch.id}`);
          }}
        />
      )}

      {choosingDesign && (
        <ChooseDesignModal
          client={client}
          onClose={() => setChoosingDesign(false)}
          onSaved={clientQuery.refetch}
        />
      )}

      {addingEmployee && (
        <EmployeeFormModal
          clients={[client]}
          defaultClientId={id}
          onClose={() => setAddingEmployee(false)}
          onSaved={() => {
            setAddingEmployee(false);
            setEmployeesRefreshKey((k) => k + 1);
          }}
        />
      )}

      {importingEmployees && (
        <ImportEmployeesModal
          clientId={id}
          onClose={() => setImportingEmployees(false)}
          onImported={() => {
            setImportingEmployees(false);
            setEmployeesRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}