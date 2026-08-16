# Nginx host Ubuntu + Certbot

Konfigurasi ini dipakai jika Nginx dan Certbot dipasang langsung pada server Ubuntu, sedangkan aplikasi Next.js berjalan melalui Docker di `127.0.0.1:3020`.

## 1. Salin konfigurasi Nginx

```bash
sudo cp deploy/nginx/host/nikah.mas-a.de.conf /etc/nginx/sites-available/nikah.mas-a.de
sudo ln -s /etc/nginx/sites-available/nikah.mas-a.de /etc/nginx/sites-enabled/nikah.mas-a.de
sudo nginx -t
sudo systemctl reload nginx
```

Jika symbolic link sudah ada, tidak perlu menjalankan `ln -s` lagi.

## 2. Pastikan HTTP sudah menuju aplikasi

```bash
curl -I http://nikah.mas-a.de/admin/login
```

Respons yang diharapkan adalah `HTTP/1.1 200 OK`.

## 3. Pasang Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## 4. Terbitkan sertifikat dan aktifkan redirect HTTPS

```bash
sudo certbot --nginx -d nikah.mas-a.de --redirect
```

Certbot akan meminta alamat email dan persetujuan Terms of Service, kemudian memperbarui konfigurasi Nginx dengan blok HTTPS.

## 5. Verifikasi

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://nikah.mas-a.de/admin/login
sudo certbot renew --dry-run
```

Setelah HTTPS aktif, akses admin melalui `https://nikah.mas-a.de/admin/login`. Jangan login melalui alamat IP atau port `3020` karena cookie production memakai atribut `Secure`.
