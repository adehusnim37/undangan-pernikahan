-- 006_admin_security_and_rsvp_history.sql
-- Hardening auth admin: tabel rate-limit percobaan login + audit log login.
-- Robust RSVP: riwayat perubahan + batas edit atomik.

-- ---------------------------------------------------------------------------
-- 1. Admin login attempts (rate-limit + audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk pencarian rate-limit dan audit per email/IP terbaru.
CREATE INDEX IF NOT EXISTS admin_login_attempts_email_time_idx
  ON admin_login_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_time_idx
  ON admin_login_attempts (ip_address, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RSVP history (audit trail setiap perubahan konfirmasi)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rsvp_history (
  id BIGSERIAL PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  attendance TEXT NOT NULL CHECK (attendance IN ('attending', 'declined')),
  guest_count SMALLINT NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 10),
  message TEXT,
  changed_by TEXT NOT NULL DEFAULT 'guest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk riwayat per undangan.
CREATE INDEX IF NOT EXISTS rsvp_history_invitation_time_idx
  ON rsvp_history (invitation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Trigger: updated_at otomatis untuk invitation_media
--    (invitations & rsvps tetap di-update manual di aplikasi,
--     tapi trigger ini menjaga konsistensi bila ada UPDATE langsung.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invitations_set_updated_at ON invitations;
CREATE TRIGGER invitations_set_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS rsvps_set_updated_at ON rsvps;
CREATE TRIGGER rsvps_set_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
