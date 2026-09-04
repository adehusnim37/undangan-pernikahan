# Undangan pernikahan personal

Template full-stack untuk undangan web dengan link personal per tamu, dashboard admin, RSVP, dan PostgreSQL. Desain awal memakai nuansa taman malam: hijau gelap, jade, dan aksen tanah liat.

## Fitur awal

- Halaman undangan responsif di `/invite/[token]`.
- Dashboard admin di `/admin` untuk membuat tamu, menyalin link, mencabut akses, dan me-reset perangkat.
- Setiap link dapat diberi batas perangkat berbeda (1–100); perangkat yang sama dapat membuka ulang link tanpa memakai slot tambahan.
- Data tamu mendukung tipe `Mama`, `Papa`, `Ibu`, `Ayah`, `Ade`, dan `Alvita`, serta kelompok seperti kerabat/teman, keluarga, dan kantor.
- API route Next.js untuk login admin, tamu, pemeriksaan akses, dan RSVP.
- PostgreSQL eksternal untuk data undangan, akses, RSVP, dan pengaturan media.
- Migrasi database otomatis saat backend mulai, lengkap dengan lock dan riwayat migrasi.
- Pengikatan perangkat pada kunjungan pertama memakai ThumbmarkJS di browser. Admin dapat me-reset seluruh perangkat yang terdaftar kapan pun.

## Menjalankan lokal

1. Buat konfigurasi lokal:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Isi daftar admin, secret sesi, dan SMTP untuk OTP di `.env`:

   ```dotenv
   USER_ADMIN=admin-satu@example.com,admin-dua@example.com
   PASSWORD_ADMIN=password-acak-admin-satu,password-acak-admin-dua
   SESSION_SECRET=random-string-minimal-32-byte
   SMTP_HOST=smtp.zeptomail.com
   SMTP_PORT=587
   SMTP_USER=emailapikey
   SMTP_PASS=zeptomail-api-key
   FROM_EMAIL=no-reply@example.com
   FROM_NAME=Undangan Pernikahan
   ```

   Posisi email dan password harus berpasangan. Password production minimal 15
   karakter dan tidak boleh mengandung koma karena koma dipakai sebagai pemisah.

   Gunakan `APP_ENV=development` saat aplikasi diakses melalui HTTP. Untuk deployment production, ubah menjadi `APP_ENV=production` dan akses aplikasi hanya melalui HTTPS karena cookie admin akan memakai atribut `Secure`. `NODE_ENV` tetap dikelola oleh Next.js dan tidak dipakai untuk memilih protokol deployment. Isi `NEXT_PUBLIC_APP_URL` dengan URL yang akan dibagikan ke tamu, misalnya `http://localhost:3020` atau `https://nikah.alvitade.com`.

3. Pastikan PostgreSQL yang sudah tersedia dapat diakses melalui `DATABASE_URL`.

4. Pasang dependensi dan jalankan aplikasi secara lokal (menggunakan [Bun](https://bun.sh)):

   ```powershell
   bun install
   bun run dev
   ```

5. Buka `http://localhost:<PORT>/admin`, masuk memakai salah satu pasangan
   `USER_ADMIN` dan `PASSWORD_ADMIN`, lalu masukkan OTP yang dikirim ke email
   admin tersebut.

## Keamanan login admin

- OTP terdiri dari 8 angka acak, berlaku 10 menit, hanya dapat dipakai sekali,
  dan terkunci setelah 5 kesalahan.
- Pengiriman ulang memiliki jeda 60 detik dan maksimal 3 kiriman dalam 15 menit.
- Kode disimpan sebagai HMAC, bukan plaintext, serta tidak ditulis ke log.
- Sesi memakai JWT bertanda tangan HS256 di cookie persisten `HttpOnly`,
  `Secure`, `SameSite=Strict` dan dapat dicabut di server saat logout. Menutup
  browser tidak menghapus sesi; batas absolut sesi 8 jam dan idle 1 jam.
- Perubahan password admin atau `SESSION_SECRET` otomatis membatalkan sesi lama.
- Semua endpoint mutasi menolak request tanpa `Origin` yang sama dengan
  `NEXT_PUBLIC_APP_URL` sebagai perlindungan CSRF tambahan.
- Email OTP adalah lapisan verifikasi tambahan yang praktis, tetapi bukan MFA
  phishing-resistant menurut NIST. Untuk sistem bernilai tinggi, gunakan TOTP
  atau passkey/WebAuthn.

## Migrasi database otomatis

Backend menjalankan seluruh file `db/migrations/*.sql` secara berurutan sebelum menerima request. Migration yang berhasil dicatat di tabel `schema_migrations`, sehingga tidak dijalankan ulang pada startup berikutnya. PostgreSQL advisory lock mencegah dua instance mengerjakan migration yang sama secara bersamaan.

Untuk perubahan schema berikutnya, tambahkan file SQL baru dengan pola `NNN_nama_migration.sql`. Jangan mengubah file yang sudah pernah diterapkan karena backend memverifikasi checksum-nya.

Migrasi otomatis aktif secara default. Jika perlu mematikannya sementara, set `AUTO_MIGRATE=false`.

## Menjalankan dengan Docker Compose

Compose hanya menjalankan aplikasi Next.js; tidak ada service PostgreSQL di dalamnya.

1. Siapkan `.env` dan arahkan `DATABASE_URL` ke PostgreSQL yang sudah tersedia. Jika PostgreSQL berjalan langsung pada host mesin, gunakan `host.docker.internal` sebagai hostname, bukan `localhost`.

2. Build dan jalankan aplikasi:

   ```powershell
   docker compose up -d --build
   ```

3. Aplikasi tersedia di `http://localhost:<PORT>`, sesuai nilai `PORT` di file environment (saat ini `3020`). Port aplikasi dan host dapat diubah langsung melalui `PORT`, misalnya `PORT=8080`, lalu jalankan ulang Compose:

   ```powershell
   docker compose up -d
   ```

   Karena `NEXT_PUBLIC_APP_URL` dibundel saat build browser, jalankan `docker compose up -d --build` setiap kali URL tersebut diubah.

Gunakan file `.env` yang sama untuk lokal dan production. Di server production, isi `.env` dengan kredensial production lalu jalankan perintah Compose yang sama.

## Titik kustomisasi

- Nama mempelai, tanggal, lokasi, dan narasi: `app/invite/[token]/page.tsx` serta `components/guest-experience.tsx`.
- Palet dan tampilan: `app/globals.css`.
- Struktur database: `db/migrations/*.sql`.
- Integrasi Thumbmark: `app/layout.tsx` dan `components/guest-experience.tsx`.
- Logika pengikatan perangkat: `app/api/public/invite/[token]/access/route.ts`.

## Catatan akses perangkat

Fingerprint browser adalah pengaman tambahan, bukan identitas perangkat yang absolut: update browser/OS, private browsing, atau pengaturan anti-tracking bisa membuat hasil berubah. Untuk itu, dashboard memiliki **Reset perangkat**. Sebelum dipublikasikan, tampilkan pemberitahuan privasi singkat kepada tamu karena browser/perangkat diproses untuk membatasi penyebaran link.
