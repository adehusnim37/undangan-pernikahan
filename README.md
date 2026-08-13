# Undangan pernikahan personal

Template full-stack untuk undangan web dengan link personal per tamu, dashboard admin, RSVP, dan PostgreSQL. Desain awal memakai nuansa taman malam: hijau gelap, jade, dan aksen tanah liat.

## Fitur awal

- Halaman undangan responsif di `/invite/[token]`.
- Dashboard admin di `/admin` untuk membuat tamu, menyalin link, mencabut akses, dan me-reset perangkat.
- API route Next.js untuk login admin, tamu, pemeriksaan akses, dan RSVP.
- PostgreSQL melalui Docker Compose dengan tiga tabel: `invitations`, `access_logs`, dan `rsvps`.
- Pengikatan perangkat pada kunjungan pertama memakai ThumbmarkJS di browser. Admin dapat me-reset ikatan perangkat kapan pun.

## Menjalankan lokal

1. Buat konfigurasi lokal:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Ubah `ADMIN_PASSWORD` dan `SESSION_SECRET` di `.env.local`.

3. Jalankan PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

4. Pasang dependensi dan jalankan aplikasi:

   ```powershell
   npm install
   npm run dev
   ```

5. Buka `http://localhost:3000/admin`, masuk memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD`, lalu buat link tamu pertama.

## Titik kustomisasi

- Nama mempelai, tanggal, lokasi, dan narasi: `app/invite/[token]/page.tsx` serta `components/guest-experience.tsx`.
- Palet dan tampilan: `app/globals.css`.
- Struktur database: `db/init.sql`.
- Integrasi Thumbmark: `app/layout.tsx` dan `components/guest-experience.tsx`.
- Logika pengikatan perangkat: `app/api/public/invite/[token]/access/route.ts`.

## Catatan akses perangkat

Fingerprint browser adalah pengaman tambahan, bukan identitas perangkat yang absolut: update browser/OS, private browsing, atau pengaturan anti-tracking bisa membuat hasil berubah. Untuk itu, dashboard memiliki **Reset perangkat**. Sebelum dipublikasikan, tampilkan pemberitahuan privasi singkat kepada tamu karena browser/perangkat diproses untuk membatasi penyebaran link.
