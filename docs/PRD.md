# Product Requirements Document (PRD)
## Project: IsuMedia Tracker & Electoral Intelligence Platform
**Target Stack:** Nuxt.js 3 (Vue 3, TypeScript) + shadcn-vue (Tailwind CSS, Radix Vue) + PocketBase (SQLite, Realtime SSE)  
**Version:** 1.0.0  
**Status:** In Progress  

---

## 1. Ikhtisar Produk (Product Overview)

**IsuMedia Tracker & Electoral Intelligence** adalah aplikasi web terpadu untuk intelijen media sosial publik, pelacakan penyebaran isu (*origin & amplification tracker*), serta analitik komparatif pemilu Indonesia lintas 3 periode (2014, 2019, 2024).

Aplikasi ini dibangun menggunakan arsitektur modern:
- **Frontend / Full-Stack SSR**: **Nuxt 3** dengan **shadcn-vue**, **Tailwind CSS**, **Leaflet** (Peta GIS Indonesia), dan pustaka graf jaringan (**Vis-Network / D3**).
- **Backend & Database**: **PocketBase** (embedded SQLite berkecepatan tinggi, REST API bawaan, autentikasi berbasis token JWT, dan langganan real-time Server-Sent Events / SSE).

---

## 2. Persona Pengguna (User Personas)

1. **Baskoro (Senior Political Strategist & Campaign Director)**:
   - *Goal*: Mencari wilayah provinsi/kabupaten mana yang merupakan basis loyalis partai vs wilayah *swing voters* yang masih bisa diperebutkan di Pilpres/Pileg.
   - *Pain Point*: Data pemilu KPU tercecer dalam ratusan dokumen PDF dan portal yang sering *down*.
2. **Klarisa (Lead Media Analyst & Public Relations Specialist)**:
   - *Goal*: Mengetahui siapa orang atau akun pertama yang mencuitkan isu tertentu di medsos publik (*timestamp zero*), siapa saja *amplifiers/reposters*-nya, dan bagaimana penyebaran isu tersebut di tiap provinsi.
   - *Pain Point*: Dashboard pemantau komersial seringkali sangat mahal, mengunci data mentah, dan tidak transparan dalam melacak rantai duplikasi.
3. **Dr. Hendra (Peneliti Sosiologi Politik & Pengawas Pemilu)**:
   - *Goal*: Meneliti korelasi antara berita-berita isu sensitif di suatu daerah dengan lonjakan atau penurunan suara partai tertentu selama 3 pemilu berturut-turut.
   - *Pain Point*: Tidak ada platform terpadu yang menyandingkan *news sentiment timeline* dengan data perolehan suara resmi KPU.

---

## 3. Fitur Utama & Kebutuhan Fungsional (Functional Requirements)

### MODUL 1: Media & Issue Tracker (Fitur 1)

#### 1.1 Topic & Issue Discovery Engine
- **FR-1.1.1**: Sistem menyediakan *Trending Issues Board* yang mendeteksi topik publik terpopuler secara otomatis berdasarkan frekuensi dan *velocity* (akselerasi penyebaran).
- **FR-1.1.2**: Pengguna dapat membuat **Custom Monitoring Query** (kata kunci, tagar, frasa logika boolean `AND`/`OR`/`NOT`, dan filter entitas tokoh).
- **FR-1.1.3**: **Media Source Filter**: Pengguna dapat menyalakan/mematikan sumber pemantauan:
  - Portal Berita Online (RSS & Scraper terverifikasi Dewan Pers)
  - Threads (Post publik via Threads API `keyword_search`)
  - X / Twitter (Akun publik)
  - YouTube (Video & komentar publik)
  - TikTok (Video & deskripsi publik)
  - Facebook Pages / Forum Publik
  - *Strict Exclusion*: Sistem mengabaikan seluruh akun pribadi/privat.

