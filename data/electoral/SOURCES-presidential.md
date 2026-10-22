# Sumber data Pilpres, DPT, dan provinsi

Dikumpulkan 2026-10-22. Semua angka diambil dari dokumen yang diunduh. Tidak ada angka yang diperkirakan.
Suara luar negeri tidak dimasukkan ke file mana pun.

## File

| File | Isi | Cakupan |
|---|---|---|
| `provinces.json` | 38 provinsi: kode Kemendagri, nama, kelompok pulau, ibu kota, koordinat ibu kota `[lat, lng]` | 38 |
| `presidential.json` | Suara sah per pasangan calon per provinsi, plus `totalValidVotes` | 2014: 33, 2019: 34, 2024: 38 |
| `voters.json` | `dpt`, `turnoutPct`, `turnoutVoters` (jumlah pengguna hak pilih) per provinsi | 2014: 33, 2019: 34, 2024: 38 |

## Sumber per tahun

### 2014
- **Suara, DPT, dan pengguna hak pilih (primer, resmi KPU):** "PPWP - Nasional Rekapitulasi 2014 - New - Final 2014 07 22" (KPU, 22 Juli 2014). URL asli `http://kpu.go.id/koleksigambar/PPWP_-_Nasional_Rekapitulasi_2014_-_New_-_Final_2014_07_22.pdf`, diunduh dari arsip:
  `https://web.archive.org/web/20141021053918id_/http://kpu.go.id/koleksigambar/PPWP_-_Nasional_Rekapitulasi_2014_-_New_-_Final_2014_07_22.pdf`
  - Suara per provinsi: tabel "Hasil Penghitungan Perolehan Suara dari Setiap Provinsi" (hal. ringkasan, ada nama provinsi). Angkanya dicocokkan dengan sertifikat DC PPWP (hal. 1-6, bagian IV "Rincian Jumlah Perolehan Suara" dan III "Jumlah Suara Sah"). Hasilnya identik untuk 33 provinsi.
  - DPT = baris A.1 "Jumlah pemilih terdaftar dalam DPT" (JML). `turnoutVoters` = baris B.5 "Jumlah seluruh pengguna hak pilih" (JML).
- **Pembanding:** en.wikipedia `2014_Indonesian_presidential_election`, bagian `====National====` (mengutip Kompas.com, 22-07-2014). Ke-33 provinsi identik. id.wikipedia `Pemilihan_umum_Presiden_Indonesia_2014` juga mengutip PDF KPU yang sama.
- **Kalimantan Utara:** pada 2014 provinsi ini masih digabung dengan Kalimantan Timur di sumber KPU (catatan en.wikipedia: "including North Kalimantan"). Datanya disimpan di kode `64` saja; kode `65` tidak ada untuk 2014.

### 2019
- **Suara (primer, resmi KPU):** KPU Open Data ds/140 "Rekapitulasi Hasil Perolehan Suara Pemilihan Presiden dan Wakil Presiden Pada Pemilu Tahun 2019". Halaman `https://opendata.kpu.go.id/ds/140`, file `https://opendata.kpu.go.id/uploads/file_dataset/1736221947_9d3a3587d8904792a9b3.xlsx`. Kolom `NOMOR 01` = Jokowi - Ma'ruf, `NOMOR 02` = Prabowo - Sandi. Berisi 34 provinsi, termasuk Kalimantan Utara, plus baris Luar Negeri.
  - `totalValidVotes` = 01 + 02. Nilai ini dicocokkan dengan kolom `SUARA SAH` di ds/106 dan identik untuk 34 provinsi.
- **DPT & partisipasi (resmi KPU):** ds/106 "Data Partisipasi Masyarakat pada Pemilu Pilpres Tahun 2019", `https://opendata.kpu.go.id/ds/106`, file `https://opendata.kpu.go.id/uploads/file_dataset/1736157409_09ebcdc530997e3c3b2b.csv`. Kolom yang dipakai: `DPT (JML)`, `PENGGUNA HAK PILIH (DPT+DPTb+DPK) (JML)`, dan `TINGKAT PARMAS (%) (JML)`.
  - DPT dicocokkan dengan ds/77 "Rekapitulasi Per Provinsi DPT Pemilu Tahun 2019" (`https://opendata.kpu.go.id/uploads/file_dataset/1736148214_26b03aa19024ae6fdd64.csv`) dan identik untuk 34 provinsi.
  - Dataset ds/86 (partisipasi DPR RI 2019, per dapil) juga diunduh, tetapi tidak dipakai karena bukan data Pilpres.
