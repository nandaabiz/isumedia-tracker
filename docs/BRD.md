# Business Requirements Document (BRD)
## Project: Platform Intelijen Media & Analitik Pemilu (IsuMedia Tracker & Electoral Intel)
**Document Version:** 1.0.0  
**Status:** Approved for Design & Architecture  
**Target Release:** Q4 2026 / 2027  
**Author:** Antigravity Solution Architecture Team  

---

## 1. Executive Summary & Latar Belakang Bisnis

Dalam dinamika sosial-politik Indonesia kontemporer, dua tantangan utama dihadapi oleh lembaga riset, konsultan komunikasi publik, instansi pemerintah, dan pengambil kebijakan strategis:
1. **Kecepatan & Disinformasi Media Sosial Publik**: Isu publik dan narasi berkembang secara viral dalam hitungan menit. Seringkali sulit membedakan apakah sebuah isu muncul secara organik dari masyarakat lokal, atau dipantik oleh kelompok tertentu (*buzzer/amplifier network*). Organisasi memerlukan instrumen pemantau yang mampu melacak *titik awal pemantik (origin)*, akun yang menduplikasi/mengamplifikasi, sebaran kewilayahan, serta pergeseran sentimen publik.
2. **Kebutuhan Analisis Lanskap Pemilu Berbasis Bukti Historis**: Data elektoral KPU dan Bawaslu dari 3 periode pemilu terakhir (2014, 2019, 2024) serta dinamika Pilkada tersebar dalam format yang terfragmentasi. Pemangku kepentingan kesulitan memetakan secara holistik: di mana basis pemilih loyalis (*strongholds*), di mana medan pertempuran suara mengambang (*swing voters / battlegrounds*), dan bagaimana isu-isu berita lokal/nasional memengaruhi migrasi suara pemilih.

Platform **IsuMedia Tracker & Electoral Intelligence** dirancang untuk menjawab kedua kebutuhan ini dalam satu ekosistem intelijen data yang terintegrasi, netral, transparan, dan humanis.

---

## 2. Sasaran & Tujuan Bisnis (Business Objectives)

| ID | Sasaran Bisnis | Key Performance Indicator (KPI) / Metrik Keberhasilan |
|---|---|---|
| **BO-01** | Deteksi Dini & Rekonstruksi Isu Publik | Mampu mendeteksi lonjakan isu publik dan mengidentifikasi *timestamp zero* (akun pemantik) serta klaster duplikasi dalam waktu < 5 menit dari indeks data. |
| **BO-02** | Geotargeting & Sebaran Daerah Isu | Mengidentifikasi persebaran pembicaraan isu hingga level 38 Provinsi dan 514 Kabupaten/Kota dengan akurasi pemetaan entitas wilayah > 85%. |
| **BO-03** | Konsolidasi Data Pemilu 3 Periode (2014-2024) | Mengintegrasikan 100% data resmi perolehan suara Pilpres, Pileg DPR RI, dan Pilkada dari KPU & Bawaslu 3 periode dalam visualisasi GIS interaktif. |
| **BO-04** | Segmentasi Karakteristik Pemilih (Loyalis vs Swing) | Menyediakan model komputasi *Electoral Volatility Index* untuk mengklasifikasikan wilayah loyalis partai vs wilayah rentan berpindah pilihan (*contestable areas*). |
| **BO-05** | Korelasi Narasi Media & Perilaku Pemilih | Menghubungkan tren sentimen berita historis pada masa kampanye dengan fluktuasi perolehan suara di daerah terkait. |
| **BO-06** | Efisiensi & Kemandirian Infrastruktur | Sistem dapat dijalankan mandiri (*self-hosted* / on-premise / private cloud) dengan footprint ringan menggunakan Nuxt.js dan PocketBase tanpa biaya lisensi database enterprise yang mahal. |

---

## 3. Pemangku Kepentingan (Stakeholders) & Peran Pengguna

