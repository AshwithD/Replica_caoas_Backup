import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Badge, Card, EmptyState, ErrorBanner, Spinner, fmtINR } from "../components/ui";

export default function Employees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    api.get("/portal/employees/")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const list = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Employees</h1>
        <p className="page-sub">The employee master as your payroll team has it on file (read-only).</p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="center" style={{ padding: 40 }}><Spinner /></div>
      ) : list.length === 0 ? (
        <Card><EmptyState title="No employees on file" hint="Add new joiners via Monthly Input; your payroll team approves them." /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th className="num">CTC (annual)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <React.Fragment key={e.id}>
                  <tr style={{ cursor: "pointer" }} onClick={() => setOpenId(openId === e.id ? null : e.id)}>
                    <td className="strong">{e.employee_code}</td>
                    <td>{e.full_name}</td>
                    <td>{e.department || "—"}</td>
                    <td>{e.position || "—"}</td>
                    <td>
                      <Badge tone={e.status === "active" ? "green" : "slate"}>{e.status}</Badge>
                    </td>
                    <td className="num">₹{fmtINR(e.latest_ctc_annual || e.ctc)}</td>
                  </tr>
                  {openId === e.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "#fbfcfe" }}>
                        <div className="grid grid-2" style={{ padding: "4px 0" }}>
                          <div className="small muted">Email: <span style={{ color: "var(--ink-2)" }}>{e.email || "—"}</span></div>
                          <div className="small muted">PAN: <span style={{ color: "var(--ink-2)" }}>{e.pan_number || "—"}</span></div>
                          <div className="small muted">Hire date: <span style={{ color: "var(--ink-2)" }}>{e.hire_date || "—"}</span></div>
                          <div className="small muted">Latest structure CTC: <span style={{ color: "var(--ink-2)" }}>₹{fmtINR(e.latest_ctc_annual)}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