- **Pembanding:** en.wikipedia `2019_Indonesian_presidential_election`, bagian "====By province====" (mengutip Tempo, 21-05-2019). Ke-34 provinsi identik.

### 2024
- **Suara (primer, resmi KPU):** Lampiran I Keputusan KPU Nomor 360 Tahun 2024 (Berita Acara/Sertifikat rekap nasional DD1 PPWP). URL asli `https://sirekap-obj-formd.kpu.go.id/cfcd/pemilu/0_DD1_ppwp_0_1711041703_22002b1a-f74f-48e9-a48f-b57d9cca09d4.pdf`, diunduh dari arsip:
  `https://web.archive.org/web/20240326095311id_/https://sirekap-obj-formd.kpu.go.id/cfcd/pemilu/0_DD1_ppwp_0_1711041703_22002b1a-f74f-48e9-a48f-b57d9cca09d4.pdf` (hal. 1-2, 38 provinsi + Luar Negeri + TOTAL).
- **Partisipasi (resmi KPU):** Keputusan KPU Nomor 1043 Tahun 2024 tentang Tingkat Partisipasi Pemilih, Lampiran I.A (Pilpres). URL asli `https://jdih.kpu.go.id/data/data_kepkpu/2024kpt1043.pdf`, diunduh dari arsip `https://web.archive.org/web/2024id_/https://jdih.kpu.go.id/data/data_kepkpu/2024kpt1043.pdf`.
  - `turnoutVoters` = pengguna hak pilih DPT + DPTb + DPK (JUMLAH). `turnoutPct` = kolom "Tingkat Partisipasi (%) Keseluruhan".
- **DPT:** KPU Open Data ds/192 "Rekapitulasi Daftar Pemilih Tetap (DPT) Dalam Negeri Pemilu Tahun 2024" (Kpt KPU 857/2023). Halaman `https://opendata.kpu.go.id/ds/192`, file `https://opendata.kpu.go.id/uploads/file_dataset/1791189526_fa299195b1bff0b7499d.csv`. Kolom DPT pada Kpt 1043 identik untuk 38 provinsi.
- **Pembanding:** en.wikipedia `2024_Indonesian_presidential_election`, bagian "=== By province ===" (mengutip sertifikat KPU yang sama). Ke-38 provinsi identik.

### provinces.json
- **Kode dan nama:** daftar kode Kemendagri dari instruksi tugas.
- **Kelompok pulau:** 11-21 = Sumatera, 31-36 = Jawa, 51-53 = Bali-Nusa, 61-65 = Kalimantan, 71-76 = Sulawesi, 81-96 = Maluku-Papua.
- **Ibu kota:** dari field `capital`/`seat` infobox halaman provinsi di en.wikipedia (API `action=query&prop=revisions`).
- **Koordinat:** dari field `coordinates = {{coord|...}}` di infobox halaman ibu kota en.wikipedia. Ada 5 halaman yang infobox-nya mengambil koordinat dari Wikidata, yaitu Jakarta, Denpasar, Makassar, Gorontalo (city), dan Ambon, Maluku. Untuk kelima halaman ini dipakai koordinat primer GeoData (`prop=coordinates`), yaitu koordinat yang ditampilkan infobox. Pembulatan 4 desimal.
- **Catatan ibu kota:**
  - Papua Selatan: en.wikipedia mencantumkan "Salor, Merauke".
  - Papua Tengah: en.wikipedia mencantumkan "Wanggar, Nabire".
  - Papua Pegunungan: en.wikipedia mencantumkan "Jayawijaya".
  - Untuk ketiganya dipakai kota pusat pemerintahan Merauke, Nabire, dan Wamena, dengan koordinat dari halaman en.wikipedia masing-masing.
  - DKI Jakarta: ibu kota = "Jakarta", dengan koordinat halaman Jakarta.
  - Kalimantan Selatan: ibu kota = Banjarbaru (sesuai infobox, berlaku sejak UU 8/2022).

## Definisi `turnoutPct` (berbeda per tahun, mengikuti publikasi resmi KPU)

| Tahun | Rumus | Sumber |
|---|---|---|
| 2014 | pengguna hak pilih (B.5) / DPT (A.1) x 100 | Dihitung dari angka KPU, lalu dicocokkan dengan baris resmi "1. Jumlah Pemilih DPT vs 5. Jumlah Pengguna" di halaman Partisipasi Pemilih PDF KPU. Tidak ada selisih > 0,005 poin. |
| 2019 | pengguna hak pilih (DPT+DPTb+DPK) / DPT x 100 | Nilai `TINGKAT PARMAS (%) (JML)` dari ds/106 apa adanya. Sudah diverifikasi sama dengan hasil hitung ulang. |
| 2024 | pengguna hak pilih (DPT+DPTb+DPK) / (DPT + DPK) x 100 | Nilai resmi dari Kpt KPU 1043/2024 apa adanya. Sudah diverifikasi sama dengan hasil hitung ulang. |

