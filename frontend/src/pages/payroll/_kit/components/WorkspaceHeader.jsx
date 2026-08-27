import { ArrowLeft } from "lucide-react";

export default function WorkspaceHeader({ title, subtitle, onBack, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-lg p-1.5"
            style={{ border: "1px solid var(--border-3)", background: "var(--surface-1)" }}
            aria-label="Back"
          >
            <ArrowLeft size={16} style={{ color: "var(--text-primary)" }} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate" style={{ color: "var(--text-strong)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
