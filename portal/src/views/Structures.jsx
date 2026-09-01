import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, EmptyState, ErrorBanner, Spinner, fmtINR } from "../components/ui";

export default function Structures() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/portal/salary-structures/")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const list = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Salary Structures</h1>
        <p className="page-sub">Current CTC break-ups on file (read-only). Revisions go through Monthly Input.</p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="center" style={{ padding: 40 }}><Spinner /></div>
      ) : list.length === 0 ? (
        <Card><EmptyState title="No salary structures yet" hint="Structures appear once an employee has a CTC on file." /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Effective from</th>
                <th className="num">Monthly Gross</th>
                <th className="num">Basic + DA</th>
                <th className="num">HRA</th>
                <th className="num">Special Allow.</th>
                <th className="num">CTC (annual)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="strong">
                    {s.employee_code} — {s.employee_name}
                  </td>
                  <td>{s.effective_from}</td>
                  <td className="num">₹{fmtINR(s.monthly_gross)}</td>
                  <td className="num">₹{fmtINR(s.original_basic_da)}</td>
                  <td className="num">₹{fmtINR(s.original_hra)}</td>
                  <td className="num">₹{fmtINR(s.original_special_allowance)}</td>
                  <td className="num">₹{fmtINR(s.ctc_annual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
