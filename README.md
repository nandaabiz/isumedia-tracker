# IsuMedia Tracker & Electoral Intelligence

Platform analitik terpadu untuk pemantauan lalu lintas isu media sosial publik (**Fitur 1**) serta intelijen lanskap dan pemilih pemilu Indonesia 3 dekade 2014–2024 (**Fitur 2**).

Dibangun dengan **Nuxt.js 3**, **shadcn-vue** (Preset `--preset b2D2hq2C0`: Style *Luma*, Base *Mist*, Theme *Blue*, Chart *Emerald*), **Tailwind CSS**, **Leaflet GIS**, **PocketBase**, dan menerapkan standar desain **Impeccable** dengan estetika **Netral, Gerejawi, dan Humanis** (*Ecclesia & Humanitas*).

---

## 📌 Alokasi Port Jaringan Resmi

| Layanan | Port | URL Default | Keterangan |
|---|---|---|---|
| **Aplikasi Web Nuxt 3** | **`3020`** | `http://localhost:3020` | Frontend dashboard & server SSR |
| **PocketBase Backend** | **`8290`** | `http://127.0.0.1:8290` | API SQLite, Auth, & SSE Realtime |
| **PocketBase Admin UI** | **`8290`** | `http://127.0.0.1:8290/_/` | Dashboard manajemen database |

---

## 🚀 Fitur Utama

### 1. Modul Manajemen Akun & Keamanan (Modul 0)
- **Login lewat server**: captcha SVG prosedural diverifikasi di server, penguncian 5 menit setelah 5 kali gagal, lalu server menerbitkan token sesi bertanda tangan HMAC. Seluruh endpoint `/api/*` (kecuali captcha & login) wajib token; peran Viewer tidak bisa menambah/mengarsipkan topik.
- **PocketBase tidak diakses langsung dari browser**: server Nuxt memakai akun servis dari env (`PB_SERVICE_EMAIL`/`PB_SERVICE_PASSWORD`), jadi port 8290 cukup terbuka untuk `127.0.0.1`.
- **Akun demo (seed migrasi)**: `admin@isumedia.id` / `IsuMedia@2026` dan `analyst@isumedia.id` / `Analyst@2026`. **Ganti kata sandi keduanya sebelum production.** Login demo saat PocketBase mati hanya aktif bila `NUXT_DEMO_LOGIN=true` (default aktif di development, nonaktif di production).

### 2. Fitur 1: Media & Issue Tracker
- **Pemantauan Isu Tren & Kustom**: Menyajikan isu terhangat (PPN 12%, Makan Bergizi Gratis, Pilkada Serentak) dan pembuatan kueri kustom baru.
- **Filter Kanal Media Publik**: On/Off toggle untuk Portal Berita (RSS), Threads publik, X/Twitter publik, YouTube publik, TikTok publik, dan Forum publik Reddit (mengabaikan akun privat sesuai UU PDP No. 27/2022). Kanal yang kredensial API-nya belum diatur di server ditandai **belum diatur**.
- **Origin Finder (*Timestamp Zero*)**: Rekonstruksi waktu menemukan akun pertama pemantik isu dengan presisi detik, reach, dan tautan asli.
- **Amplification Network Graph**: Visualisasi graf interaktif (Origin -> KOL -> Buzzer/Bot Cluster -> News Media) dengan skor kemiripan teks Jaccard (96%).
- **Sebaran Geografis Wilayah**: Intensitas perbincangan isu dan sentimen dominan per provinsi, dengan daftar publikasi per provinsi (drill-down).
- **Linimasa volume harian** per sentimen, analisa sentimen, frasa kunci, entitas, dan ringkasan pro/kontra.
- **Kueri boolean** (`AND`/`OR`/`NOT`/`"frasa"`/kurung), filter entitas, arsip topik, dan unduh CSV publikasi mentah.

### 3. Fitur 2: Electoral & Voter Intelligence (3 Periode: 2014, 2019, 2024)
- **Peta GIS Indonesia Interaktif**: Peta Leaflet dengan pewarnaan tematik per provinsi.
- **Sudut Pandang Analisis**: Beralih instan antara **Hasil Pilpres**, **Perolehan Suara Parpol (Pileg DPR RI)**, dan **Klasifikasi Loyalis vs Swing**.
- **Indeks Volatilitas Pemilih (*Pedersen Swing Index*)**: Memetakan daerah basis kuat (*strongholds*) versus daerah pertempuran sengit (*battleground states*).
- **Data resmi KPU 38 provinsi**: Pilpres, Pileg DPR RI (suara & kursi semua partai), DPT, dan partisipasi 2014/2019/2024 di `data/electoral/` beserta sumber dan hasil verifikasinya (`SOURCES-*.md`).
- **Matriks Eksekutif vs Legislatif** per provinsi: split-ticket Pilpres vs Pileg DPR RI, ditambah gubernur terpilih Pilgub terdekat beserta partai pengusung dan apakah pemenang Pileg ikut mengusungnya (`pilkada.json`, `SOURCES-pilkada.md`).
- **Karakteristik masyarakat (data BPS, 38 provinsi)**: % penduduk perkotaan (proyeksi) & tipologi urban/transisi/rural, struktur generasi (SP2020/SUPAS 2025), sektor lapangan kerja dominan (Sakernas Agustus), IPM, rata-rata/harapan lama sekolah, dan indeks pendidikan, masing-masing dengan tahun acuan terdekat tiap pemilu dan pembanding nasional (`demography.json`, `SOURCES-demography.md`). Korelasi lintas provinsi indikator BPS vs suara capres ditampilkan sebagai pola wilayah.
- **Linimasa Berita Pemilu**: Mengorelasikan peristiwa berita nasional (Bansos, Putusan MK, Tol Trans Jawa, Ijtima Ulama, Efek Putra Daerah) dengan pergeseran elektoral.