#### 1.2 Origin & Amplification Network (Pemantik & Duplikasi)
- **FR-1.2.1**: **Deteksi Pemantik (Origin Finder)**: Algoritma merekonstruksi garis waktu untuk menemukan *Earliest Documented Mention (Timestamp Zero)*: menampilkan nama akun, tautan konten asli, waktu publikasi presisi detik, dan metrik awal.
- **FR-1.2.2**: **Graf Jaringan Duplikasi (Amplifier Network Graph)**:
  - Visualisasi graf interaktif (node & edge).
  - Node pusat: Akun pemantik (*Origin*).
  - Child nodes level 1: Akun-akun penyebar pertama (*Early Multipliers / Key Opinion Leaders*).
  - Child nodes level 2+: Akun duplikasi massal (*Amplifiers / Buzzer rings* / Media portal penerus).
  - Interaksi: Zoom, pan, klik node untuk melihat detail metrik (reach, followers, engagement, timestamp penyebaran).
- **FR-1.2.3**: **Duplication Index**: Menghitung persentase kemiripan teks/narasi (*Jaccard Similarity & Levenshtein / Embedding distance*) untuk mendeteksi *copy-paste* narasi yang disengaja.

#### 1.3 Regional Geo-Mapping (Sebaran Kewilayahan)
- **FR-1.3.1**: Sistem mengekstraksi entitas daerah (*Named Entity Recognition - NER*) dari teks konten media publik (nama 38 provinsi dan 514 kabupaten/kota).
- **FR-1.3.2**: Peta tematik (Choropleth GIS) Indonesia dengan gradasi intensitas perbincangan isu (misal: isu berkembang pesat di Jawa Barat, Sumatera Utara, atau Papua).
- **FR-1.3.3**: Drill-down: Mengklik provinsi pada peta akan menampilkan daftar artikel/postingan spesifik yang bersumber atau membicarakan daerah tersebut.

#### 1.4 Sentimen & Narasi (Sentiment & Narrative Analytics)
- **FR-1.4.1**: Klasifikasi sentimen 3-kelas: Positif, Netral, Negatif dengan persentase skor keyakinan.
- **FR-1.4.2**: Ekstraksi frasa kunci (*Key Phrases*) dan entitas tokoh/organisasi yang paling sering dikaitkan dengan isu.
- **FR-1.4.3**: Ringkasan narasi bertenaga AI/NLP yang menyajikan sari perdebatan utama dari kedua belah pihak (pro & kontra).

---

### MODUL 0: Manajemen Akun & Keamanan Akses (Access Control & Captcha)

#### 0.1 Otentikasi Pengguna & Pembatasan Akses (Login Gate)
- **FR-0.1.1**: **Mandatory Login Gate**: Seluruh halaman aplikasi (dashboard, analitik isu, peta elektoral, dan pengaturan) diproteksi oleh middleware autentikasi. Pengguna anonim wajib diarahkan ke halaman `/login`.
- **FR-0.1.2**: Kredensial masuk menggunakan kombinasi **Username/Email + Kata Sandi (Password)** yang terenkripsi aman dengan PocketBase Auth (Argon2/bcrypt hashing).
- **FR-0.1.3**: **Role-Based Access Control (RBAC)**:
  - `Admin`: Mengelola akun pengguna, konfigurasi koneksi PocketBase, dan reset topik.
  - `Analyst`: Mengakses seluruh dashboard analitik, menambah/mengubah kueri isu yang dipantau, dan mengekspor laporan.
  - `Viewer`: Hanya dapat melihat dashboard dan visualisasi tanpa izin mengubah topik monitoring.

#### 0.2 Verifikasi Captcha Interaktif (Anti-Bruteforce)
- **FR-0.2.1**: Halaman login dilengkapi **Captcha Challenge** dinamis sebelum formulir dapat dikirimkan.
- **FR-0.2.2**: Captcha dibuat secara prosedural (distorsi teks SVG dengan noise garis/titik atau kuis logika matematika berwaktu) tanpa bergantung pada layanan cloud pihak ketiga yang melacak data (seperti Google reCAPTCHA) agar privasi terjaga dan tetap berfungsi di jaringan tertutup/on-premise.
- **FR-0.2.3**: Dilengkapi tombol *Regenerate/Refresh Captcha* jika kode sulit terbaca, serta masa kedaluwarsa token captcha (3 menit).
- **FR-0.2.4**: Mekanisme penguncian sementara (*temporary lockout*) setelah 5 kali kegagalan login berturut-turut.

