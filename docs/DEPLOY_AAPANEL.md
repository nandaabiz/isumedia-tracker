# Panduan Deploy: VPS Ubuntu + aaPanel

Panduan ini menjalankan IsuMedia Tracker di VPS Ubuntu yang dikelola dengan aaPanel.

Pembagian peran:

| Komponen | Dikelola oleh | Akses |
|---|---|---|
| Nginx, domain, SSL Let's Encrypt, firewall | aaPanel | publik (80/443) |
| Aplikasi Nuxt (`isumedia-web`) | PM2 via `deploy.sh` | `127.0.0.1:3020` saja |
| PocketBase (`isumedia-pocketbase`) | PM2 via `deploy.sh` | `127.0.0.1:8290` saja |

> Jangan mendaftarkan aplikasi ini lagi di menu **Website → Node project** aaPanel. Proses sudah dijalankan PM2 dari `deploy.sh`; mendaftarkannya dua kali membuat dua proses berebut port 3020.

---

## 1. Prasyarat

- VPS Ubuntu 22.04 atau 24.04, minimal **2 GB RAM** (build Nuxt butuh memori; untuk 1 GB tambahkan swap, lihat langkah 2).
- Domain dengan **A record** mengarah ke IP VPS, mis. `isumedia.domainanda.id`.
- Akses SSH sebagai `root` atau user dengan `sudo`.
- Repo GitHub `nandaabiz/isumedia-tracker`.

## 2. Siapkan server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip ca-certificates
```

Swap 2 GB (lewati bila RAM ≥ 2 GB):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Pasang aaPanel

Ambil perintah instalasi terbaru dari situs resmi <https://www.aapanel.com/new/download.html> lalu jalankan sebagai root. Contoh untuk aaPanel 7 (cocokkan dengan situs resmi sebelum menjalankan):

```bash
URL=https://www.aapanel.com/script/install_7.0_en.sh && \
  if [ -f /usr/bin/curl ]; then curl -ksSO "$URL"; else wget --no-check-certificate -O install_7.0_en.sh "$URL"; fi; \
  bash install_7.0_en.sh aapanel
```

Setelah selesai, terminal menampilkan **alamat panel, username, dan password**. Simpan, lalu:

1. Login ke panel, ganti password dan **security entrance** di **Settings**.
2. Saat ditawari paket awal, pilih **Nginx** saja. PHP, MySQL, dan FTP tidak dibutuhkan aplikasi ini.

## 4. Pasang Node.js 22 dan PM2

Aplikasi butuh **Node ≥ 22.18** (unit test membaca file TypeScript langsung). Pasang secara sistem lewat NodeSource agar `node` tersedia untuk semua user dan untuk `deploy.sh`:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v   # harus v22.18 atau lebih baru
```

> Node Version Manager di App Store aaPanel memasang Node di `/www/server/nodejs/...` yang tidak otomatis masuk `PATH`. Pakai NodeSource di atas agar `deploy.sh` dan PM2 menemukan `node`.

## 5. Buat user aplikasi dan ambil kode

Aplikasi berjalan sebagai user khusus, bukan root:

```bash
sudo adduser --disabled-password --gecos "" isumedia
sudo mkdir -p /www/wwwroot/isumedia-tracker
sudo chown isumedia:isumedia /www/wwwroot/isumedia-tracker
sudo -iu isumedia
```

Perintah selanjutnya dijalankan **sebagai user `isumedia`**.

Bila repo privat, buat deploy key (read-only):

```bash
ssh-keygen -t ed25519 -C "isumedia-vps" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Tempel isi kunci publik di GitHub: **repo → Settings → Deploy keys → Add deploy key** (jangan centang *Allow write access*). Lalu clone:

```bash
git clone git@github.com:nandaabiz/isumedia-tracker.git /www/wwwroot/isumedia-tracker
cd /www/wwwroot/isumedia-tracker
```

## 6. Konfigurasi `.env`

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 32   # salin hasilnya untuk NUXT_SESSION_SECRET
nano .env
```

Isi minimal untuk deploy pertama:

```ini
POCKETBASE_URL=http://127.0.0.1:8290
NUXT_SESSION_SECRET=<hasil openssl rand -hex 32>
NUXT_DEMO_LOGIN=false
HOST=127.0.0.1
PORT=3020
# Diisi di langkah 8, setelah akun servis PocketBase dibuat
PB_SERVICE_EMAIL=
PB_SERVICE_PASSWORD=
# Opsional: konektor Threads (izin threads_basic + threads_keyword_search)
THREADS_ACCESS_TOKEN=
```

`HOST=127.0.0.1` membuat Nuxt hanya menerima koneksi dari Nginx di server yang sama. Ini penting: bila port 3020 terbuka ke publik, penyerang bisa memalsukan header `X-Forwarded-For` dan menghindari penguncian login.

## 7. Deploy pertama

```bash
./deploy.sh
```

Skrip ini: menarik branch `main`, `npm ci`, menjalankan unit test, build, mengunduh PocketBase untuk Linux dan menjalankan migrasi, menyalakan `isumedia-web` dan `isumedia-pocketbase` di PM2, lalu health check. Peringatan `PB_SERVICE_EMAIL/PB_SERVICE_PASSWORD kosong` wajar pada deploy pertama.

Agar PM2 hidup lagi setelah VPS reboot:

```bash
pm2 startup systemd
```

Perintah itu mencetak satu baris `sudo env PATH=... pm2 startup systemd -u isumedia --hp /home/isumedia`. Keluar dulu ke user sudo (`exit`), jalankan baris tersebut, lalu kembali (`sudo -iu isumedia`) dan simpan daftar proses:

```bash
pm2 save
```

## 8. Amankan PocketBase

