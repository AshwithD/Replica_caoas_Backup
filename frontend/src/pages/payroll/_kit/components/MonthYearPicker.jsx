import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS } from "../utils/utils";

export default function MonthYearPicker({ month, year, onChange }) {
  const [viewYear, setViewYear] = useState(year);
  const [mode, setMode] = useState("month"); // "month" | "year"

  // decade base: floor to nearest 12
  const decadeBase = Math.floor(viewYear / 12) * 12;
  const yearGrid = Array.from({ length: 12 }, (_, i) => decadeBase + i);

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)" }}>
      {/* nav row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => mode === "month" ? setViewYear((y) => y - 1) : setViewYear((y) => y - 12)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ background: "var(--border-1)", border: "1px solid var(--border-3)", color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={14} />
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => m === "month" ? "year" : "month")}
          className="text-sm font-semibold px-2 py-0.5 rounded-lg transition-colors"
          style={{
            color: "var(--text-primary)",
            background: mode === "year" ? "var(--blue-bg)" : "transparent",
            border: mode === "year" ? "1px solid var(--blue-border)" : "1px solid transparent",
          }}
        >
          {mode === "month" ? viewYear : `${decadeBase} – ${decadeBase + 11}`}
        </button>

        <button
          type="button"
          onClick={() => mode === "month" ? setViewYear((y) => y + 1) : setViewYear((y) => y + 12)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ background: "var(--border-1)", border: "1px solid var(--border-3)", color: "var(--text-secondary)" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {mode === "month" ? (
        <div className="grid grid-cols-4 gap-1.5">
          {MONTHS.map((m, i) => {
            const isSelected = i + 1 === month && viewYear === year;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onChange(i + 1, viewYear)}
                className="rounded-lg py-1.5 text-xs font-medium transition-all"
                style={{
                  background: isSelected ? "var(--blue-border)" : "var(--surface-2)",
                  border:     isSelected ? "1px solid var(--blue-border)" : "1px solid var(--border-2)",
                  color:      isSelected ? "var(--blue-text-strong)" : "var(--text-muted)",
                }}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {yearGrid.map((y) => {
            const isSelected = y === year;
            return (
              <button
                key={y}
                type="button"
                onClick={() => { setViewYear(y); setMode("month"); }}
                className="rounded-lg py-1.5 text-xs font-medium transition-all"
                style={{
                  background: isSelected ? "var(--blue-border)" : "var(--surface-2)",
                  border:     isSelected ? "1px solid var(--blue-border)" : "1px solid var(--border-2)",
                  color:      isSelected ? "var(--blue-text-strong)" : "var(--text-muted)",
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}