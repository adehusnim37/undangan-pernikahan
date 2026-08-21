import { db } from "@/lib/db";

const RETENTION_DAYS = 30;

/**
 * Rate limiter generik (fixed-window) berbasis DB, lintas instance.
 * Atomic check-and-insert dalam satu transaksi; toleransi race kecil
 * (beberapa request bersamaan bisa lolos sedikit di atas batas) dapat
 * diterima untuk rate limiting.
 *
 * @returns true jika request diizinkan, false jika melebihi batas.
 */
export async function consumeRateLimit(
  scope: string,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM request_events
       WHERE scope = $1 AND event_key = $2
         AND created_at > NOW() - make_interval(secs => $3)`,
      [scope, key, windowSeconds],
    );
    const count = Number(result.rows[0]?.count ?? 0);
    if (count >= maxRequests) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      "INSERT INTO request_events (scope, event_key) VALUES ($1, $2)",
      [scope, key],
    );
    // Retention opsional: bersihkan data lama sesekali.
    await client
      .query(
        `DELETE FROM request_events WHERE created_at < NOW() - make_interval(days => ${RETENTION_DAYS})`,
      )
      .catch(() => undefined);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
