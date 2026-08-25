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

const MIN_SESSION_SECRET_LENGTH = 32;

const DEV_SESSION_SECRET = "local-development-secret-change-me";
const DEV_ADMIN_EMAIL = "admin@undangan.local";
const DEV_ADMIN_PASSWORD = "ganti-password-ini";
const MIN_ADMIN_PASSWORD_LENGTH = 15;

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
 * HMAC secret for OTP hashes and rate-limit identifiers.
 * Throws in production when missing, too short, or still a placeholder.
 */
export function getSessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (isProduction() && looksInsecure(value, MIN_SESSION_SECRET_LENGTH)) {
    throw new Error(
      `SESSION_SECRET wajib diisi dengan nilai acak (minimal ${MIN_SESSION_SECRET_LENGTH} karakter) di production.`,
    );
  }
  return value || DEV_SESSION_SECRET;
}

/**
 * Admin login credentials.
 * Throws in production when either list is missing, mismatched, or insecure.
 */
export type AdminCredential = { email: string; password: string };

/**
 * Kredensial admin dipasangkan berdasarkan posisi pada dua daftar env.
 * Password sengaja tidak di-trim agar spasi yang memang menjadi bagian
 * password tidak berubah diam-diam.
 */
export function getAdminCredentials(): AdminCredential[] {
  const configuredUsers = process.env.USER_ADMIN;
  const configuredPasswords = process.env.PASSWORD_ADMIN;

  if (!configuredUsers && !configuredPasswords && !isProduction()) {
    return [{ email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD }];
  }

  if (!configuredUsers || !configuredPasswords) {
    throw new Error(
      "USER_ADMIN dan PASSWORD_ADMIN wajib diisi bersama sebagai daftar yang berpasangan.",
    );
  }

  const users = configuredUsers.split(",").map((email) => email.trim().toLowerCase());
  const passwords = configuredPasswords.split(",");
  if (users.length !== passwords.length || users.length === 0) {
    throw new Error(
      "Jumlah USER_ADMIN dan PASSWORD_ADMIN harus sama dan urutannya harus berpasangan.",
    );
  }

  const seen = new Set<string>();
  return users.map((email, index) => {
    const password = passwords[index] ?? "";
    if (!/^\S+@\S+\.\S+$/.test(email) || seen.has(email)) {
      throw new Error("USER_ADMIN harus berisi alamat email unik yang valid.");
    }
    if (
      isProduction() &&
      (looksInsecure(password, MIN_ADMIN_PASSWORD_LENGTH) || password.includes(","))
    ) {
      throw new Error(
        `PASSWORD_ADMIN ke-${index + 1} wajib minimal ${MIN_ADMIN_PASSWORD_LENGTH} karakter dan bukan placeholder.`,
      );
    }
    seen.add(email);
    return { email, password };
  });
}

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
};

/** SMTP wajib tersedia karena sesi admin tidak dibuat sebelum OTP terkirim. */
export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL?.trim();
  const fromName = process.env.FROM_NAME?.trim();

  if (
    !host ||
    /\s/.test(host) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !pass?.trim() ||
    !fromEmail ||
    !/^\S+@\S+\.\S+$/.test(fromEmail) ||
    !fromName ||
    fromName.length > 120 ||
    /[\r\n]/.test(fromName)
  ) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, dan FROM_NAME wajib valid untuk OTP admin.",
    );
  }

  return { host, port, user, pass, fromEmail, fromName };
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

/**
 * Apakah header proxy (X-Forwarded-For / X-Real-IP) dipercaya.
 * WAJIB hanya true ketika aplikasi hanya bisa diakses lewat proxy tepercaya
 * (mis. nginx). Jika false, IP klien dilaporkan "unknown" sehingga
 * rate-limit berbasis IP tidak aktif (rate-limit per-email tetap berjalan).
 */
export function trustProxy(): boolean {
  return process.env.TRUST_PROXY === "true";
}
