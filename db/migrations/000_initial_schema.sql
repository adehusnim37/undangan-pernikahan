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

CREATE TABLE IF NOT EXISTS invitation_media (
  slot TEXT PRIMARY KEY CHECK (slot IN (
    'hero_1', 'hero_2', 'hero_3', 'hero_4', 'hero_5', 'hero_6', 'hero_7',
    'couple_bride_portrait', 'couple_groom_portrait',
    'journey_school_portrait', 'journey_school_mark', 'journey_school_detail',
    'journey_campus_wide', 'journey_campus_small_a', 'journey_campus_small_b',
    'journey_distance_city', 'journey_distance_graduate',
    'journey_engagement_main', 'journey_engagement_ring', 'journey_wedding',
    'prewedding_1', 'prewedding_2', 'prewedding_3',
    'prewedding_4', 'prewedding_5', 'prewedding_6',
    'prewedding_7', 'prewedding_8', 'prewedding_9',
    'prewedding_10', 'prewedding_11', 'prewedding_12'
  )),
  object_key TEXT UNIQUE NOT NULL,
  public_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 8388608),
  object_fit TEXT NOT NULL DEFAULT 'cover' CHECK (object_fit IN ('cover', 'contain')),
  scale DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (scale BETWEEN 0.5 AND 2.5),
  position_x DOUBLE PRECISION NOT NULL DEFAULT 50 CHECK (position_x BETWEEN 0 AND 100),
  position_y DOUBLE PRECISION NOT NULL DEFAULT 50 CHECK (position_y BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS access_logs_invitation_idx ON access_logs(invitation_id, created_at DESC);
