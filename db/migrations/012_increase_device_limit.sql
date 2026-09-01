ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_max_devices_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_max_devices_check CHECK (max_devices BETWEEN 1 AND 100);
