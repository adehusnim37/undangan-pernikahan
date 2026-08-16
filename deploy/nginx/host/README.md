# Nginx host Ubuntu + Certbot

Konfigurasi ini dipakai jika Nginx dan Certbot dipasang langsung pada server Ubuntu, sedangkan aplikasi Next.js berjalan melalui Docker di `127.0.0.1:3020`.

## 1. Siapkan webroot challenge dan salin konfigurasi HTTP

```bash
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
sudo cp deploy/nginx/host/nikah.mas-a.de.conf /etc/nginx/sites-available/nikah.mas-a.de
sudo ln -s /etc/nginx/sites-available/nikah.mas-a.de /etc/nginx/sites-enabled/nikah.mas-a.de
sudo nginx -t
sudo systemctl reload nginx
```

Jika symbolic link sudah ada, tidak perlu menjalankan `ln -s` lagi.

## 2. Pastikan challenge dapat diakses dari internet

```bash
printf 'acme-ok' | sudo tee /var/www/certbot/.well-known/acme-challenge/test
curl http://nikah.mas-a.de/.well-known/acme-challenge/test
```

Respons wajib berisi `acme-ok`. Jangan lanjut ke Certbot jika request ini gagal. Pastikan port TCP 80 dibuka pada firewall server dan firewall provider.

## 3. Pasang Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## 4. Terbitkan sertifikat dengan mode webroot

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d nikah.mas-a.de
```

Mode ini tidak meminta Certbot membaca atau mengubah konfigurasi Nginx, sehingga tidak terganggu oleh konfigurasi CrowdSec.

## 5. Aktifkan konfigurasi HTTPS

```bash
sudo cp deploy/nginx/host/nikah.mas-a.de.ssl.conf /etc/nginx/sites-available/nikah.mas-a.de
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Verifikasi

```bash
curl -I https://nikah.mas-a.de/admin/login
sudo certbot renew --dry-run
```

Setelah HTTPS aktif, akses admin melalui `https://nikah.mas-a.de/admin/login`. Jangan login melalui alamat IP atau port `3020` karena cookie production memakai atribut `Secure`.
