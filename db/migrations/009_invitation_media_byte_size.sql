-- Allow invitation media uploads up to the 30 MB limit enforced by the
-- API (app/api/admin/media/route.ts) and the upload dialog
-- (components/media-manager-dialog.tsx). Previously this column was capped
-- at 8 MB while the application allowed up to 30 MB, so files between 8 and
-- 30 MB passed validation but failed at insert time.
ALTER TABLE invitation_media
  DROP CONSTRAINT IF EXISTS invitation_media_byte_size_check;

ALTER TABLE invitation_media
  ADD CONSTRAINT invitation_media_byte_size_check
  CHECK (byte_size BETWEEN 1 AND 31457280);