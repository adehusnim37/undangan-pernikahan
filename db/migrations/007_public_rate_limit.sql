-- 007_public_rate_limit.sql
-- Rate limiting generik untuk endpoint publik + index retention audit logs.

-- ---------------------------------------------------------------------------
-- 1. Tabel event rate-limit generik (scope + key, mis. per-IP atau per-token)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_events (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  event_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup rate-limit: scope + key + jendela waktu.
CREATE INDEX IF NOT EXISTS request_events_lookup_idx
  ON request_events (scope, event_key, created_at DESC);
-- Retention: hapus baris lama secara periodik.
CREATE INDEX IF NOT EXISTS request_events_created_idx
  ON request_events (created_at);

-- ---------------------------------------------------------------------------
-- 2. Index retention untuk tabel audit/rate-limit yang sudah ada
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS admin_login_attempts_created_idx
  ON admin_login_attempts (created_at);
