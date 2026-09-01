import React, { useState } from "react";
import { api, setSession } from "../api";
import { Button, ErrorBanner, Field, TextInput } from "../components/ui";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <div className="brand">
          <div className="brand-mark">CK</div>
          <div>
            <div className="brand-name">Payroll Portal</div>
            <div className="brand-sub">C K Partha Sarathy & Co</div>
          </div>
        </div>

        <form className="card" onSubmit={submit}>
          <h1 className="auth-title" style={{ color: "var(--ink)" }}>Sign in</h1>
          <p className="auth-sub" style={{ color: "var(--muted)" }}>
            Use the credentials provided by your payroll team.
          </p>

          <div className="grid" style={{ gap: 14 }}>
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
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            <ErrorBanner message={error} />

            <Button type="submit" disabled={busy} className="btn-block">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
