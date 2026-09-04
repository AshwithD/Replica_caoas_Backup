import { useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button, Input } from "./primitives";

/**
 * Password input for staff-created credentials (portal logins).
 *
 * Staff type these in on behalf of a client and then have to read the value
 * out to them, so a masked-only box is the wrong control here: you cannot
 * verify what you typed, you cannot copy it, and there is no signal that a
 * one-character password will be rejected by the backend validators.
 *
 * This component therefore provides:
 *   • show/hide toggle (visible by default when creating — the whole point
 *     is that staff can read the password back to the client),
 *   • a "Generate" button producing a strong, unambiguous password,
 *   • copy-to-clipboard,
 *   • a live strength meter + the actual rule checklist mirroring Django's
 *     validators, so failures are visible before submitting.
 */

// Ambiguous glyphs (O/0, l/1/I) are excluded — these passwords get read
// aloud and retyped by the client, so they must be transcribable.
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*?-_=+";

export function generatePassword(length = 14) {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  // Guarantee one of each class, then fill and shuffle.
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// Mirrors Django's default validators (settings.AUTH_PASSWORD_VALIDATORS):
// MinimumLength(8), NumericPassword, CommonPassword.
export function passwordChecks(value) {
  const v = value || "";
  return [
    { key: "len", label: "At least 8 characters", ok: v.length >= 8 },
    { key: "num", label: "Not entirely numbers", ok: v.length > 0 && !/^\d+$/.test(v) },
    { key: "mix", label: "Letters and numbers", ok: /[a-zA-Z]/.test(v) && /\d/.test(v) },
    { key: "case", label: "Upper and lower case", ok: /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { key: "sym", label: "A symbol (recommended)", ok: /[^a-zA-Z0-9]/.test(v), optional: true },
  ];
}

function strengthOf(value) {
  const checks = passwordChecks(value);
  const passed = checks.filter((c) => c.ok).length;
  if (!value) return { score: 0, label: "", tone: "var(--border-3)" };
  if (passed <= 2) return { score: 1, label: "Weak", tone: "var(--red-solid, #dc2626)" };
  if (passed === 3) return { score: 2, label: "Fair", tone: "#d97706" };
  if (passed === 4) return { score: 3, label: "Good", tone: "#0284c7" };
  return { score: 4, label: "Strong", tone: "var(--green-solid, #16a34a)" };
}

export default function PasswordField({
  value,
  onChange,
  label = "Password",
  hint,
  // When editing an existing user a blank value means "keep current password",
  // so the checklist/meter stay hidden until something is typed.
  optional = false,
  confirmValue,
  onConfirmChange,
}) {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const checks = useMemo(() => passwordChecks(value), [value]);
  const strength = useMemo(() => strengthOf(value), [value]);
  const showFeedback = !!value || !optional;
  const mismatch =
    onConfirmChange && value && confirmValue && value !== confirmValue;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (non-HTTPS origin) — the value is visible anyway */
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={optional ? "Leave blank to keep current password" : "Type or generate a password"}
            autoComplete="new-password"
            spellCheck={false}
            style={{ paddingRight: 60, fontFamily: visible ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined }}
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              title={visible ? "Hide password" : "Show password"}
              aria-label={visible ? "Hide password" : "Show password"}
              className="p-1 rounded transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!value}
              title="Copy password"
              aria-label="Copy password"
              className="p-1 rounded transition-opacity hover:opacity-70 disabled:opacity-30"
              style={{ color: copied ? "var(--green-text)" : "var(--text-muted)" }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const next = generatePassword();
            onChange(next);
            onConfirmChange?.(next);
            setVisible(true);
          }}
          title="Generate a strong password"
        >
          <RefreshCw size={13} /> Generate
        </Button>
      </div>

      {onConfirmChange && (
        <Input
          type={visible ? "text" : "password"}
          value={confirmValue}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          spellCheck={false}
          style={{
            fontFamily: visible ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
            borderColor: mismatch ? "var(--red-border)" : undefined,
          }}
        />
      )}
      {mismatch && (
        <p className="text-xs" style={{ color: "var(--red-text)" }}>Passwords do not match.</p>
      )}

      {showFeedback && (
        <>
          {/* Strength meter */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ background: i <= strength.score ? strength.tone : "var(--border-3)" }}
                />
              ))}
            </div>
            {strength.label && (
              <span className="text-xs font-medium" style={{ color: strength.tone }}>
                {strength.label}
              </span>
            )}
          </div>

          {/* Rule checklist — mirrors the backend validators, so a rejection
              is visible before the form is ever submitted. */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {checks.map((c) => (
              <span
                key={c.key}
                className="flex items-center gap-1 text-xs"
                style={{ color: c.ok ? "var(--green-text)" : "var(--text-muted)" }}
              >
                <Check size={11} style={{ opacity: c.ok ? 1 : 0.3 }} />
                {c.label}
              </span>
            ))}
          </div>
        </>
      )}

      {hint && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}