---

## 🛠️ Cara Menjalankan

### 1. Menjalankan Frontend Nuxt 3 (Port 3020)
```bash
# Mode Development
npm run dev

# Atau Kompilasi & Jalankan Mode Produksi
npm run build
node .output/server/index.mjs
```
Buka peramban di: **`http://localhost:3020`**

### 2. Menjalankan Backend PocketBase (Port 8290, Opsional)
```bash
# Unduh binary PocketBase otomatis
bash scripts/setup-pocketbase.sh

# Jalankan server PocketBase
./bin/pocketbase serve --http=127.0.0.1:8290
```
Dashboard Admin PocketBase: **`http://127.0.0.1:8290/_/`**

### 3. Konfigurasi Environment
```bash
cp .env.example .env
# isi NUXT_SESSION_SECRET (openssl rand -hex 32), PB_SERVICE_EMAIL, PB_SERVICE_PASSWORD
# opsional (kosong = kanal dilewati): THREADS_ACCESS_TOKEN, X_BEARER_TOKEN, YOUTUBE_API_KEY,
# TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET, REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET (+ REDDIT_SUBREDDITS)
```

### 4. Menjalankan Unit Test & Migrasi Baru
```bash
# Unit test engine analisa isu & metrik pemilu (node --test, tanpa dependency tambahan)
npm test

# Terapkan migrasi PocketBase terbaru (field query & entity_filter pada monitored_topics)
npm run pb:migrate
```

---

## 🧠 Engine Analisa

Seluruh metrik dihitung dari data, bukan nilai statis:

- **`lib/issue-analysis.ts`** (Modul 1): parser kueri boolean, sentimen leksikon + negasi, NER 38 provinsi (kode Kemendagri + ibu kota/kota besar), kemiripan Jaccard + Levenshtein, rekonstruksi origin (Timestamp Zero), graf amplifikasi (induk = publikasi lebih awal dengan kemiripan tertinggi), Duplication Index, frasa kunci, entitas, ringkasan ekstraktif pro/kontra, dan velocity tren 24 jam.
- **`lib/electoral-metrics.ts`** (Modul 2): Pedersen Index ½ Σ |ΔP| per periode, klasifikasi Kandang Loyalis / Condong Loyalis / Medan Pertempuran / Anomali, indeks loyalitas, deteksi split-ticket Pilpres vs Pileg, dan keselarasan gubernur terpilih dengan pemenang Pileg.
- **`lib/demography.ts`** (Modul 2): pemilihan tahun acuan BPS terdekat (maks. 4 tahun, menghormati batas wilayah sebelum/sesudah pemekaran Papua 2022), indeks pendidikan `(RLS/15 + HLS/18)/2`, tipologi urban, dan korelasi Pearson indikator BPS vs porsi suara capres antarprovinsi.

