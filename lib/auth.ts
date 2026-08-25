import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import {
  getAdminCredentials,
  getSessionSecret,
  useSecureCookies,
} from "@/lib/config";

const BASE_COOKIE_NAME = "undangan_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SESSION_IDLE_SECONDS = 60 * 60;

type AdminSessionRow = { email: string; credential_fingerprint: string | null };

/**
 * Prefix `__Host-` (hanya saat cookie Secure) mengikat cookie ke host dan
 * mencegah cookie dengan nama sama di-set dari subdomain lain.
 */
function cookieName() {
  return useSecureCookies() ? `__Host-${BASE_COOKIE_NAME}` : BASE_COOKIE_NAME;
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function credentialFingerprint(email: string) {
  const credential = getAdminCredentials().find((item) => item.email === email);
  if (!credential) return null;
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${credential.email}\0${credential.password}`)
    .digest("hex");
}

export async function createAdminSession(
  email: string,
  client: { ipAddress: string; userAgent: string | null },
) {
  const fingerprint = credentialFingerprint(email);
  if (!fingerprint) throw new Error("Admin tidak lagi terdaftar.");
  const token = crypto.randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO admin_sessions
      (token_hash, email, credential_fingerprint, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + make_interval(secs => $6))`,
    [
      tokenHash(token),
      email,
      fingerprint,
      client.ipAddress,
      client.userAgent,
      SESSION_TTL_SECONDS,
    ],
  );
  await query(
    `DELETE FROM admin_sessions
     WHERE expires_at < NOW() - INTERVAL '7 days'
        OR revoked_at < NOW() - INTERVAL '7 days'`,
  ).catch(() => undefined);
  return token;
}

export async function revokeAdminSession(token?: string) {
  if (!token) return;
  await query(
    "UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_hash = $1",
    [tokenHash(token)],
  );
}

export async function isAdmin() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return false;
  const result = await query<AdminSessionRow>(
    `UPDATE admin_sessions
     SET last_seen_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
       AND last_seen_at > NOW() - make_interval(secs => $2)
     RETURNING email, credential_fingerprint`,
    [tokenHash(token), SESSION_IDLE_SECONDS],
  );
  const session = result.rows[0];
  if (!session) return false;
  const activeFingerprint = credentialFingerprint(session.email);
  const storedFingerprint = session.credential_fingerprint;
  const stillAuthorized = Boolean(
    activeFingerprint &&
      storedFingerprint &&
      activeFingerprint.length === storedFingerprint.length &&
      crypto.timingSafeEqual(
        Buffer.from(activeFingerprint),
        Buffer.from(storedFingerprint),
      ),
  );
  if (!stillAuthorized) {
    await revokeAdminSession(token);
    return false;
  }
  return true;
}

export const adminCookie = {
  name: cookieName(),
  options: {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: useSecureCookies(),
    path: "/",
    priority: "high" as const,
  },
};
