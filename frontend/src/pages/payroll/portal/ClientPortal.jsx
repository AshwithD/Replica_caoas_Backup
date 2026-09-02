import React, { useEffect, useState } from "react";
import { api, clearSession, getStoredUser, getToken, setSession } from "./api";
import Login from "./Login";
import MonthlyInput from "./MonthlyInput";
import { Spinner } from "./ui";
import "./portal.css";

/**
 * Client portal — lives inside the main app at /portal (public route).
 * Only the monthly payroll input is exposed here; the read-only views
 * (employees / structures / advances) and password page were dropped.
 */
export default function ClientPortal() {
  const [user, setUser] = useState(getStoredUser());
  const [booting, setBooting] = useState(true);

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
            <div className="topbar-right">
              <span className="who-client">{user.client_name}</span>
              <button className="btn btn-ghost btn-sm logout" onClick={logout}>Log out</button>
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
