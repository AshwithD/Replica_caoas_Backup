/**
 * pages/payroll/_kit/authStore.js
 *
 * BatchReview.jsx expects a zustand `useAuthStore()` hook (`{ user }`).
 * This project doesn't use zustand — auth state already lives in
 * src/contexts/AuthContext.js. This just re-exposes that under the name
 * the payroll page expects, without adding a new dependency.
 */

import { useAuth } from "../../../../contexts/AuthContext";

export function useAuthStore() {
  const { user } = useAuth();
  return { user };
}