Untuk analisis lintas tahun yang butuh rumus seragam, gunakan `turnoutVoters / dpt`.

## Verifikasi

**Total nasional (dalam negeri) vs penjumlahan provinsi**

| Tahun | Penjumlahan provinsi | Total resmi dalam negeri | Selisih |
|---|---|---|---|
| 2014 | Prabowo-Hatta 62.262.844; Jokowi-JK 70.633.576; sah 132.896.420 | Kolom "Dalam Negeri" di sertifikat KPU: 62.262.844 / 70.633.576 / 132.896.420. Nasional 62.576.444 / 70.997.833 dikurangi LN 313.600 / 364.257. | 0 |
| 2019 | Jokowi-Ma'ruf 85.036.828; Prabowo-Sandi 68.442.493; sah 153.479.321 | Nasional 85.607.362 / 68.650.239 (infobox en.wikipedia dan ds/106 JUMLAH suara sah 154.257.601) dikurangi LN 570.534 / 207.746. | 0 |
| 2024 | Anies 40.846.796; Prabowo 95.786.820; Ganjar 26.922.493; sah 163.556.109 | TOTAL Kpt 360/2024 40.971.906 / 96.214.691 / 27.040.878 / 164.227.475 dikurangi LN 125.110 / 427.871 / 118.385 / 671.366. | 0 |

**Pemeriksaan per provinsi dan DPT**
- Per provinsi, jumlah suara kandidat sama dengan `totalValidVotes` untuk semua provinsi dan semua tahun.
- Penjumlahan DPT dan pengguna hak pilih seluruh provinsi sama dengan total dalam negeri resmi:
  - 2014: 188.268.987 / 134.247.376
  - 2019: 190.779.466 / 157.165.462, yaitu ds/106 192.770.611 / 158.012.499 dikurangi LN 1.991.145 / 847.037
  - 2024: 203.056.748 / 167.713.621

## Anomali dan data yang tidak tersedia

- **2024 Sulawesi Barat (`76`), voters.json:** Kpt KPU 1043/2024 Lampiran I.A mencatat pengguna hak pilih DPT L dan P sama-sama 390.054. Akibatnya `turnoutVoters` (811.657) < suara sah Pilpres (819.424) dan partisipasi tercatat 80,71%. Pada tabel DPR di dokumen yang sama, angkanya L 390.089 dan P 410.582. Nilai resmi Pilpres tetap disimpan dan diberi field `note`. id.wikipedia (`Pemilihan_umum_Presiden_Indonesia_2024`) menulis 832.069 pemilih (82,74%), dihitung dari suara sah + tidak sah. Angka ini tidak dipakai karena bukan dataset partisipasi resmi.
- **2014 Kalimantan Utara (`65`):** tidak tersedia terpisah (digabung di `64`).
- **2014 & 2019 Papua Selatan / Tengah / Pegunungan / Barat Daya (`93`-`96`):** provinsi belum ada. Datanya termasuk di `91` (Papua) dan `92` (Papua Barat).
- **Suara tidak sah per provinsi:** tidak disimpan karena tidak diminta skema. Datanya tersedia di PDF KPU 2014 dan ds/106 2019.
- **Dataset partisipasi Pilpres 2014 dan 2024 di KPU Open Data:** tidak ada. Pemindaian judul ds/1-ds/300 tidak menemukan dataset Pilpres 2014 atau partisipasi Pilpres 2024, sehingga dipakai PDF resmi KPU di atas.

## Metode parsing

Script ada di scratchpad (`.../scratchpad/agent-pres/scripts/`), dijalankan dengan `python3 -I`, hanya memakai pustaka standar:

| Script | Fungsi |
|---|---|
| `pdftext.py`, `norm.py` | Dekompresi stream FlateDecode PDF dengan zlib. Membaca operator `Tj`/`TJ`, mengelompokkan baris berdasarkan posisi `Tm`/`Td`, dan menghapus byte `\x00` (teks UTF-16BE). |
| `xlsx.py` | Membaca xlsx sebagai zip/XML (`openpyxl` tidak tersedia). |
| `wt.py` | Parser tabel wikitext untuk pembanding Wikipedia. |
| `build.py` | Memetakan nama provinsi ke kode, membuat ketiga JSON, dan menjalankan semua verifikasi di atas. Log ada di `.../scratchpad/agent-pres/build_report.txt`. |
