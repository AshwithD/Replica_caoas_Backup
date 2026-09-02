import { createContext, useCallback, useContext, useState } from "react";
import { Button } from "./primitives";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    setState(options);
  }, []);

  const close = () => setState(null);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "rgba(15, 23, 42, 0.5)", zIndex: 1110 }}
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: "var(--modal-panel-bg)", boxShadow: "var(--shadow-xl)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>
              {state.title || "Are you sure?"}
            </h3>
            {state.description && (
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {state.description}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button
                size="sm"
                style={state.variant === "danger" ? { background: "var(--red-solid)" } : undefined}
                onClick={async () => {
                  close();
                  if (state.onConfirm) await state.onConfirm();
                }}
              >
                {state.confirmLabel || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Falls back to a no-provider-mounted confirm so pages don't crash if
    // used outside <ConfirmProvider> — logs instead of blocking silently.
    return (options) => {
      // eslint-disable-next-line no-console
      console.warn("useConfirm() used outside <ConfirmProvider>", options);
      if (options?.onConfirm) options.onConfirm();
    };
  }
  return ctx;
}
