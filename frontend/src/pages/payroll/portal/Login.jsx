import React, { useState } from "react";
import { api, setSession } from "./api";
import { Button, ErrorBanner, Field, TextInput } from "./ui";

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="M2 2l20 20" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <aside className="auth-panel">
          <div className="auth-brand">
            <div className="brand-mark">CK</div>
            <div className="auth-brand-name">Payroll Portal</div>
            <div className="auth-brand-sub">C K Partha Sarathy &amp; Co</div>
          </div>

          <p className="auth-tagline">
            Submit your monthly payroll input to your payroll team — quickly and securely.
          </p>

          <ul className="auth-points">
            <li>Joiners &amp; salary revisions</li>
            <li>Exits &amp; salary holds</li>
            <li>Advances &amp; one-off items</li>
          </ul>

          <div className="auth-foot">© {new Date().getFullYear()} C K Partha Sarathy &amp; Co</div>
        </aside>

        <div className="auth-form">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in with the credentials provided by your payroll team.</p>

          <form onSubmit={submit} className="grid" style={{ gap: 14 }}>
            <Field label="Email">
              <TextInput
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </Field>

            <Field label="Password">
              <div className="pw-wrap">
                <input
                  className="control"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </Field>

            <ErrorBanner message={error} />

            <Button type="submit" disabled={busy} className="btn-block">
              {busy ? "Signing in…" : "Sign in"}
            </Button>

            <p className="auth-note">You'll be signed out automatically when you close the browser.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
