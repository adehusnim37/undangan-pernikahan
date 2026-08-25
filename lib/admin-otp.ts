import crypto from "node:crypto";
import { db, query } from "@/lib/db";
import { getSessionSecret, useSecureCookies } from "@/lib/config";

const BASE_COOKIE_NAME = "undangan_admin_otp";
const OTP_TTL_SECONDS = 10 * 60;
const OTP_LENGTH = 8;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_SECONDS = 15 * 60;

type ChallengeRow = {
  id: string;
  email: string;
  code_hash: string;
  failed_attempts: number;
  send_count: number;
  expires_at: Date;
  last_sent_at: Date;
  consumed_at: Date | null;
};

function cookieName() {
  return useSecureCookies() ? `__Host-${BASE_COOKIE_NAME}` : BASE_COOKIE_NAME;
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function codeHash(challengeId: string, code: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${challengeId}:${code}`)
    .digest("hex");
}

function newCode() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

export async function createOtpChallenge(
  email: string,
  client: { ipAddress: string; userAgent: string | null },
) {
  const dbClient = await db.connect();
  try {
    await dbClient.query("BEGIN");
    await dbClient.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`admin-otp:${email}`],
    );
    const sends = await dbClient.query<{
      total: string;
      last_sent_at: Date | null;
    }>(
      `SELECT COALESCE(SUM(send_count), 0)::text AS total,
              MAX(last_sent_at) AS last_sent_at
       FROM admin_otp_challenges
       WHERE email = $1
         AND created_at > NOW() - make_interval(secs => $2)`,
      [email, SEND_WINDOW_SECONDS],
    );
    const lastSentAt = sends.rows[0]?.last_sent_at;
    if (lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - lastSentAt.getTime()) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        await dbClient.query("ROLLBACK");
        return {
          ok: false as const,
          retryAfterSeconds: RESEND_COOLDOWN_SECONDS - elapsedSeconds,
        };
      }
    }
    if (Number(sends.rows[0]?.total ?? 0) >= MAX_SENDS_PER_WINDOW) {
      await dbClient.query("ROLLBACK");
      return { ok: false as const, retryAfterSeconds: SEND_WINDOW_SECONDS };
    }

    await dbClient.query(
      `UPDATE admin_otp_challenges SET consumed_at = NOW()
       WHERE email = $1 AND consumed_at IS NULL`,
      [email],
    );
    const id = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("base64url");
    const code = newCode();
    await dbClient.query(
      `INSERT INTO admin_otp_challenges
        (id, token_hash, email, code_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + make_interval(secs => $7))`,
      [
        id,
        tokenHash(token),
        email,
        codeHash(id, code),
        client.ipAddress,
        client.userAgent,
        OTP_TTL_SECONDS,
      ],
    );
    await dbClient
      .query(
        `DELETE FROM admin_otp_challenges
         WHERE created_at < NOW() - INTERVAL '7 days'`,
      )
      .catch(() => undefined);
    await dbClient.query("COMMIT");
    return { ok: true as const, token, code, expiresInSeconds: OTP_TTL_SECONDS };
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    dbClient.release();
  }
}

export async function consumeOtpChallenge(token: string) {
  await query(
    `UPDATE admin_otp_challenges SET consumed_at = COALESCE(consumed_at, NOW())
     WHERE token_hash = $1`,
    [tokenHash(token)],
  );
}

export async function resendOtp(token: string) {
  const dbClient = await db.connect();
  try {
    await dbClient.query("BEGIN");
    const result = await dbClient.query<ChallengeRow>(
      `SELECT id, email, code_hash, failed_attempts, send_count,
              expires_at, last_sent_at, consumed_at
       FROM admin_otp_challenges WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash(token)],
    );
    const row = result.rows[0];
    if (!row || row.consumed_at || row.failed_attempts >= MAX_OTP_ATTEMPTS) {
      await dbClient.query("ROLLBACK");
      return { ok: false as const, reason: "invalid" as const };
    }
    const elapsedSeconds = Math.floor(
      (Date.now() - row.last_sent_at.getTime()) / 1000,
    );
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      await dbClient.query("ROLLBACK");
      return {
        ok: false as const,
        reason: "cooldown" as const,
        retryAfterSeconds: RESEND_COOLDOWN_SECONDS - elapsedSeconds,
      };
    }
    if (row.send_count >= MAX_SENDS_PER_WINDOW) {
      await dbClient.query("ROLLBACK");
      return { ok: false as const, reason: "limit" as const };
    }

    const code = newCode();
    await dbClient.query(
      `UPDATE admin_otp_challenges
       SET code_hash = $2,
           send_count = send_count + 1,
           expires_at = NOW() + make_interval(secs => $3),
           last_sent_at = NOW()
       WHERE id = $1`,
      [row.id, codeHash(row.id, code), OTP_TTL_SECONDS],
    );
    await dbClient.query("COMMIT");
    return {
      ok: true as const,
      email: row.email,
      code,
      expiresInSeconds: OTP_TTL_SECONDS,
    };
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    dbClient.release();
  }
}

export async function verifyOtp(token: string, code: string) {
  const dbClient = await db.connect();
  try {
    await dbClient.query("BEGIN");
    const result = await dbClient.query<ChallengeRow>(
      `SELECT id, email, code_hash, failed_attempts, send_count,
              expires_at, last_sent_at, consumed_at
       FROM admin_otp_challenges WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash(token)],
    );
    const row = result.rows[0];
    if (!row || row.consumed_at) {
      await dbClient.query("ROLLBACK");
      return { ok: false as const, reason: "invalid" as const };
    }
    if (row.expires_at.getTime() <= Date.now()) {
      await dbClient.query(
        "UPDATE admin_otp_challenges SET consumed_at = NOW() WHERE id = $1",
        [row.id],
      );
      await dbClient.query("COMMIT");
      return { ok: false as const, reason: "expired" as const };
    }

    const expected = Buffer.from(row.code_hash, "hex");
    const supplied = Buffer.from(codeHash(row.id, code), "hex");
    const valid = crypto.timingSafeEqual(expected, supplied);
    if (!valid) {
      const attempts = row.failed_attempts + 1;
      await dbClient.query(
        `UPDATE admin_otp_challenges
         SET failed_attempts = $2,
             consumed_at = CASE WHEN $2 >= $3 THEN NOW() ELSE consumed_at END
         WHERE id = $1`,
        [row.id, attempts, MAX_OTP_ATTEMPTS],
      );
      await dbClient.query("COMMIT");
      return {
        ok: false as const,
        reason:
          attempts >= MAX_OTP_ATTEMPTS
            ? ("locked" as const)
            : ("incorrect" as const),
        attemptsRemaining: Math.max(0, MAX_OTP_ATTEMPTS - attempts),
      };
    }

    await dbClient.query(
      "UPDATE admin_otp_challenges SET consumed_at = NOW() WHERE id = $1",
      [row.id],
    );
    await dbClient.query("COMMIT");
    return { ok: true as const, email: row.email };
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    dbClient.release();
  }
}

export const otpCookie = {
  name: cookieName(),
  options: {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: useSecureCookies(),
    path: "/",
    maxAge: OTP_TTL_SECONDS,
    priority: "high" as const,
  },
};

export const otpConstants = {
  length: OTP_LENGTH,
  ttlSeconds: OTP_TTL_SECONDS,
  maxAttempts: MAX_OTP_ATTEMPTS,
  resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
};

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
