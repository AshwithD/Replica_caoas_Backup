import { forwardRef } from "react";
import { X, AlertTriangle } from "lucide-react";

const TONE_CLASSES = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "border",
  green: "border",
  amber: "border",
  red: "border",
  purple: "border",
};

const TONE_VARS = {
  blue: { background: "var(--blue-bg)", color: "var(--blue-text)", borderColor: "var(--blue-border)" },
  green: { background: "var(--green-bg)", color: "var(--green-text)", borderColor: "var(--green-border)" },
  amber: { background: "var(--amber-bg)", color: "var(--amber-text)", borderColor: "var(--amber-border)" },
  red: { background: "var(--red-bg)", color: "var(--red-text)", borderColor: "var(--red-border)" },
  purple: { background: "var(--purple-bg)", color: "var(--purple-text)", borderColor: "var(--purple-border)" },
  slate: { background: "var(--surface-3)", color: "var(--text-secondary)", borderColor: "var(--border-3)" },
};

export function Badge({ tone = "slate", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${TONE_CLASSES[tone] || TONE_CLASSES.slate} ${className}`}
      style={TONE_VARS[tone] || TONE_VARS.slate}
    >
      {children}
    </span>
  );
}

export function Button({ variant = "primary", size = "md", className = "", style, children, ...rest }) {
  const sizeCls = size === "sm" ? "text-xs px-2.5 py-1.5" : "text-sm px-3.5 py-2";
  const isSecondary = String(variant).toLowerCase() === "secondary";
  const base = {
    background: isSecondary ? "var(--surface-2)" : "#001F5B",
    color: isSecondary ? "var(--text-primary)" : "var(--text-white)",
    border: isSecondary ? "1px solid var(--border-3)" : "1px solid transparent",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeCls} ${className}`}
      style={{ ...base, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

const CARD_BORDER_TONE = {
  slate: "var(--border-3)",
  blue: "var(--blue-border)",
  green: "var(--green-border)",
  amber: "var(--amber-border)",
  red: "var(--red-border)",
  purple: "var(--purple-border)",
};

export function Card({ tone, className = "", style, children, ...rest }) {
  const borderColor = CARD_BORDER_TONE[tone] || CARD_BORDER_TONE.slate;
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: `1px solid ${borderColor}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center" style={{ color: "var(--text-muted)" }}>
      <AlertTriangle size={28} style={{ color: "var(--red-solid)" }} />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--surface-3)" }}
    />
  );
}

export function Modal({ title, onClose, size = "m", children }) {
  const width = size === "l" ? "max-w-3xl" : size === "s" ? "max-w-sm" : "max-w-xl";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${width} rounded-2xl p-5`}
        style={{ background: "var(--modal-panel-bg)", boxShadow: "var(--shadow-xl)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-strong)" }}>
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// forwardRef is required here: react-hook-form's register() returns a
// `ref` callback that it uses to bind directly to the underlying DOM
// input/textarea for uncontrolled fields (reading live values, running
// validation, etc). A plain function component can't receive a ref —
// React silently drops it — so without forwardRef, any field using
// {...register(...)} on this component never actually registers with
// RHF: watch()/setValue() see nothing, and required-field validation
// fails even after the user types (see SalaryStructureModal.jsx).
export const Input = forwardRef(function Input({ className = "", style, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${className}`}
      style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)", ...style }}
      {...rest}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className = "", style, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${className}`}
      style={{ border: "1px solid var(--border-4)", background: "var(--surface-1)", color: "var(--text-primary)", ...style }}
      {...rest}
    />
  );
});

export function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}
    >
      {children}
    </button>
  );
}