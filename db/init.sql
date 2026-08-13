CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_group TEXT CHECK (guest_group IN ('keluarga', 'kantor', 'kerabat')),
  max_guests SMALLINT NOT NULL DEFAULT 1 CHECK (max_guests BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  device_id TEXT,
  first_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  device_id TEXT,
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID UNIQUE NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  attendance TEXT NOT NULL CHECK (attendance IN ('attending', 'declined')),
  guest_count SMALLINT NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 10),
  current_editable_rsvps SMALLINT NOT NULL DEFAULT 1 CHECK (current_editable_rsvps BETWEEN 1 AND 10),
  max_editable_rsvps SMALLINT NOT NULL DEFAULT 1 CHECK (max_editable_rsvps BETWEEN 1 AND 10),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS access_logs_invitation_idx ON access_logs(invitation_id, created_at DESC);
