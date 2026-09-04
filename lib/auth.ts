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

type AdminJwtPayload = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

type AdminSessionRow = { email: string; credential_fingerprint: string | null };

/**
 * Prefix `__Host-` (hanya saat cookie Secure) mengikat cookie ke host dan
 * mencegah cookie dengan nama sama di-set dari subdomain lain.
 */
function cookieName() {
  return useSecureCookies() ? `__Host-${BASE_COOKIE_NAME}` : BASE_COOKIE_NAME;
}

function tokenHash(tokenId: string) {
  return crypto.createHash("sha256").update(tokenId).digest("hex");
}

function encodeJwtPart(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function jwtSignature(unsignedToken: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(unsignedToken)
    .digest("base64url");
}

function createJwt(payload: AdminJwtPayload) {
  const header = encodeJwtPart({ alg: "HS256", typ: "JWT" });
  const body = encodeJwtPart(payload);
  const unsignedToken = `${header}.${body}`;
  return `${unsignedToken}.${jwtSignature(unsignedToken)}`;
}

function verifyJwt(token: string): AdminJwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expectedSignature = jwtSignature(`${encodedHeader}.${encodedPayload}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const header: unknown = JSON.parse(
      Buffer.from(encodedHeader, "base64url").toString("utf8"),
    );
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      !header ||
      typeof header !== "object" ||
      (header as { alg?: unknown }).alg !== "HS256" ||
      !payload ||
      typeof payload !== "object"
    ) {
      return null;
    }

    const claims = payload as Partial<AdminJwtPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== "string" ||
      typeof claims.jti !== "string" ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number" ||
      claims.jti.length < 32 ||
      claims.iat > now + 60 ||
      claims.exp <= now ||
      claims.exp - claims.iat !== SESSION_TTL_SECONDS
    ) {
      return null;
    }
    return claims as AdminJwtPayload;
  } catch {
    return null;
  }
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
  const tokenId = crypto.randomBytes(32).toString("base64url");
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = createJwt({
    sub: email,
    jti: tokenId,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
  });
  await query(
    `INSERT INTO admin_sessions
      (token_hash, email, credential_fingerprint, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + make_interval(secs => $6))`,
    [
      tokenHash(tokenId),
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
  const payload = verifyJwt(token);
  if (!payload) return;
  await query(
    "UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_hash = $1",
    [tokenHash(payload.jti)],
  );
}

export async function isAdmin() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return false;
  const payload = verifyJwt(token);
  if (!payload) return false;
  const result = await query<AdminSessionRow>(
    `UPDATE admin_sessions
     SET last_seen_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
       AND last_seen_at > NOW() - make_interval(secs => $2)
       AND email = $3
     RETURNING email, credential_fingerprint`,
    [tokenHash(payload.jti), SESSION_IDLE_SECONDS, payload.sub],
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
    maxAge: SESSION_TTL_SECONDS,
  },
};
