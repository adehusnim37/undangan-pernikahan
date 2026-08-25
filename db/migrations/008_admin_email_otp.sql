-- Password + email OTP serta sesi admin yang dapat dicabut di server.

CREATE TABLE IF NOT EXISTS admin_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash CHAR(64) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  code_hash CHAR(64) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  failed_attempts SMALLINT NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
  send_count SMALLINT NOT NULL DEFAULT 1 CHECK (send_count BETWEEN 1 AND 3),
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_otp_challenges_email_time_idx
  ON admin_otp_challenges (email, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_otp_challenges_created_idx
  ON admin_otp_challenges (created_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash CHAR(64) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_sessions_email_time_idx
  ON admin_sessions (email, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx
  ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS admin_auth_rate_limits (
  key_hash CHAR(64) PRIMARY KEY,
  failure_count SMALLINT NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_auth_rate_limits_updated_idx
  ON admin_auth_rate_limits (updated_at);
