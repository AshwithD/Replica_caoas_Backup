import React, { useEffect, useState } from "react";
import { api } from "../api";
import { navigate } from "../router";
import { Badge, Button, Card, EmptyState, ErrorBanner, Spinner, fmtINR } from "../components/ui";

const STATUS_TONE = { DRAFT: "slate", SUBMITTED: "amber", APPROVED: "green", REJECTED: "red" };

function useList(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(path)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err.message }));
  };
  useEffect(load, [path]);
  return { ...state, refetch: load };
}

export default function Dashboard() {
  const employees = useList("/portal/employees/");
  const structures = useList("/portal/salary-structures/");
  const advances = useList("/portal/advances/");
  const submissions = useList("/portal/submissions/");

  const loading = employees.loading || structures.loading || advances.loading || submissions.loading;
  const error = employees.error || structures.error || advances.error || submissions.error;
  const submissionList = Array.isArray(submissions.data) ? submissions.data : [];

  const stats = [
    { icon: "👥", label: "Employees", value: Array.isArray(employees.data) ? employees.data.length : 0, path: "/employees" },
    { icon: "💼", label: "Salary Structures", value: Array.isArray(structures.data) ? structures.data.length : 0, path: "/structures" },
    { icon: "💰", label: "Active Advances", value: Array.isArray(advances.data) ? advances.data.length : 0, path: "/advances" },
    { icon: "🗓️", label: "Months with Input", value: submissionList.filter((s) => (s.item_count || 0) > 0).length, path: "/input" },
  ];

  const latest = submissionList[0];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Your company's payroll data and monthly input — review and submit changes here.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate(s.path)}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{loading ? "…" : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-16">
        <div className="row between mb-8">
          <h3 style={{ margin: 0, fontSize: 15 }}>Monthly Payroll Input</h3>
          <Button size="sm" onClick={() => navigate("/input")}>Open Monthly Input</Button>
        </div>

        {loading ? (
          <div className="center" style={{ padding: 20 }}><Spinner /></div>
        ) : submissionList.length === 0 ? (
          <EmptyState
            title="No months opened yet"
            hint="Open the Monthly Input screen to record this month's joiners, revisions, exits and other changes."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Status</th>
                <th>Items</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissionList.slice(0, 6).map((s) => (
                <tr key={s.id}>
                  <td className="strong">
                    {new Date(s.year, s.month - 1, 1).toLocaleString("en", { month: "long" })} {s.year}
                  </td>
                  <td><Badge tone={STATUS_TONE[s.status] || "slate"}>{s.status}</Badge></td>
                  <td>{s.item_count}</td>
                  <td className="muted small">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {latest && (
        <Card className="mt-16">
          <div className="row between">
            <div>
              <div className="small muted">Latest submission</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(latest.year, latest.month - 1, 1).toLocaleString("en", { month: "long" })} {latest.year}
              </div>
            </div>
            <Badge tone={STATUS_TONE[latest.status] || "slate"}>{latest.status}</Badge>
          </div>
          {latest.approved_at && (
            <div className="small" style={{ color: "var(--green)", marginTop: 8 }}>
              ✓ last approved {new Date(latest.approved_at).toLocaleDateString()} — open for more changes
            </div>
          )}
          {latest.rejection_reason && (
            <div className="error-banner mt-8">Returned by payroll team: {latest.rejection_reason}</div>
          )}
        </Card>
      )}
    </div>
  );
}
