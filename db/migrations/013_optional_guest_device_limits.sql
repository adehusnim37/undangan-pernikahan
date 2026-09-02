-- Allow max_guests / max_devices to be NULL, meaning "unlimited".
ALTER TABLE invitations
  ALTER COLUMN max_guests DROP NOT NULL,
  ALTER COLUMN max_devices DROP NOT NULL,
  ALTER COLUMN max_guests DROP DEFAULT,
  ALTER COLUMN max_devices DROP DEFAULT;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_max_guests_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_max_guests_check CHECK (
    max_guests IS NULL OR max_guests BETWEEN 1 AND 10
  );

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_max_devices_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_max_devices_check CHECK (
    max_devices IS NULL OR max_devices BETWEEN 1 AND 100
  );
