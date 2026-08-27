const CARD_ICON_WASH_TONE = {
  slate: { background: "var(--surface-3)", color: "var(--text-secondary)" },
  blue: { background: "var(--chip-blue-wash)", color: "var(--chip-blue-icon)" },
  amber: { background: "var(--chip-amber-wash)", color: "var(--chip-amber-icon)" },
  green: { background: "var(--chip-green-wash)", color: "var(--chip-green-icon)" },
  red: { background: "var(--red-bg)", color: "var(--chip-red-icon)" },
  purple: { background: "var(--chip-purple-wash)", color: "var(--chip-purple-icon)" },
};

const CARD_BORDER_TONE = {
  slate: "var(--border-3)",
  blue: "var(--blue-border)",
  amber: "var(--amber-border)",
  green: "var(--green-border)",
  red: "var(--red-border)",
  purple: "var(--purple-border)",
};

const CARD_TOP_BORDER_HOVER_TONE = {
  slate: "var(--border-5)",
  blue: "var(--blue-solid)",
  amber: "var(--amber-solid)",
  green: "var(--green-solid)",
  red: "var(--red-solid)",
  purple: "var(--purple-text)",
};

export function StatCard({ icon: Icon, label, value, tone, accent, compact, active, highlight, onClick, ...rest }) {
  const resolvedTone = accent || tone || "blue";
  const borderColor = CARD_BORDER_TONE[resolvedTone] || CARD_BORDER_TONE.blue;
  const topBorderHoverColor = CARD_TOP_BORDER_HOVER_TONE[resolvedTone] || CARD_TOP_BORDER_HOVER_TONE.blue;
  const iconWash = CARD_ICON_WASH_TONE[resolvedTone] || CARD_ICON_WASH_TONE.blue;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl transition-colors ${compact ? "p-3" : "p-4"}`}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: `1px solid ${borderColor}`,
        borderTop: `1px solid ${borderColor}`,
        boxShadow: active ? `0 0 0 2px ${borderColor}` : undefined,
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderTop = `3px solid ${topBorderHoverColor}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderTop = `1px solid ${borderColor}`; }}
      {...rest}
    >
      {Icon && (
        <span
          className="flex items-center justify-center rounded-lg p-2"
          style={iconWash}
        >
          <Icon size={compact ? 16 : 18} />
        </span>
      )}
      <div className="min-w-0">
        <div className={`${compact ? "text-base" : "text-lg"} font-semibold truncate`} style={{ color: "var(--text-strong)" }}>
          {value}
          {highlight && (
            <span
              className="inline-block rounded-full ml-1.5"
              style={{ width: 6, height: 6, background: borderColor, verticalAlign: "middle" }}
            />
          )}
        </div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const TOP_BORDER_TONE = {
  slate: "var(--border-5)",
  blue: "var(--blue-solid)",
  amber: "var(--amber-solid)",
  green: "var(--green-solid)",
  red: "var(--red-solid)",
  purple: "var(--purple-text)",
};

const ICON_WASH_TONE = {
  slate: { background: "var(--surface-3)", color: "var(--text-secondary)" },
  blue: { background: "var(--chip-blue-wash)", color: "var(--chip-blue-icon)" },
  amber: { background: "var(--chip-amber-wash)", color: "var(--chip-amber-icon)" },
  green: { background: "var(--chip-green-wash)", color: "var(--chip-green-icon)" },
  red: { background: "var(--red-bg)", color: "var(--chip-red-icon)" },
  purple: { background: "var(--chip-purple-wash)", color: "var(--chip-purple-icon)" },
};

const HOVER_BG_TONE = {
  slate: "var(--surface-3)",
  blue: "var(--blue-bg)",
  amber: "var(--amber-bg)",
  green: "var(--green-bg)",
  red: "var(--red-bg)",
  purple: "var(--purple-bg)",
};

/**
 * DashboardStatCard — matches the reference GST dashboard's stat card
 * exactly: a colored 3px top border strip, a tinted icon square, a big
 * bold number, a label, and an optional small muted subtext line
 * underneath (e.g. "all jobs", "todo · in progress · rework").
 */
export function DashboardStatCard({ icon: Icon, value, label, subtext, tone = "blue", onClick }) {
  const toneColor = TOP_BORDER_TONE[tone] || TOP_BORDER_TONE.blue;
  const hoverBg = HOVER_BG_TONE[tone] || HOVER_BG_TONE.blue;
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4 transition-colors"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: `1px solid ${toneColor}`,
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.borderTop = `3px solid ${toneColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--glass-bg)";
        e.currentTarget.style.borderTop = `1px solid ${toneColor}`;
      }}
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
        style={ICON_WASH_TONE[tone] || ICON_WASH_TONE.blue}
      >
        {Icon && <Icon size={17} />}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>{value}</div>
      <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text-strong)" }}>{label}</div>
      {subtext && (
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtext}</div>
      )}
    </div>
  );
}