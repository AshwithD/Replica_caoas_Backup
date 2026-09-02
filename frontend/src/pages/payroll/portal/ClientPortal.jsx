import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { api, clearSession, getStoredUser, getToken, setSession } from "./api";
import Login from "./Login";
import MonthlyInput from "./MonthlyInput";
import { Spinner } from "./ui";
import "./portal.css";

// "Ashwith Kumar" → "AK" (falls back to the client name / e-mail initial).
const initials = (text) =>
  (text || "?")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * Client portal — lives inside the main app at /portal (public route).
 * Only the monthly payroll input is exposed here; the read-only views
 * (employees / structures / advances) and password page were dropped.
 */
export default function ClientPortal() {
  const [user, setUser] = useState(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account menu on any outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Revalidate the stored portal token on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) { setBooting(false); return; }
      try {
        const me = await api.get("/portal/me/");
        if (!cancelled) { setSession(getToken(), me); setUser(me); }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // A 401 anywhere (expired token) drops the client back to login.
  useEffect(() => {
    const onUnauth = () => setUser(null);
    window.addEventListener("portal:unauthorized", onUnauth);
    return () => window.removeEventListener("portal:unauthorized", onUnauth);
  }, []);

  const logout = async () => {
    try { await api.post("/portal/logout/"); } catch { /* ignore */ }
    clearSession();
    setUser(null);
  };

  return (
    <div id="client-portal">
      {booting ? (
        <div className="screen-loading"><Spinner /></div>
      ) : !user ? (
        <Login onLogin={setUser} />
      ) : (
        <>
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">CK</div>
              <div>
                <div className="brand-name">Payroll Portal</div>
                <div className="brand-sub">C K Partha Sarathy & Co</div>
              </div>
            </div>
            {/* co-branding: the client's own logo (payroll_logo) once it is
                uploaded, so the portal looks like theirs, not a placeholder */}
            {user.client_logo ? (
              <div className="client-chip" title={user.client_name}>
                <img src={user.client_logo} alt={`${user.client_name || "Client"} logo`} />
                <span>{user.client_name}</span>
              </div>
            ) : null}
            <div className="topbar-right" ref={menuRef}>
              <button
                type="button"
                className="who"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="who-text">
                  <span className="who-name">{user.full_name || user.email}</span>
                  <span className="who-client">{user.client_name}</span>
                </span>
                <ChevronDown size={16} className="who-caret" />
                <span className="who-avatar">
                  {initials(user.full_name || user.email)}
                </span>
              </button>

              {menuOpen && (
                <div className="who-menu" role="menu">
                  <div className="who-menu-head">
                    <div className="who-menu-name">{user.full_name || user.email}</div>
                    <div className="who-menu-sub">{user.client_name}</div>
                  </div>
                  <button type="button" className="who-menu-item" onClick={logout} role="menuitem">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          </header>
          <main className="content">
            <MonthlyInput />
          </main>
        </>
      )}
    </div>
  );
}
