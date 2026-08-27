import { ArrowLeft } from "lucide-react";

/**
 * pages/payroll/_kit/PageHero.jsx
 *
 * Dark navy hero banner with an eyebrow label, title, subtitle, and a
 * right-aligned action slot — with a row of white stat cards that
 * overlap the bottom edge of the banner. Matches the visual language of
 * the reference "Reimbursements" screen (dark header + floating stat
 * cards + rounded white content cards below), reused across the payroll
 * pages instead of the flatter WorkspaceHeader look.
 */
export default function PageHero({ eyebrow, title, subtitle, onBack, action, stats = [] }) {
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl px-6 pt-6"
        style={{
          background: "linear-gradient(135deg, #0b1220 0%, #0f1c3f 60%, #12224a 100%)",
          paddingBottom: stats.length ? 56 : 24,
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-1 flex items-center justify-center rounded-lg p-1.5"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                aria-label="Back"
              >
                <ArrowLeft size={16} color="#fff" />
              </button>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {eyebrow}
                </p>
              )}
              <h1 className="text-2xl font-bold truncate" style={{ color: "#fff" }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>

      {stats.length > 0 && (
        <div
          className="grid gap-4 px-1"
          style={{
            marginTop: -40,
            gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative rounded-xl p-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)", boxShadow: "var(--shadow-md)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-strong)" }}>
                    {s.value}
                  </p>
                  {s.hint && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {s.hint}
                    </p>
                  )}
                </div>
                {s.icon && (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `var(--chip-${s.tone || "blue"}-wash)`, color: `var(--chip-${s.tone || "blue"}-icon)` }}
                  >
                    <s.icon size={18} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
