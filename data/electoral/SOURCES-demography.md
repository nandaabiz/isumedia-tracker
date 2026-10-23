# Sumber Data Demografi BPS per Provinsi

File data: `demography.json`. Semua angka diambil langsung dari tabel resmi Badan Pusat Statistik (BPS); tidak ada angka yang diperkirakan, diinterpolasi, atau diisi manual. Bila suatu provinsi/tahun tidak ada di tabel sumber, key-nya tidak ditulis.

Struktur: `{ "<indikator>": { "boundary"?: "pre2022", "data": { "<tahunAcuan>": { "<kodeProvinsi>": nilai, "ID": nilaiNasional } } } }`.

- Kode provinsi = kode di `provinces.json`. Kode BPS untuk Papua berbeda dan dipetakan: BPS `91` Papua Barat → `92`, `92` Papua Barat Daya → `96`, `94` Papua → `91`, `95` Papua Selatan → `93`, `96` Papua Tengah → `94`, `97` Papua Pegunungan → `95`.
- `ID` = angka nasional (baris INDONESIA) pada tabel dan tahun yang sama, dipakai sebagai pembanding.
- Tahun acuan ≤ 2021 untuk `91` (Papua) dan `92` (Papua Barat) memakai batas **sebelum** pemekaran 2022, sama seperti data pemilu 2014/2019 kedua provinsi itu. `boundary: "pre2022"` menandai tabel yang seluruh tahunnya memakai batas lama (proyeksi 2013).

## Pemilihan tahun acuan (lib/demography.ts)

Untuk tiap pemilu (2014, 2019, 2024) dan indikator, aplikasi memilih tahun acuan **terdekat**; bila berjarak sama, dipilih yang lebih awal. Tahun acuan yang berjarak lebih dari 4 tahun tidak dipakai (`MAX_REF_YEAR_GAP`), dan angka `91`/`92` hanya dipakai bila batas wilayahnya sama dengan batas wilayah data pemilu. Tahun acuan selalu ditampilkan di UI dan PDF.

| Indikator | Tahun tersedia | Pemilu 2014 | Pemilu 2019 | Pemilu 2024 |
|---|---|---|---|---|
| % penduduk perkotaan (proyeksi) | 2015, 2020, 2025 | 2015 | 2020 | 2025 (kecuali 6 provinsi Papua) |
| IPM, RLS, HLS | 2014, 2019, 2024 | 2014 | 2019 | 2024 |
| Generasi | 2020 (SP2020), 2025 (SUPAS) | — | 2020 | 2025 |
| Lapangan pekerjaan | 2021, 2024 (Agustus) | — | 2021 | 2024 |

## 1. Persentase penduduk perkotaan (`urbanPercentage`)

BPS, tabel statis "Persentase Penduduk Daerah Perkotaan Hasil Proyeksi Penduduk menurut Provinsi, 2015 - 2035" (subjek Kependudukan dan Migrasi):
`https://www.bps.go.id/id/statistics-table/1/MTI3NiMx/persentase-penduduk-daerah-perkotaan-hasil-proyeksi-penduduk-menurut-provinsi-2015---2035.html`

- Ini **angka proyeksi** (Proyeksi Penduduk Indonesia 2010–2035, berbasis SP2010), bukan hasil sensus. Kolom 2015, 2020, dan 2025 dipakai; tanda desimal koma dikonversi ke titik.
- Tabel memuat 33 provinsi + Indonesia. **Kalimantan Utara (`65`) tidak ada** (masih tergabung Kalimantan Timur saat proyeksi disusun), jadi dikosongkan untuk semua tahun.
- Papua `91` dan Papua Barat `92` memakai batas sebelum pemekaran, sehingga **tidak dipakai untuk Pemilu 2024**. Empat provinsi baru (`93`–`96`) tidak ada di tabel. Untuk 2024, enam provinsi Papua tidak memiliki angka perkotaan.
- Tidak ditemukan tabel BPS yang lebih baru untuk indikator ini dengan cakupan 38 provinsi. Tabel SUPAS 2025 yang dicek (`https://direktori.web.bps.go.id/supas2025`) tidak memuat persentase perkotaan.
- Tipologi urban/transisi/rural di aplikasi adalah turunan aplikasi, bukan klasifikasi BPS: ≥ 60% urban, 40–60% transisi, < 40% rural.

## 2. IPM, rata-rata lama sekolah, harapan lama sekolah

Tabel dinamis BPS (metode baru), diambil per tahun 2014, 2019, dan 2024:

| Key | Variabel BPS | URL |
|---|---|---|
| `hdi` | 494 "[Metode Baru] Indeks Pembangunan Manusia (IPM) menurut Provinsi" | `https://www.bps.go.id/id/statistics-table/2/NDk0IzI=/-metode-baru--indeks-pembangunan-manusia-menurut-provinsi.html` |
| `meanYearsSchooling` | 415 "[Metode Baru] Rata-rata Lama Sekolah" (tahun) | `https://www.bps.go.id/id/statistics-table/2/NDE1IzI=/-metode-baru--rata-rata-lama-sekolah.html` |
| `expectedYearsSchooling` | 417 "[Metode Baru] Harapan Lama Sekolah" (tahun) | `https://www.bps.go.id/id/statistics-table/2/NDE3IzI=/-metode-baru--harapan-lama-sekolah.html` |

