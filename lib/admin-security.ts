import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { db, query } from "@/lib/db";
import { getSessionSecret, trustProxy } from "@/lib/config";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const RETENTION_DAYS = 90;

type RateLimitState = {
  failed: number;
  locked: boolean;
  lockoutUntil: string | null;
};

type RateLimitRow = {
  failure_count: number;
  window_started_at: Date;
  locked_until: Date | null;
};

export function clientInfoFrom(request: Request) {
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  if (!trustProxy()) return { ipAddress: "unknown", userAgent };

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const last = entries[entries.length - 1];
    if (last) return { ipAddress: last, userAgent };
  }
  return {
    ipAddress: request.headers.get("x-real-ip") ?? "unknown",
    userAgent,
  };
}

function rateKey(kind: "email" | "ip", value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${kind}:${value.toLowerCase()}`)
    .digest("hex");
}

function rateKeys(email: string, ipAddress: string) {
  const keys = [rateKey("email", email)];
  if (ipAddress !== "unknown") keys.push(rateKey("ip", ipAddress));
  return [...new Set(keys)];
}

export async function getAdminRateLimit(
  email: string,
  ipAddress: string,
): Promise<RateLimitState> {
  const result = await query<RateLimitRow>(
    `SELECT failure_count, window_started_at, locked_until
     FROM admin_auth_rate_limits
     WHERE key_hash = ANY($1::text[])`,
    [rateKeys(email, ipAddress)],
  );
  const activeLocks = result.rows
    .map((row) => row.locked_until)
    .filter((until): until is Date => Boolean(until && until.getTime() > Date.now()));
  const lockoutUntil = activeLocks.sort((a, b) => b.getTime() - a.getTime())[0];
  return {
    failed: Math.max(0, ...result.rows.map((row) => row.failure_count)),
    locked: Boolean(lockoutUntil),
    lockoutUntil: lockoutUntil?.toISOString() ?? null,
  };
}

async function recordFailureForKey(
  client: PoolClient,
  keyHash: string,
) {
  await client.query(
    `INSERT INTO admin_auth_rate_limits (key_hash)
     VALUES ($1) ON CONFLICT (key_hash) DO NOTHING`,
    [keyHash],
  );
  const result = await client.query<RateLimitRow>(
    `SELECT failure_count, window_started_at, locked_until
     FROM admin_auth_rate_limits WHERE key_hash = $1 FOR UPDATE`,
    [keyHash],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Rate-limit state tidak dapat dibuat.");

  const now = Date.now();
  if (row.locked_until && row.locked_until.getTime() > now) return;
  const withinWindow = row.window_started_at.getTime() > now - WINDOW_MS;
  const nextCount = withinWindow ? row.failure_count + 1 : 1;
  const lockedUntil =
    nextCount >= MAX_FAILED_ATTEMPTS
      ? new Date(now + LOCKOUT_MS)
      : null;

  await client.query(
    `UPDATE admin_auth_rate_limits
     SET failure_count = $2,
         window_started_at = CASE WHEN $3 THEN window_started_at ELSE NOW() END,
         locked_until = $4,
         updated_at = NOW()
     WHERE key_hash = $1`,
    [keyHash, nextCount, withinWindow, lockedUntil],
  );
}

/** Catat audit login dan perbarui throttle per akun serta per IP secara atomik. */
export async function recordAdminLogin(
  email: string,
  ipAddress: string,
  userAgent: string | null,
  success: boolean,
) {
  const client = await db.connect();
  const keys = rateKeys(email, ipAddress);
  try {
    await client.query("BEGIN");
    if (success) {
      await client.query(
        "DELETE FROM admin_auth_rate_limits WHERE key_hash = ANY($1::text[])",
        [keys],
      );
      await client.query(
        "DELETE FROM admin_login_attempts WHERE email = $1 AND success = FALSE",
        [email.toLowerCase()],
      );
    } else {
      for (const key of keys) await recordFailureForKey(client, key);
    }
    await client.query(
      "INSERT INTO admin_login_attempts (email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)",
      [email.toLowerCase(), ipAddress, userAgent, success],
    );
    await client
      .query(
        `DELETE FROM admin_login_attempts
         WHERE created_at < NOW() - make_interval(days => ${RETENTION_DAYS})`,
      )
      .catch(() => undefined);
    await client
      .query(
        `DELETE FROM admin_auth_rate_limits
         WHERE updated_at < NOW() - INTERVAL '90 days'`,
      )
      .catch(() => undefined);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export const adminRateLimitConstants = {
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
};
