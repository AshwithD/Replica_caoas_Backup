// Base URL for portal API calls.
//  - development: "/api" (Vite dev server proxies it to Django)
//  - production:  overridden by VITE_API_BASE in .env.production
export const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