- Cara ambil: halaman tabel memanggil aksi server Next.js dengan body `[{"locale":"id","id":"<base64 '494#2'>","year":"<114|119|124>"}]` (kode tahun = tahun − 1900). Respons berisi JSON standar WebAPI BPS (`vervar`, `datacontent`). Hanya baris provinsi (kode `xx00`) dan INDONESIA (`9999`) yang diambil.
- Pembaruan terakhir tabel saat diambil (Oktober 2026): IPM 15-05-2025, RLS & HLS 05-11-2025.
- 2014 dan 2019: 34 provinsi (termasuk Kalimantan Utara, yang sudah dihitung BPS sejak 2014 walau data pemilu 2014-nya masih tergabung Kaltim). 2024: 38 provinsi.
- **Indeks pendidikan** tidak disimpan; aplikasi menghitungnya dengan rumus komponen pendidikan IPM metode baru BPS: `(RLS/15 + HLS/18) / 2 × 100`, dengan RLS dibatasi 15 dan HLS dibatasi 18.

## 3. Struktur generasi (`generations`)

Jumlah penduduk (laki-laki + perempuan) per generasi BPS: Post Gen Z (lahir ≥ 2013), Gen Z (1997–2012), Milenial (1981–1996), Gen X (1965–1980), Boomer (1946–1964), Pre-Boomer (≤ 1945).

**2020 — Sensus Penduduk 2020.** Portal sensus BPS, "Jumlah Penduduk menurut Wilayah, Klasifikasi Generasi, dan Jenis Kelamin" (indikator 3873930), JSON:
`https://sensus.bps.go.id/topik/tabular/sp2020/2/1/3`
34 provinsi (batas 2020) + Indonesia. Jumlah 34 provinsi = total nasional 270.203.917 (selisih 0). Generasi "Tidak diketahui" bernilai kosong di semua provinsi.

**2025 — SUPAS 2025.** Dasbor resmi "Indikator Kependudukan SUPAS 2025" (`https://direktori.web.bps.go.id/supas2025`, Metabase BPS dashboard 583), kartu "Persentase Penduduk Menurut Generasi" (card 3215) dengan filter Provinsi diisi nama tiap provinsi. Nilainya jumlah penduduk per generasi (estimasi survei, dibulatkan ke orang). 38 provinsi + Indonesia. Jumlah 38 provinsi = total nasional 284.667.253 (selisih per generasi ≤ 2 orang karena pembulatan).

Persentase dihitung aplikasi terhadap total penduduk semua umur, jadi Gen Z mencakup penduduk yang belum berusia pemilih. Ini profil penduduk, bukan profil DPT (data DPT per generasi per provinsi belum tersedia di sumber terbuka).

## 4. Lapangan pekerjaan utama (`employment`)

BPS, tabel dinamis variabel 2333 "Penduduk Berumur 15 Tahun Keatas yang Bekerja Selama Seminggu Terakhir Menurut Provinsi dan Lapangan Usaha" (orang), Sakernas **Agustus**:
`https://www.bps.go.id/id/statistics-table/2/MjMzMyMy/penduduk-berumur-15-tahun-keatas-yang-bekerja-selama-seminggu-terakhir-menurut-provinsi-dan-lapangan-usaha--orang-.html`

- Disimpan sebagai persentase: jumlah pekerja per sektor ÷ baris "Total" × 100 (dua desimal). Label sektor = label BPS tanpa huruf kode KBLI (A, B, …).
- Tabel ini hanya tersedia per provinsi untuk 2021–2025. Tabel BPS lain dengan rincian sektor ("Penduduk 15 Tahun Ke Atas yang Bekerja menurut Lapangan Pekerjaan Utama 1986 - 2024", dsb.) hanya tingkat nasional.
- **Pemilu 2014: dikosongkan** (tidak ada tabel provinsi dalam jarak 4 tahun). **Pemilu 2019 memakai Agustus 2021** (terdekat yang tersedia); catatan: 2021 masih masa pandemi COVID-19, sehingga porsi pertanian cenderung lebih tinggi daripada kondisi 2019.
- 2021: 34 provinsi (Papua/Papua Barat batas lama; empat provinsi baru kosong di tabel). 2024: 38 provinsi.
- Sel kosong di tabel BPS (RSE ≥ 50%) tidak diisi. Jumlah persentase per provinsi tetap 99,98–100,02 sehingga dampaknya kecil.

## Yang tidak dipakai

- `data/electoral/analyst-notes.json` (catatan analis lama untuk 7 provinsi, angka belum terverifikasi) sudah dihapus dan diganti data di atas.
- Proyeksi perkotaan tidak diinterpolasi ke 2014/2019/2024; aplikasi menampilkan tahun acuan aslinya (2015/2020/2025).
