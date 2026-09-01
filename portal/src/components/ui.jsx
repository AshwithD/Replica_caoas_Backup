import React from "react";

export function Button({ variant = "primary", size, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`];
  if (size === "sm") cls.push("btn-sm");
  if (className) cls.push(className);
  return <button className={cls.join(" ")} {...rest} />;
}

export function Badge({ tone = "slate", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Card({ className = "", children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export const TextInput = (props) => <input className="control" {...props} />;
export const NumberInput = (props) => (
  <input className="control" type="number" step="any" min="0" {...props} />
);
export const DateInput = (props) => <input className="control" type="date" {...props} />;
export const TextArea = (props) => <textarea className="control" {...props} />;

export function SelectInput({ options, placeholder = "Select…", value, onChange, ...rest }) {
  return (
    <select className="control" value={value ?? ""} onChange={onChange} {...rest}>
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
}

export function EmptyState({ title = "Nothing here yet", hint }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {hint && <div className="empty-hint">{hint}</div>}
    </div>
  );
}

export const fmtINR = (n) => new Intl.NumberFormat("en-IN").format(Number(n || 0));
