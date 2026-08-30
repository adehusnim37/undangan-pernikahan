# Nginx host Ubuntu + Certbot

Konfigurasi ini dipakai jika Nginx dan Certbot dipasang langsung pada server Ubuntu, sedangkan aplikasi Next.js berjalan melalui Docker di `127.0.0.1:3020`.

## Prasyarat DNS

Buat record `A` untuk `nikah.alvitade.com` menuju IPv4 server. Buat record `AAAA` hanya jika server benar-benar memiliki IPv6 yang aktif dan port 80/443 dapat diakses melalui IPv6. Tunggu sampai DNS publik mengarah ke server sebelum meminta sertifikat.

## 1. Siapkan webroot challenge dan konfigurasi HTTP

Konfigurasi HTTP harus dipakai lebih dahulu karena konfigurasi SSL merujuk ke file sertifikat yang belum ada.

```bash
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
sudo cp deploy/nginx/host/nikah.alvitade.com.conf /etc/nginx/sites-available/nikah.alvitade.com
sudo ln -s /etc/nginx/sites-available/nikah.alvitade.com /etc/nginx/sites-enabled/nikah.alvitade.com
sudo nginx -t
sudo systemctl reload nginx
```

Jika symbolic link sudah ada, tidak perlu menjalankan `ln -s` lagi.

## 2. Pastikan challenge dapat diakses dari internet

```bash
printf 'acme-ok' | sudo tee /var/www/certbot/.well-known/acme-challenge/test
curl http://nikah.alvitade.com/.well-known/acme-challenge/test
```

Respons wajib berisi `acme-ok`. Jangan lanjut ke Certbot jika request ini gagal. Pastikan port TCP 80 dan 443 dibuka pada firewall server dan firewall provider.

## 3. Pasang Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## 4. Terbitkan sertifikat domain baru

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d nikah.alvitade.com
```

Mode ini tidak meminta Certbot membaca atau mengubah konfigurasi Nginx, sehingga tidak terganggu oleh konfigurasi CrowdSec.

## 5. Aktifkan HTTPS

```bash
sudo cp deploy/nginx/host/nikah.alvitade.com.ssl.conf /etc/nginx/sites-available/nikah.alvitade.com
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Ubah URL aplikasi dan build ulang

Ubah nilai berikut pada `.env` production:

```dotenv
APP_ENV=production
NEXT_PUBLIC_APP_URL=https://nikah.alvitade.com
TRUST_PROXY=true
```

Kemudian build ulang karena `NEXT_PUBLIC_APP_URL` masuk ke bundle browser:

```bash
docker compose up -d --build
```

## 7. Redirect domain lama (disarankan)

Jalankan langkah ini setelah domain baru lolos verifikasi. Sertifikat domain lama harus tetap tersedia dan diperpanjang selama redirect masih digunakan.

```bash
sudo cp deploy/nginx/host/nikah.mas-a.de.redirect.conf /etc/nginx/sites-available/nikah.mas-a.de
sudo nginx -t
sudo systemctl reload nginx
```

Jangan hapus record DNS `nikah.mas-a.de` selama redirect masih diperlukan.

## 8. Verifikasi

```bash
curl -I https://nikah.alvitade.com/admin/login
curl -I https://nikah.mas-a.de/admin/login
sudo certbot renew --dry-run
```

URL baru harus merespons dari aplikasi. URL lama harus memberi status `301` dengan header `Location` menuju `https://nikah.alvitade.com/...`.

Setelah HTTPS aktif, akses admin melalui `https://nikah.alvitade.com/admin/login`. Jangan login melalui alamat IP atau port `3020` karena cookie production memakai atribut `Secure`.
