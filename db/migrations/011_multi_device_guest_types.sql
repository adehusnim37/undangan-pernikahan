-- Allow one invitation link to be registered from several different devices.
-- The legacy device_id column is kept for backward compatibility and is copied
-- into the normalized table below.
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS guest_type TEXT,
  ADD COLUMN IF NOT EXISTS max_devices SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guest_group_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_guest_group_check CHECK (
    guest_group IS NULL OR guest_group IN (
      'turunan', 'kerabat', 'keluarga', 'teman_kerja', 'kantor', 'teman', 'lainnya'
    )
  );

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guest_type_check,
  DROP CONSTRAINT IF EXISTS invitations_max_devices_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_guest_type_check CHECK (
    guest_type IS NULL OR guest_type IN ('mama', 'papa', 'ibu', 'ayah', 'ade', 'alvita')
  );

ALTER TABLE invitations
  ADD CONSTRAINT invitations_max_devices_check CHECK (max_devices BETWEEN 1 AND 50);

CREATE TABLE IF NOT EXISTS invitation_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  first_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, device_id)
);

CREATE INDEX IF NOT EXISTS invitation_devices_invitation_idx
  ON invitation_devices(invitation_id);

INSERT INTO invitation_devices (invitation_id, device_id)
SELECT id, device_id
FROM invitations
WHERE device_id IS NOT NULL
ON CONFLICT (invitation_id, device_id) DO NOTHING;
