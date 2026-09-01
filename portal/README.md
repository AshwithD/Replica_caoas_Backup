# Payroll Client Portal

The separate UI your clients use to log in, review their payroll data, and
record each month's input (joiners, revisions, exits, advances, one-off
items, notes) before submitting it for your approval.

It talks to the payroll portal API (`/api/portal/...`) built in the Django
backend. Credentials are managed from the internal "Portal Users" screen.

---

## Develop locally

```bash
cd portal
npm install
npm run dev
```

The dev server runs on http://localhost:5174/portal/ and proxies `/api/*`
to `http://localhost:8000` (override with `VITE_DEV_API`). Make sure the
Django backend is running.

## Build for production

```bash
cd portal
npm install
npm run build      # outputs to portal/dist/
```

`.env.production` sets `VITE_API_BASE=https://api.ckpsca.in/api` (your API
host) — edit it if your API lives elsewhere.

## Serve it

Serve the `dist/` folder at `/portal/` on your domain (the build's `base`
is already `/portal/`). Example nginx:

```nginx
location /portal/ {
    alias /var/www/ckpsca/portal/dist/;
    try_files $uri $uri/ /portal/index.html;
}
```

Because the portal is served from the same origin as your main app
(`ckpsca.in`), and `ckpsca.in` is already in `CORS_ALLOWED_ORIGINS`, no
CORS changes are needed. (The portal calls the API at `api.ckpsca.in`
cross-origin, exactly like your main frontend already does.)

If you instead host the portal at the root of its own subdomain, change
`base` to `"/"` in `vite.config.js` and add that origin to
`CORS_ALLOWED_ORIGINS` in `hrms_backend/settings.py`.

## Screens

| Route | Purpose |
|---|---|
| `#/` (login) | Email + password sign-in |
| `#/` (dashboard) | Employee / structure / advance counts + latest submission |
| `#/input` | Monthly Payroll Input — add items and submit |
| `#/employees` | Read-only employee master |
| `#/structures` | Read-only salary structures |
| `#/advances` | Read-only advances & loans |
| `#/password` | Change password |