| Pemangku Kepentingan | Peran & Kebutuhan Utama |
|---|---|
| **Analis Kebijakan / Government Affairs** | Memantau sentimen publik terhadap kebijakan yang baru diluncurkan; memitigasi krisis informasi sebelum eskalasi ke ranah publik. |
| **Konsultan Politik & Tim Kampanye** | Memetakan daerah *battleground*, mengukur efektivitas narasi kampanye, dan memprediksi pergerakan suara mengambang (*swing voters*). |
| **Lembaga Riset / Think Tank / Akademisi** | Melakukan kajian komparatif sosiologi politik 3 periode pemilu dan studi difusi informasi di media sosial. |
| **Media & Jurnalis Investigasi Data** | Membongkar pola amplifikasi akun robot/bot dalam menggoreng isu tertentu, memverifikasi klaim pemilu berbasis data historis resmi. |
| **Organisasi Pengawas Pemilu (Civil Society / Bawaslu)** | Mengaudit anomali hasil suara, sengketa pemilu historis, dan pola ujaran kebencian/disinformasi di masa pemilu. |

---

## 4. Ruang Lingkup Bisnis (Business Scope)

### 4.1 In Scope
- **Pemantauan Media Sosial & Berita Publik**:
  - Hanya merayapi dan menganalisis konten akun publik (X/Twitter, Portal Berita Online RSS, YouTube publik, forum publik).
  - Mengabaikan akun pribadi/privat (menjaga privasi masyarakat).
  - Konfigurasi kanal media yang ingin dipantau (on/off toggle per jenis media).
- **Pelacakan Pemantik & Duplikasi**:
  - Deteksi akun pertama yang memublikasikan isu/kata kunci.
  - Pemetaan akun-akun penerus dan klaster amplifikasi (jaringan relasi graf).
- **Analisis Geografis Isu**:
  - Pemetaan isu ke wilayah administrasi Indonesia (Provinsi dan Kab/Kota).
- **Analisis Elektoral 3 Periode**:
  - Visualisasi DPT, hasil Pilpres 2014, 2019, 2024.
  - Visualisasi Pileg DPR RI & perolehan suara parpol.
  - Komparasi eksekutif (Gubernur/Bupati) vs legislatif (kursi partai pemenang).
  - Analisis *Loyalty vs Swing Voters* (Indeks Volatilitas).
  - Timeline berita pemilu yang menyertai pergeseran suara.

### 4.2 Out of Scope
- Scraping akun privat, grup tertutup (WhatsApp/Telegram group privat), atau pesan langsung (DM).
- Manipulasi atau intervensi bot aktif (aplikasi murni bersifat *listening & analytic*, bukan *broadcasting* atau manipulasi opini).
- Penggantian sistem tabulasi resmi KPU (aplikasi bersifat instrumen analisis historis dan riset, bukan server rekapitulasi KPU).

---

## 5. Batasan Kepatuhan, Etika, dan Regulasi (Compliance & Ethics)

1. **UU Perlindungan Data Pribadi (UU PDP No. 27/2022)**:
   - Tidak menyimpan identitas pribadi warga (*PII*) di luar username publik yang secara sadar mempublikasikan konten ke ruang umum.
   - Pengecualian mutlak pada akun privat.
2. **Kepatuhan Data Pemilu**:
   - Sumber data elektoral harus merujuk pada ketetapan resmi KPU (form C1/D-Hasil/SK KPU) dan putusan sengketa Bawaslu/MK untuk menjamin validitas dan nir-disinformasi.
3. **Prinsip Kenetralan & Humanisme**:
   - Sistem tidak dirancang untuk menguntungkan parpol atau figur tertentu. Bobot algoritma loyalis/swing voter didasarkan pada rumus matematis volatilitas Pedersen (*Pedersen Volatility Index*) dan data agregat statistik resmi.

---

## 6. Model Nilai & Dampak (Business Value & ROI)

- **Akurasi Keputusan Strategis**: Mengurangi margin kesalahan dalam pengalokasian sumber daya kampanye atau sosialisasi kebijakan hingga 40% melalui penentuan target daerah *swing voter* yang tepat.
- **Respon Krisis Cepat**: Memangkas waktu identifikasi isu negatif atau hoaks dari hitungan hari menjadi hitungan menit sebelum mencapai media arus utama.
- **Total Cost of Ownership (TCO) Rendah**: Arsitektur Nuxt 3 + PocketBase memungkinkan *deployment* hemat biaya di satu server VPS/dedicated lokal tanpa lisensi mahal cloud berbayar per-kueri.
