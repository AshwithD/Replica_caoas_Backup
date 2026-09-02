/**
 * pages/payroll/_kit/components/ClientLogo.jsx
 *
 * One consistent way to show "which client is this row about".
 *
 * The payroll client logo lives on payroll.ClientProfile.payroll_logo and is
 * exposed as `client_logo` by the payroll/portal serializers. A client added
 * in the Client module has no profile (and therefore no logo) yet, so instead
 * of a generic grey placeholder icon this falls back to the client's initials
 * on a colour derived from the name — every client still looks distinct.
 */

const WASHES = [
  { bg: "var(--blue-bg-strong)", fg: "var(--blue-text)" },
  { bg: "var(--green-bg-strong)", fg: "var(--green-text)" },
  { bg: "var(--amber-bg-strong)", fg: "var(--amber-text)" },
  { bg: "var(--purple-bg-strong)", fg: "var(--purple-text)" },
  { bg: "var(--red-bg-strong)", fg: "var(--red-text)" },
];

export function clientInitials(name) {
  const words = String(name || "")
    .replace(/[^\p{L}\p{N}\s&.-]/gu, " ")
    .split(/[\s.&-]+/)
    .filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function washFor(name) {
  const key = String(name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return WASHES[hash % WASHES.length];
}

export default function ClientLogo({ name, logo, size = 40, rounded = 12, className = "" }) {
  const wash = washFor(name);
  const box = {
    width: size,
    height: size,
    borderRadius: rounded,
    border: "1px solid var(--border-3)",
    flexShrink: 0,
    overflow: "hidden",
  };

  if (logo) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ ...box, background: "var(--surface-1)" }}
        title={name || ""}
      >
        <img
          src={logo}
          alt={name ? `${name} logo` : "Client logo"}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: size > 30 ? 4 : 2 }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-semibold ${className}`}
      style={{
        ...box,
        background: wash.bg,
        color: wash.fg,
        fontSize: Math.max(11, Math.round(size * 0.36)),
        letterSpacing: 0.3,
      }}
      title={name || ""}
      aria-label={name || "Client"}
    >
      {clientInitials(name)}
    </div>
  );
}
