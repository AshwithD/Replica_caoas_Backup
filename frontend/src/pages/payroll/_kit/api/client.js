/**
 * pages/payroll/_kit/client.js
 *
 * The payroll pages (ported from a newer CAOAS build) expect `api` and
 * `apiPath` from an `api/client` module that doesn't exist in this
 * project. This file reuses the project's REAL axios instance
 * (src/services/api.js) unmodified, and just adds the `apiPath` helper
 * the payroll pages use to build payroll-scoped URLs.
 */

import { api } from "../../../../services/api";

// All payroll endpoints live under /api/payroll/... — see hrms_backend/payroll/urls.py
export function apiPath(path) {
  const clean = String(path).replace(/^\/+/, "");
  return `payroll/${clean}`;
}

export { api };
