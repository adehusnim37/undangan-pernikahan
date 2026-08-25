-- Mengikat sesi ke kredensial aktif. Baris lama dibiarkan NULL agar otomatis
-- ditolak aplikasi; sesi baru selalu menyimpan fingerprint saat login.
ALTER TABLE admin_sessions
  ADD COLUMN IF NOT EXISTS credential_fingerprint CHAR(64);
