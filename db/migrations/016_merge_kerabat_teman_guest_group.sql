-- Merge "kerabat" and "teman" guest groups into a single "kerabat_teman" option.
-- Drop the previous check first: it does not allow the new merged value yet.
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_guest_group_check;

UPDATE invitations SET guest_group = 'kerabat_teman' WHERE guest_group IN ('kerabat', 'teman');

ALTER TABLE invitations
  ADD CONSTRAINT invitations_guest_group_check CHECK (
    guest_group IS NULL OR guest_group IN (
      'kerabat_teman', 'keluarga', 'kantor', 'lainnya'
    )
  );