Batasan saat ini:
- Sumber riil: Google News RSS, Antara RSS, serta konektor API resmi Threads, X, YouTube, TikTok, dan forum Reddit. Tiap konektor aktif hanya bila kredensialnya diisi di `.env` (lihat `.env.example`), berjalan paralel, dan hasilnya selalu disaring ulang dengan kueri boolean (`matchesQuery`). Jendela pencarian 7 hari. Hasil per kueri di-cache di memori proses (`server/utils/ttl-cache.ts`) untuk menjaga kuota.
- Kata kunci minimum (`keywordCoverTerms` di `lib/issue-analysis.ts`) dipakai untuk API tanpa operator boolean: OR = gabungan, AND = sisi dengan kata kunci paling sedikit, NOT tidak dapat dicari. Kueri yang hanya berisi NOT dilewati konektor sosial.
- Threads (`lib/threads.ts`): token wajib punya izin `threads_basic` + `threads_keyword_search`; tanpa persetujuan App Review Meta, pencarian hanya mencakup post milik akun token. Maks. 3 kata kunci per sinkronisasi, cache 5 menit (kuota 2.200 kueri/24 jam). Tidak ada reach/engagement untuk post akun lain.
- X (`lib/x.ts`): X API v2 `tweets/search/recent` butuh paket berbayar dengan akses recent search. Kueri boolean diterjemahkan langsung ke sintaks X ditambah `-is:retweet lang:id`; bila melebihi 512 karakter, dipakai gabungan OR kata kunci minimum. Reach = `impression_count`, engagement = like + repost + reply + quote. Cache 15 menit.
- YouTube (`lib/youtube.ts`): `search.list` (100 unit kuota) + `videos.list` untuk statistik (1 unit); kuota default 10.000 unit/hari, cache 30 menit. Parameter `q` hanya mendukung `|` tanpa tanda kurung, jadi yang dicari gabungan kata kunci minimum. Teks yang dianalisis = judul + potongan deskripsi; reach = jumlah tayangan.
- TikTok (`lib/tiktok.ts`): TikTok Research API hanya untuk peneliti yang disetujui TikTok. Video wilayah `ID` yang deskripsinya memuat salah satu dari maks. 10 kata kunci minimum; cache 15 menit (kuota 1.000 request/hari). ID video int64 dibaca sebagai string agar tautan tidak rusak.
- Forum (`lib/reddit.ts`): Reddit API application-only OAuth pada subreddit `REDDIT_SUBREDDITS` (default `r/indonesia`), kueri boolean diterjemahkan ke sintaks Lucene Reddit, post NSFW dan akun terhapus diabaikan. Reddit tidak membuka jumlah tayangan (reach `N/A`); engagement = skor vote + komentar. Kaskus tidak menyediakan API publik sehingga tidak dirayapi.
- RSS tidak menyediakan reach/engagement (ditampilkan `N/A`).
- Origin = publikasi paling awal dalam jendela perayapan 7 hari, bukan seluruh riwayat internet.
- Data pemilu: 2014 mencakup 33 provinsi (Kaltara masih tergabung Kaltim), 2019 34 provinsi, 2024 38 provinsi; 4 provinsi Papua hasil pemekaran 2022 diklasifikasikan "data belum cukup". Rekap suara Pileg 2019 Kalimantan Selatan tidak tersedia di sumber terbuka (hanya kursi). Detail di `data/electoral/SOURCES-*.md`.
- Data BPS: % perkotaan adalah proyeksi (berbasis SP2010) dan tidak tersedia untuk Kaltara serta 6 provinsi Papua pada 2024; sektor kerja per provinsi baru ada sejak 2021 (2019 memakai Agustus 2021, 2014 kosong); generasi untuk 2014 kosong (sumber terdekat SP2020). Pembanding legislatif untuk gubernur masih DPR RI karena kursi DPRD belum diimpor; DIY tidak menggelar Pilgub. Data Pilgub bersumber Wikipedia id + putusan MK (situs KPU daerah tidak dapat diakses); 6 entri periode 2014 tanpa koalisi pengusung terverifikasi sehingga keselarasannya tidak dihitung.
- Login lockout tersimpan di memori proses: cukup untuk satu instance; pakai penyimpanan bersama bila diskalakan.
- Topik bawaan memakai data contoh sampai perayapan pertama berhasil (badge **Data Contoh** vs **Data Live**).

---

## 📄 Ekspor Laporan PDF

Tombol **Unduh PDF** di kedua modul membuat laporan teks A4 (bisa dicari, kecil untuk WhatsApp) di browser. Di perangkat yang mendukung Web Share API (Android Chrome, iOS/macOS Safari) muncul tombol **Bagikan** yang langsung membuka lembar berbagi WhatsApp/aplikasi lain dengan file PDF terlampir.

---

## 🚢 Deploy

`deploy.sh` menjalankan test, build, migrasi PocketBase, lalu (re)start Nuxt dan PocketBase lewat PM2, diakhiri health check.

```bash
# di server (repo sudah di-clone, .env sudah diisi)
./deploy.sh

# dari mesin lokal ke server via SSH
DEPLOY_HOST=user@server DEPLOY_PATH=/srv/isumedia-tracker ./deploy.sh --remote
```

Panduan lengkap VPS Ubuntu + aaPanel (Nginx, SSL, firewall, PocketBase, backup): **[docs/DEPLOY_AAPANEL.md](docs/DEPLOY_AAPANEL.md)**.

---

## 📚 Dokumentasi Teknis Lengkap

- 📄 **[docs/SMOKE_TEST_REPORT.md](docs/SMOKE_TEST_REPORT.md)**: Hasil pengujian smoke test otomatis (100% PASS).
- 📄 **[docs/PRD.md](docs/PRD.md)**: *Product Requirements Document* & Skema PocketBase.
- 📄 **[docs/BRD.md](docs/BRD.md)**: *Business Requirements Document*, Sasaran Bisnis & Kepatuhan Etika.
- 📄 **[PRODUCT.md](PRODUCT.md)**: Rekam kebenaran produk sesuai format *Impeccable Schema 1*.
- 📄 **[DESIGN.md](DESIGN.md)**: Panduan sistem desain estetika *Netral, Gerejawi, dan Humanis*.
