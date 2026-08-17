CREATE TABLE IF NOT EXISTS invitation_media (
  slot TEXT PRIMARY KEY CHECK (slot IN (
    'hero_1', 'hero_2', 'hero_3', 'hero_4', 'hero_5', 'hero_6', 'hero_7',
    'couple_bride_portrait', 'couple_groom_portrait',
    'journey_school_portrait', 'journey_school_mark', 'journey_school_detail',
    'journey_campus_wide', 'journey_campus_small_a', 'journey_campus_small_b',
    'journey_distance_city', 'journey_distance_graduate',
    'journey_engagement_main', 'journey_engagement_ring', 'journey_wedding'
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
