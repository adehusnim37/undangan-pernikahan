ALTER TABLE invitation_media
  ADD COLUMN IF NOT EXISTS object_fit TEXT NOT NULL DEFAULT 'cover'
    CHECK (object_fit IN ('cover', 'contain')),
  ADD COLUMN IF NOT EXISTS scale DOUBLE PRECISION NOT NULL DEFAULT 1
    CHECK (scale BETWEEN 0.5 AND 2.5);
