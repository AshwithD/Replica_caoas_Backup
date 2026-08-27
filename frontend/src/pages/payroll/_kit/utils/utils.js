import { useNavigate } from "react-router-dom";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatCurrency(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// DRF list responses are either a bare array or a paginated
// { count, results } object depending on the viewset's pagination_class —
// this normalizes either shape to a plain array.
export function unwrapList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

export function useSmartBack(fallback = "/payroll") {
  const navigate = useNavigate();
  return () => {
    if (window.history.length > 2) navigate(-1);
    else navigate(fallback);
  };
}
