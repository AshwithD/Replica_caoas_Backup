import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function GlassDropdown({ value, onChange, options = [], placeholder = "Select", width = "w-40" }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const ref = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open || !ref.current) return;
    const updateRect = () => setRect(ref.current.getBoundingClientRect());
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${width}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between rounded-lg px-3 text-sm"
        style={{ background: "var(--border-1)", border: "1px solid var(--border-4)", color: "var(--text-primary)" }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} />
      </button>
      {open && rect && createPortal(
        <div
          ref={panelRef}
          className="payroll-scope overflow-hidden rounded-lg"
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 1000,
            background: "var(--surface-1)",
            border: "1px solid var(--border-3)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <button
            className="block w-full px-3 py-2 text-left text-sm"
            style={{ color: "var(--text-muted)" }}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {placeholder}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              className="block w-full px-3 py-2 text-left text-sm"
              style={{ color: "var(--text-primary)" }}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}