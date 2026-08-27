/**
 * pages/payroll/_kit/Breadcrumb.jsx
 *
 * Pill-style breadcrumb trail, matching the reference GST workspace's
 * top nav ("🏢 GST > GSTR-1 > Dashboard > All Jobs > CLIENT"). `items` is
 * an ordered array of { label, onClick? } — the last item is rendered as
 * the current page (bold, no link). An emoji/icon can be passed as the
 * first item's `icon` to match the leading module glyph in the reference.
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-3)" }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: "var(--text-faint)" }}>›</span>}
            {item.icon && <span>{item.icon}</span>}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </button>
            ) : (
              <span style={{ color: isLast ? "var(--text-strong)" : "var(--text-muted)", fontWeight: isLast ? 600 : 400 }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
