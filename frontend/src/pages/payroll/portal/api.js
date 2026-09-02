/**
 * Client portal API client.
 *
 * Talks to the payroll portal endpoints (/api/portal/...) using portal
 * credentials (payroll.portal.models.PortalUser). Deliberately separate
 * from services/api.js: the portal mints its own token and must never send
 * the staff session token.
 *
 * The token lives in sessionStorage (not localStorage) so the client is
 * signed out automatically when the tab/browser closes — the portal must
 * not stay logged in across sessions.
 */

const isLocalhost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE = isLocalhost
  ? "http://localhost:8000/api"
  : "https://api.ckpsca.in/api";

const TOKEN_KEY = "portal_token";
const USER_KEY = "portal_user";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
};
export const setSession = (token, user) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  // Remove any legacy localStorage copies from the old "stay signed in"
  // behaviour so they can't resurrect a session.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
export const clearSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

function errorMessage(data, status) {
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const v = data[firstKey];
      if (Array.isArray(v) && v.length) return `${firstKey}: ${v[0]}`;
      if (typeof v === "string") return `${firstKey}: ${v}`;
    }
  }
  return `Request failed (${status}).`;
}

export async function apiRequest(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearSession();
    // ClientPortal listens for this and drops back to the login screen.
    window.dispatchEvent(new CustomEvent("portal:unauthorized"));
    const data = await res.json().catch(() => null);
    throw new Error(errorMessage(data, res.status));
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(data, res.status));
  return data;
}

export const api = {
  get: (path) => apiRequest("GET", path),
  post: (path, body) => apiRequest("POST", path, body),
  patch: (path, body) => apiRequest("PATCH", path, body),
  del: (path) => apiRequest("DELETE", path),
};
