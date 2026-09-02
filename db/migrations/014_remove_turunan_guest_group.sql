-- "turunan" is no longer a selectable guest group; remap existing rows to
-- "kerabat" (closest equivalent) and tighten the check constraint.
UPDATE invitations SET guest_group = 'kerabat' WHERE guest_group = 'turunan';

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guest_group_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_guest_group_check CHECK (
    guest_group IS NULL OR guest_group IN (
      'kerabat', 'keluarga', 'teman_kerja', 'kantor', 'teman', 'lainnya'
    )
  );
