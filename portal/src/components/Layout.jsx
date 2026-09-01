import React from "react";
import { api, clearSession } from "../api";
import { navigate } from "../router";

const NAV = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/input", label: "Monthly Input", icon: "🗓️" },
  { path: "/employees", label: "Employees", icon: "👥" },
  { path: "/structures", label: "Salary Structures", icon: "💼" },
  { path: "/advances", label: "Advances & Loans", icon: "💰" },
];

export default function Layout({ user, route, onLogout, children }) {
  const logout = async () => {
    try { await api.post("/portal/logout/"); } catch { /* ignore */ }
    clearSession();
    onLogout();
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CK</div>
          <div>
            <div className="brand-name">Payroll Portal</div>
            <div className="brand-sub">C K Partha Sarathy & Co</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.path}
              className={`nav-item ${route.path === n.path ? "active" : ""}`}
              onClick={() => navigate(n.path)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="who">
            <div className="who-name">{user.email}</div>
            <div className="who-client">{user.client_name}</div>
          </div>
          <button
            className={`nav-item ${route.path === "/password" ? "active" : ""}`}
            onClick={() => navigate("/password")}
          >
            <span className="nav-icon">🔑</span> Change Password
          </button>
          <button className="nav-item" onClick={logout}>
            <span className="nav-icon">⏻</span> Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-title">Client Portal</div>
          <div className="topbar-right">
            <span className="who-client">{user.client_name}</span>
          </div>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
