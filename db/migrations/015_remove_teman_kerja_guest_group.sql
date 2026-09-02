-- "teman_kerja" is no longer a selectable guest group; remap existing rows to
-- "teman" (closest equivalent) and tighten the check constraint.
UPDATE invitations SET guest_group = 'teman' WHERE guest_group = 'teman_kerja';

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guest_group_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_guest_group_check CHECK (
    guest_group IS NULL OR guest_group IN (
      'kerabat', 'keluarga', 'kantor', 'teman', 'lainnya'
    )
  );
