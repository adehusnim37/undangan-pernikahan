# Undangan pernikahan personal

Template full-stack untuk undangan web dengan link personal per tamu, dashboard admin, RSVP, dan PostgreSQL. Desain awal memakai nuansa taman malam: hijau gelap, jade, dan aksen tanah liat.

## Fitur awal

- Halaman undangan responsif di `/invite/[token]`.
- Dashboard admin di `/admin` untuk membuat tamu, menyalin link, mencabut akses, dan me-reset perangkat.
- API route Next.js untuk login admin, tamu, pemeriksaan akses, dan RSVP.
- PostgreSQL eksternal untuk data undangan, akses, RSVP, dan pengaturan media.
- Pengikatan perangkat pada kunjungan pertama memakai ThumbmarkJS di browser. Admin dapat me-reset ikatan perangkat kapan pun.

## Menjalankan lokal

1. Buat konfigurasi lokal:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Ubah `ADMIN_PASSWORD` dan `SESSION_SECRET` di `.env`.

   Gunakan `APP_ENV=development` saat aplikasi diakses melalui HTTP. Untuk deployment production, ubah menjadi `APP_ENV=production` dan akses aplikasi hanya melalui HTTPS karena cookie admin akan memakai atribut `Secure`. `NODE_ENV` tetap dikelola oleh Next.js dan tidak dipakai untuk memilih protokol deployment. Isi `NEXT_PUBLIC_APP_URL` dengan URL yang akan dibagikan ke tamu, misalnya `http://localhost:3020` atau `https://nikah.mas-a.de`.

3. Pastikan PostgreSQL yang sudah tersedia dapat diakses melalui `DATABASE_URL`.

4. Pasang dependensi dan jalankan aplikasi secara lokal:

   ```powershell
   npm install
   npm run dev
   ```

5. Buka `http://localhost:<PORT>/admin`, masuk memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD`, lalu buat link tamu pertama.

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
- Struktur database: `db/init.sql`.
- Integrasi Thumbmark: `app/layout.tsx` dan `components/guest-experience.tsx`.
- Logika pengikatan perangkat: `app/api/public/invite/[token]/access/route.ts`.

## Catatan akses perangkat

Fingerprint browser adalah pengaman tambahan, bukan identitas perangkat yang absolut: update browser/OS, private browsing, atau pengaturan anti-tracking bisa membuat hasil berubah. Untuk itu, dashboard memiliki **Reset perangkat**. Sebelum dipublikasikan, tampilkan pemberitahuan privasi singkat kepada tamu karena browser/perangkat diproses untuk membatasi penyebaran link.
