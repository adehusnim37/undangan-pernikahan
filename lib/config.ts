/**
 * Centralized environment configuration for authentication.
 *
 * Previously, secrets were read ad-hoc with hardcoded fallbacks
 * (e.g. `process.env.ADMIN_PASSWORD ?? "ganti-password-ini"`). That means a
 * production deploy with missing or placeholder env vars silently accepted
 * known public credentials.
 *
 * Rule: in production we **fail fast** (throw) instead of falling back.
 * In development the same dev defaults are used so `npm run dev` works
 * without touching `.env`.
 */

const MIN_SESSION_SECRET_LENGTH = 16;

const DEV_SESSION_SECRET = "local-development-secret-change-me";
const DEV_ADMIN_EMAIL = "admin@undangan.local";
const DEV_ADMIN_PASSWORD = "ganti-password-ini";

/** Values that appear in .env.example / docs and must never be trusted. */
const INSECURE_PLACEHOLDERS = new Set([
  "ganti-password-ini",
  "ganti-dengan-random-string-panjang",
  "change-me",
  "changeme",
  "secret",
  "password",
  "local-development-secret-change-me",
]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

function looksInsecure(value: string | undefined, minLength = 0): boolean {
  if (!value || value.length < minLength) return true;
  return INSECURE_PLACEHOLDERS.has(value.trim().toLowerCase());
}

/**
 * HMAC secret for signing admin session cookies.
 * Throws in production when missing, too short, or still a placeholder.
 */
export function getSessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (isProduction() && looksInsecure(value, MIN_SESSION_SECRET_LENGTH)) {
    throw new Error(
      "SESSION_SECRET wajib diisi dengan nilai acak (minimal 16 karakter) di production.",
    );
  }
  return value || DEV_SESSION_SECRET;
}

/**
 * Admin login credentials.
 * Throws in production when either value is missing or still a placeholder.
 */
export function getAdminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (isProduction() && (!email || looksInsecure(password))) {
    throw new Error(
      "ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi dengan nilai yang aman (bukan placeholder) di production.",
    );
  }
  return {
    email: email || DEV_ADMIN_EMAIL,
    password: password || DEV_ADMIN_PASSWORD,
  };
}

/** Whether the session cookie requires HTTPS. */
export function useSecureCookies(): boolean {
  if (process.env.APP_ENV === "development") return false;
  if (process.env.APP_ENV === "production") return true;
  return isProduction();
}

/** Origin yang diizinkan untuk request mutasi admin (CSRF protection). */
export function getAllowedOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return "http://localhost:3000";
  return configured.replace(/\/+$/, "");
}