---

### MODUL 2: Electoral & Voter Intelligence (Fitur 2)

#### 2.1 Peta Elektoral Indonesia 3 Periode (GIS Electoral Map)
- **FR-2.1.1**: Peta vektor interaktif 38 Provinsi Indonesia (dan tingkat Kabupaten/Kota) dengan data pemilu resmi:
  - **Pemilu 2014**: Pilpres (Jokowi-JK vs Prabowo-Hatta), Pileg DPR RI (Nasional & Dapil).
  - **Pemilu 2019**: Pilpres (Jokowi-Ma'ruf vs Prabowo-Sandi), Pileg DPR RI.
  - **Pemilu 2024**: Pilpres (Anies-Muhaimin, Prabowo-Gibran, Ganjar-Mahfud), Pileg DPR RI.
- **FR-2.1.2**: Data Demografi DPT: Jumlah DPT per daerah, DPT Generasi (Gen Z, Milenial, Gen X, Boomer), tingkat partisipasi pemilih (*voter turnout*), dan angka golput.

#### 2.2 Persebaran Suara Parpol & Pemenang Pemilu
- **FR-2.2.1**: **Peta Dominasi Parpol**: Pewarnaan wilayah berdasarkan partai pemenang suara terbanyak di daerah tersebut (PDIP: Merah, Golkar: Kuning, Gerindra: Biru Muda/Garuda, PKB: Hijau Tua, NasDem: Biru Dongker, PKS: Oranye/Putih, Demokrat: Biru Bintang, PAN: Biru Surya, PPP: Hijau Ka'bah, dll).
- **FR-2.2.2**: **Matriks Pemenang Eksekutif vs Legislatif**:
  - Membandingkan afiliasi partai dari Kepala Daerah (Gubernur/Bupati terpilih) dengan komposisi kursi mayoritas di parlemen daerah (DPRD) dan DPR-RI.
  - Deteksi fenomena *Split-Ticket Voting* (di mana warga memilih capres A namun memilih partai pengusung B).

#### 2.3 Karakteristik Pemilih: Loyalis vs Swing Voters (Voter Profiling)
- **FR-2.3.1**: **Party Loyalty Index (Indeks Basis Loyalis)**:
  - Menandai wilayah yang stabil (*stronghold*): Wilayah yang memenangkan partai yang sama dalam 3 periode berturut-turut dengan variasi suara < 8%.
  - Contoh: Basis PDIP di Jawa Tengah & Bali; Basis Golkar di Sulsel & Kalsel; Basis PKS/Nasdem di Sumbar/Aceh.
- **FR-2.3.2**: **Swing Voter Volatility Index (Pedersen Index)**:
  - Mengukur perpindahan agregat suara antar-partai antar-pemilu di setiap kabupaten/kota.
  - Formula: $\text{Pedersen Index} = \frac{1}{2} \sum_{i=1}^n |P_{i, t} - P_{i, t-1}|$
  - Mengkategorikan wilayah menjadi: **Kandang Kuat (Loyalis)**, **Medan Perebutan Sengit (Battleground / High Swing)**, dan **Wilayah Anomali**.
- **FR-2.3.3**: **Karakteristik & Preferensi Sosio-Ekologis**:
  - Profiling masyarakat daerah: Tipologi Urban vs Rural, persentase angkatan kerja/pertanian/industri, indeks pendidikan, dan pengaruh figur lokal/tokoh adat/agama.

#### 2.4 Korelasi Isu Berita Pemilu (News Impact Timeline)
- **FR-2.4.1**: Menampilkan linimasa berita penting pemilu pada periode terkait (misal: isu bansos 2024, isu politik identitas 2019, isu BBM & infrastruktur 2014).
- **FR-2.4.2**: Visualisasi korelasi: Menampilkan bagaimana gelombang berita tertentu di suatu masa beriringan dengan kenaikan/kejatuhan elektabilitas di provinsi terkait.

---

## 4. Arsitektur Data PocketBase (Schema Design)

PocketBase bertindak sebagai backend microservice dan basis data relasional SQLite:

```
[Collections di PocketBase]
├── users (Admin, Analyst, Viewer)
├── media_sources (Konfigurasi sumber media: x, news, youtube, tiktok)
├── monitored_topics (Daftar topik / isu yang dipantau)
├── media_posts (Postingan media publik, sentiment, coordinates, author)
├── post_amplifications (Relasi graph: parent_post_id -> child_post_id, delay_sec, similarity)
├── electoral_regions (Data 38 Provinsi & 514 Kab/Kota, GeoJSON code, DPT)
├── election_presidential (Hasil Pilpres 2014, 2019, 2024 per region)
├── election_legislative (Hasil suara per parpol 2014, 2019, 2024 per region)
├── voter_profiles (Skor loyalis, swing index, karakteristik masyarakat)
└── election_news_archive (Arsip berita penting pemilu 3 periode)
```

### Rincian Skema Koleksi Utama:

1. **`monitored_topics`**:
   - `id` (text, PK)
   - `title` (text): Judul isu (misal: "Isu Kenaikan PPN 12%", "Pilpres 2024 Debat Capres")
   - `keywords` (json): Array kata kunci & tagar `["PPN 12", "pajak naik", "#TolakPPN12"]`
   - `query` (text, opsional): Kueri boolean `AND`/`OR`/`NOT`/`"frasa"`/kurung; jika diisi menggantikan `keywords` saat perayapan (FR-1.1.2)
   - `entity_filter` (json, opsional): Entitas tokoh/organisasi yang wajib muncul di konten (FR-1.1.2)
   - `is_trending` (bool): Apakah terdeteksi dari burst trending
   - `status` (select): `active`, `paused`, `archived`
   - `media_filter` (json): Array kanal aktif `["news", "x", "youtube"]`

2. **`media_posts`**:
   - `id` (text, PK)
   - `topic_id` (relation -> `monitored_topics`)
   - `platform` (select): `news`, `threads`, `x`, `youtube`, `tiktok`, `forum`
   - `external_id` (text): ID unik di platform asal
   - `author_handle` (text): Username publik
   - `author_name` (text): Display name
   - `content` (text): Teks isi berita/postingan
   - `url` (text): Tautan asli
   - `published_at` (datetime): Waktu publikasi presisi detik
   - `is_origin` (bool): Apakah ini akun pemantik pertama
   - `sentiment` (select): `positive`, `neutral`, `negative`
   - `sentiment_score` (float): Keyakinan -1.0 s/d +1.0
   - `province_id` (text): Entitas wilayah terdeteksi
   - `reach` / `engagement` (int): Jumlah share, likes, views

3. **`post_amplifications`**:
   - `id` (text, PK)
   - `origin_post_id` (relation -> `media_posts`): Node asal (pemantik)
   - `source_post_id` (relation -> `media_posts`): Node penyebar langsung
   - `amplified_post_id` (relation -> `media_posts`): Node yang menyebarkan ulang
   - `propagation_time_sec` (int): Selisih detik dari pemantik awal
   - `similarity_score` (float): Kemiripan teks (0.0 s/d 1.0)
   - `amplification_type` (select): `retweet`, `quote`, `repost_manual`, `news_coverage`

4. **`electoral_regions`**:
   - `id` (text, PK): Kode Kemendagri / BPS (misal: "32" untuk Jabar, "3204" untuk Kab. Bandung)
   - `name` (text): Nama wilayah
   - `level` (select): `province`, `city_regency`
   - `parent_id` (relation): Provinsi induk jika level regency
   - `geojson_key` (text): Kunci mapping shapefile
   - `dpt_2014`, `dpt_2019`, `dpt_2024` (int): Jumlah DPT
   - `turnout_2014`, `turnout_2019`, `turnout_2024` (float): % partisipasi

5. **`election_legislative`**:
   - `id` (text, PK)
   - `region_id` (relation -> `electoral_regions`)
   - `year` (int): 2014, 2019, atau 2024
   - `party_code` (text): `PDIP`, `GOLKAR`, `GERINDRA`, `PKB`, `PKS`, `NASDEM`, `DEMOKRAT`, `PAN`, `PPP`, dll.
   - `vote_count` (int): Jumlah suara sah parpol
   - `vote_percentage` (float): Persentase suara di daerah tersebut
   - `seats_won` (int): Jumlah kursi legislatif yang didapat
   - `is_winner` (bool): Apakah peraih suara terbanyak

6. **`voter_profiles`**:
   - `id` (text, PK)
   - `region_id` (relation -> `electoral_regions`)
   - `loyalty_party` (text): Partai yang konsisten memenangkan daerah (jika ada)
   - `loyalty_score` (float): 0.0 - 1.0 (tingkat kesetiaan pemilih)
   - `swing_index` (float): Pedersen Volatility Index (semakin tinggi, semakin mengambang)
   - `classification` (select): `stronghold`, `battleground`, `leaning_loyal`, `unstable`
   - `dominant_demography` (text): Karakteristik mayoritas (misal: "Urban Industri, Milenial 48%, Isu Utama: Lapangan Kerja & Biaya Hidup")
   - `key_influencing_factors` (json): Array faktor penentu pilihan

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Performa & Latensi**:
   - Waktu muat awal dashboard (First Contentful Paint) < 1.5 detik.
   - Performa render peta Indonesia Leaflet 38 provinsi tanpa lag (60 FPS saat pan & zoom).
   - Graf visualisasi mampu merender hingga 500 node relasi duplikasi secara mulus di browser.
2. **Offline First & Portable**:
   - PocketBase dapat dijalankan sebagai *single executable* dengan basis data SQLite lokal, memudahkan portabilitas tanpa ketergantungan cloud kompleks.
3. **Aksesibilitas & Kerapian (Impeccable Design Standard)**:
   - Kontras warna mematuhi standar WCAG AA.
   - Tipografi yang sangat nyaman dibaca (*humanist and high legibility*).
   - Layout responsif optimal di layar desktop 1920x1080, 1440x900, dan tablet.

---

## 6. Kriteria Penerimaan (Acceptance Criteria)

- [x] **AC-1**: Pengguna dapat melihat daftar trending issue dan membuat topik monitoring kustom dengan kata kunci pilihan.
- [x] **AC-2**: Sistem menampilkan profil akun pemantik (*origin*) lengkap dengan *timestamp zero* dan visualisasi graf penyebaran (*amplification tree*).
- [x] **AC-3**: Pengguna dapat mematikan/menyalakan kanal media spesifik (misal hanya memantau Portal Berita & X, tanpa YouTube).
- [x] **AC-4**: Peta Indonesia menampilkan intensitas sebaran isu per provinsi secara akurat.
- [x] **AC-5**: Peta pemilu memungkinkan navigasi antar-tahun (2014, 2019, 2024) dan menampilkan warna partai pemenang per provinsi.
- [x] **AC-6**: Sistem menampilkan klasifikasi *Loyalis vs Swing Voters* dengan skor volatilitas Pedersen yang terhitung matematis.
- [x] **AC-7**: Data tersimpan dan tersinkronisasi dengan PocketBase melalui REST API dan SSE Realtime.

---

## 7. Konfigurasi Port Jaringan & Lingkungan Operasional

Untuk mencegah konflik port pada server staging/lokal, sistem menetapkan alokasi port resmi sebagai berikut:

| Komponen Sistem | Protokol | Port Resmi | URL Akses Default | File Konfigurasi |
|---|---|---|---|---|
| **Frontend Nuxt 3 (SSR/Vite)** | HTTP | **`3020`** | `http://localhost:3020` | `nuxt.config.ts` (`devServer.port`), `package.json` |
| **Backend PocketBase (SQLite/SSE)** | HTTP | **`8290`** | `http://127.0.0.1:8290` | `lib/pocketbase.ts`, `scripts/setup-pocketbase.sh` |
| **Admin PocketBase Dashboard** | HTTP | **`8290`** | `http://127.0.0.1:8290/_/` | Native PocketBase UI |