Migrasi membuat dua akun demo dengan kata sandi yang tercantum di README. **Wajib diganti di production.**

1. Buat admin (superuser) PocketBase:

   ```bash
   cd /www/wwwroot/isumedia-tracker
   ./scripts/bin/pocketbase admin create admin-anda@domain.id 'KataSandiPanjangDanUnik' --dir=scripts/bin/pb_data
   ```

2. Buka dashboard admin lewat tunnel SSH (port 8290 tidak dibuka ke publik). Dari komputer Anda:

   ```bash
   ssh -L 8290:127.0.0.1:8290 isumedia@IP_VPS
   ```

   Lalu buka <http://127.0.0.1:8290/_/> di browser dan login sebagai admin.

3. Di koleksi **users**:
   - Ganti kata sandi `admin@isumedia.id` dan `analyst@isumedia.id`, atau hapus bila tidak dipakai.
   - Buat akun servis khusus, mis. `service@domain.id`, dengan `role = analyst` dan kata sandi acak panjang.
   - Buat akun untuk tiap pengguna nyata dengan role `admin`, `analyst`, atau `viewer`.

4. Isi akun servis ke `.env`, lalu muat ulang aplikasi:

   ```bash
   nano .env   # PB_SERVICE_EMAIL dan PB_SERVICE_PASSWORD
   pm2 restart isumedia-web
   ```

5. Aktifkan backup otomatis di dashboard PocketBase: **Settings → Backups → Auto backups** (mis. cron `0 2 * * *`, simpan 7). Unduh salinan backup ke tempat lain secara berkala.

## 9. Domain, reverse proxy, dan SSL di aaPanel

1. **Website → Add site**
   - Domain: `isumedia.domainanda.id`
   - PHP version: **Static** (tanpa PHP), Database: tidak ada.
2. Buka pengaturan situs tersebut → **SSL → Let's Encrypt** → pilih domain → **Apply**, lalu aktifkan **Force HTTPS**.
3. Pengaturan situs → **Config file** (konfigurasi Nginx situs). Di dalam blok `server { ... }` untuk port 443, tambahkan sebelum `location` lain:

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3020;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       # Timpa (bukan tambahkan) agar klien tidak bisa memalsukan IP untuk penguncian login
       proxy_set_header X-Forwarded-For $remote_addr;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_read_timeout 60s;
       client_max_body_size 5m;
   }
   ```

   Simpan; aaPanel akan menguji dan me-reload Nginx.

   > Menu **Reverse proxy** bawaan aaPanel juga bisa dipakai (target `http://127.0.0.1:3020`), tetapi templatenya memakai `X-Forwarded-For $proxy_add_x_forwarded_for`. Bila memakai menu itu, buka file konfigurasinya dan ganti baris tersebut menjadi `$remote_addr` seperti di atas.

4. Buka `https://isumedia.domainanda.id/login`. Halaman login dan gambar captcha harus tampil.

## 10. Firewall

Di **Security** aaPanel pastikan hanya port berikut yang terbuka: `22` (SSH), `80`, `443`, dan port panel aaPanel. Port `3020` dan `8290` **tidak boleh** terbuka. Cek dari komputer lain:

```bash
curl -m 5 http://IP_VPS:3020   # harus gagal/timeout
curl -m 5 http://IP_VPS:8290   # harus gagal/timeout
```

Server juga perlu akses keluar (HTTPS) ke `news.google.com` dan `www.antaranews.com` untuk perayapan RSS, serta `graph.threads.net` bila `THREADS_ACCESS_TOKEN` diisi.

## 11. Update aplikasi

Di server:

```bash
sudo -iu isumedia
cd /www/wwwroot/isumedia-tracker && ./deploy.sh
```

Atau dari komputer lokal (butuh akses SSH ke user `isumedia`):

```bash
DEPLOY_HOST=isumedia@IP_VPS DEPLOY_PATH=/www/wwwroot/isumedia-tracker ./deploy.sh --remote
```

Opsi lain: `--branch <nama>`, `--skip-tests`, `--skip-pull`. Deploy berhenti bila ada perubahan lokal yang belum dikomit di server.

## 12. Pemantauan & masalah umum

```bash
pm2 status
pm2 logs isumedia-web --lines 100
pm2 logs isumedia-pocketbase --lines 100
```

| Gejala | Penyebab & solusi |
|---|---|
| **502 Bad Gateway** | `isumedia-web` mati atau tidak di port 3020. Cek `pm2 status` dan `pm2 logs isumedia-web`. |
| Log: `NUXT_SESSION_SECRET belum dikonfigurasi` | `.env` belum diisi atau kurang dari 32 karakter; isi lalu `pm2 restart isumedia-web`. |
| Build berhenti / `Killed` saat `npm run build` | Memori habis; tambahkan swap (langkah 2). |
| Login: "Layanan autentikasi (PocketBase) tidak tersedia" | `isumedia-pocketbase` mati; cek `pm2 logs isumedia-pocketbase`. |
| Header aplikasi menampilkan "DB offline" | `PB_SERVICE_EMAIL/PASSWORD` kosong atau salah, atau akun servis bukan role `analyst`/`admin`. |
| Perayap "Sinkronisasi gagal" | Server tidak bisa mengakses Google News/Antara; cek firewall keluar. |
| Tombol **Bagikan** tidak muncul | Normal di browser desktop yang tidak mendukung berbagi file; tombol **Unduh PDF** tetap tersedia. |

## Catatan

- Penguncian login dan captcha disimpan di memori proses: jalankan **satu** instance `isumedia-web` (sudah diatur di `ecosystem.config.cjs`). Restart aplikasi mereset penguncian.
- Data PocketBase ada di `scripts/bin/pb_data/` dan tidak ikut repo git; backup folder ini (atau gunakan Auto backups PocketBase).
