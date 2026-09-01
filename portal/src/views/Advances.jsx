import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, EmptyState, ErrorBanner, Spinner, fmtINR } from "../components/ui";

export default function Advances() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/portal/advances/")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const list = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Advances & Loans</h1>
        <p className="page-sub">EMI-style advances and loans on file (read-only). New ones go through Monthly Input.</p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="center" style={{ padding: 40 }}><Spinner /></div>
      ) : list.length === 0 ? (
        <Card><EmptyState title="No advances or loans" hint="Nothing on file yet." /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="num">Total</th>
                <th className="num">EMI / month</th>
                <th>Tenure</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="strong">{a.employee_code} — {a.employee_name}</td>
                  <td className="num">₹{fmtINR(a.total_amount)}</td>
                  <td className="num">₹{fmtINR(a.emi_amount)}</td>
                  <td>{a.tenure_months} months</td>
                  <td className="muted">{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
