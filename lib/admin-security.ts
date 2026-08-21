import { db, query } from "@/lib/db";
import { trustProxy } from "@/lib/config";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const LOCKOUT_MS = 15 * 60 * 1000; // 15 menit
const RETENTION_DAYS = 90;

type RateLimitState = {
  failed: number;
  locked: boolean;
  lockoutUntil: string | null;
};

/**
 * Ekstrak IP klien dengan aman.
 * Hanya percaya header proxy bila TRUST_PROXY=true; jika tidak, semua
 * header bisa dipalsukan klien sehingga dilaporkan "unknown".
 * Saat mempercayai proxy, ambil entri TERAKHIR dari X-Forwarded-For karena
 * itulah yang ditambahkan oleh nginx (bukan yang bisa dipalsukan klien).
 */
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
  const realIp = request.headers.get("x-real-ip");
  return { ipAddress: realIp ?? "unknown", userAgent };
}

/**
 * Cek apakah login harus diblokir karena terlalu banyak percobaan gagal.
 * Disimpan di DB sehingga lintas instance/restart tetap konsisten.
 */
export async function getAdminRateLimit(email: string, ipAddress: string): Promise<RateLimitState> {
  const result = await query<{ failed: string }>(
    `SELECT COUNT(*)::text AS failed FROM admin_login_attempts
     WHERE success = FALSE
       AND (email = $1 OR ip_address = $2)
       AND created_at > NOW() - make_interval(secs => $3)`,
    [email.toLowerCase(), ipAddress, WINDOW_MS / 1000],
  );
  const failed = Number(result.rows[0]?.failed ?? 0);
  const locked = failed >= MAX_FAILED_ATTEMPTS;
  return {
    failed,
    locked,
    lockoutUntil: locked ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null,
  };
}

/**
 * Catat percobaan login (sukses/gagal) untuk audit & rate-limit.
 * Saat login sukses: reset penghitung kegagalan email tsb agar admin
 * tidak terkunci oleh percobaan orang lain. Sekaligus bersihkan baris lama.
 */
export async function recordAdminLogin(
  email: string,
  ipAddress: string,
  userAgent: string | null,
  success: boolean,
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (success) {
      await client.query(
        "DELETE FROM admin_login_attempts WHERE email = $1 AND success = FALSE",
        [email.toLowerCase()],
      );
    }
    await client.query(
      "INSERT INTO admin_login_attempts (email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)",
      [email.toLowerCase(), ipAddress, userAgent, success],
    );
    await client
      .query(
        `DELETE FROM admin_login_attempts WHERE created_at < NOW() - make_interval(days => ${RETENTION_DAYS})`,
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
