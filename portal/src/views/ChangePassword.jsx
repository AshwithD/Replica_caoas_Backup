import React, { useState } from "react";
import { api, setSession } from "../api";
import { navigate } from "../router";
import { Button, ErrorBanner, Field, TextInput } from "../components/ui";

export default function ChangePassword({ user, onDone }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirm) { setError("New passwords do not match."); return; }
    setBusy(true);
    try {
      const data = await api.post("/portal/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSession(data.token, data.user);
      setDone(true);
      onDone(data.user);
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
          <h1 className="auth-title" style={{ color: "var(--ink)" }}>Change password</h1>
          <p className="auth-sub" style={{ color: "var(--muted)" }}>
            {user.must_change_password
              ? "You must set a new password before continuing."
              : `Signed in as ${user.email}`}
          </p>

          {done ? (
            <div className="grid" style={{ gap: 14 }}>
              <div className="success-banner">Password updated successfully.</div>
              <Button type="button" onClick={() => navigate("/")}>Go to dashboard</Button>
            </div>
          ) : (
            <div className="grid" style={{ gap: 14 }}>
              <Field label="Current password">
                <TextInput type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" />
              </Field>
              <Field label="New password" hint="At least 8 characters">
                <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password">
                <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </Field>

              <ErrorBanner message={error} />

              <Button type="submit" disabled={busy} className="btn-block">
                {busy ? "Saving…" : "Update password"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
