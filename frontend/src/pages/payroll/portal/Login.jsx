import React, { useState } from "react";
import {
  Eye, EyeOff, IndianRupee, Info, Lock, LogIn, Mail, ShieldCheck, UserMinus, Users,
} from "lucide-react";
import { api, setSession } from "./api";
import { Button, ErrorBanner } from "./ui";

const POINTS = [
  { icon: Users, label: "Joiners & salary revisions" },
  { icon: UserMinus, label: "Exits & salary holds" },
  { icon: IndianRupee, label: "Advances & one-off items" },
  { icon: ShieldCheck, label: "Secure & trusted by your payroll team" },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // "Forgot password?" has no self-service reset — the payroll team resets it.
  // Clicking it highlights the help panel instead of leading to a dead end.
  const [helpFlash, setHelpFlash] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setBusy(true); setError("");
    try {
      const data = await api.post("/portal/login/", { email, password });
      setSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const flashHelp = () => {
    setHelpFlash(false);
    // restart the animation on repeat clicks
    requestAnimationFrame(() => setHelpFlash(true));
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-card">
          {/* ── brand panel ── */}
          <aside className="auth-panel">
            <div className="auth-wave" aria-hidden="true">
              <svg viewBox="0 0 520 260" preserveAspectRatio="none">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <path
                    key={i}
                    d={`M-20 ${150 + i * 16} C 120 ${90 + i * 14}, 300 ${230 + i * 10}, 540 ${120 + i * 18}`}
                    fill="none"
                    stroke="rgba(120, 175, 255, 0.35)"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>

            <div className="auth-panel-inner">
              <div className="auth-brand">
                <div className="auth-mark">CK</div>
                <div className="auth-brand-name">C K Partha Sarathy &amp; Co</div>
                <div className="auth-brand-sub">Payroll Portal</div>
              </div>

              <span className="auth-rule" />

              <h2 className="auth-tagline">
                Submit your monthly payroll input to your payroll team
              </h2>
              <p className="auth-tagline-sub">Quickly, securely and with complete confidence.</p>

              <ul className="auth-points">
                {POINTS.map(({ icon: Icon, label }) => (
                  <li key={label}>
                    <span className="auth-point-ico"><Icon size={16} /></span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              <div className="auth-secure">
                <Lock size={14} /> Your data is secure and confidential
              </div>
            </div>
          </aside>

          {/* ── sign-in form ── */}
          <div className="auth-form">
            <h1 className="auth-title">Welcome back!</h1>
            <p className="auth-sub">Sign in with the credentials provided by your payroll team.</p>

            <form onSubmit={submit} className="auth-fields">
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <span className="auth-input">
                  <Mail size={17} className="auth-input-ico" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="username"
                  />
                </span>
              </label>

              <label className="auth-field">
                <span className="auth-label">Password</span>
                <span className="auth-input">
                  <Lock size={17} className="auth-input-ico" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <div className="auth-row">
                <span className="auth-note-inline">
                  <Lock size={12} /> You're signed out when the browser closes.
                </span>
                <button type="button" className="auth-link" onClick={flashHelp}>
                  Forgot password?
                </button>
              </div>

              <ErrorBanner message={error} />

              <Button type="submit" disabled={busy} className="btn-block btn-lg auth-submit">
                <LogIn size={17} /> {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className={`auth-help ${helpFlash ? "flash" : ""}`}>
              <Info size={16} />
              <div>
                <div className="auth-help-title">Need help?</div>
                <div className="auth-help-text">
                  Contact your payroll team if you're unable to access your account.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-copy">
          © {new Date().getFullYear()} C K Partha Sarathy &amp; Co. All rights reserved.
        </div>
      </div>
    </div>
  );
}
