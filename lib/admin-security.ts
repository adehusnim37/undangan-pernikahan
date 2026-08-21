import { query } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const LOCKOUT_MS = 15 * 60 * 1000; // 15 menit

type RateLimitState = {
  failed: number;
  locked: boolean;
  lockoutUntil: string | null;
};

export function clientInfoFrom(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  return { ipAddress, userAgent };
}

/**
 * Cek apakah login harus diblokir karena terlalu banyak percobaan gagal.
 * Disimpan di DB sehingga lintas instance/restart tetap konsisten.
 */
export async function getAdminRateLimit(email: string, ipAddress: string): Promise<RateLimitState> {
  const result = await query<{ failed: string; locked: string | null }>(
    `SELECT
       (SELECT COUNT(*) FROM admin_login_attempts
         WHERE success = FALSE
           AND (email = $1 OR ip_address = $2)
           AND created_at > NOW() - make_interval(secs => $3))::text AS failed,
       (SELECT MAX(created_at)::text FROM admin_login_attempts
         WHERE success = TRUE AND email = $1
           AND created_at > NOW() - make_interval(secs => $3))::text AS locked`,
    [email.toLowerCase(), ipAddress, WINDOW_MS / 1000],
  );
  const row = result.rows[0];
  const failed = Number(row?.failed ?? 0);
  const lastSuccess = row?.locked ? new Date(row.locked) : null;
  const locked =
    failed >= MAX_FAILED_ATTEMPTS ||
    (lastSuccess !== null && Date.now() - lastSuccess.getTime() < LOCKOUT_MS);
  return {
    failed,
    locked,
    lockoutUntil: locked ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null,
  };
}

/** Catat percobaan login (sukses/gagal) untuk audit & rate-limit. */
export async function recordAdminLogin(
  email: string,
  ipAddress: string,
  userAgent: string | null,
  success: boolean,
) {
  await query(
    "INSERT INTO admin_login_attempts (email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)",
    [email.toLowerCase(), ipAddress, userAgent, success],
  );
}

export const adminRateLimitConstants = {
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
};
