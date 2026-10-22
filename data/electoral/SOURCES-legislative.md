# Sumber Data Pemilu Legislatif DPR RI (2014, 2019, 2024)

File data: `legislative.json`. Struktur: `{ "<tahun>": { "<kodeProvinsiKemendagri>": { "totalValidVotes": n, "parties": [ { "partyCode", "votes", "seats" } ] } } }`.

- `votes` = suara sah partai politik + suara sah seluruh caleg partai tersebut (baris "Jumlah Suara Sah Partai Politik dan Calon").
- `totalValidVotes` = jumlah suara sah seluruh partai nasional di provinsi (DPR RI tidak diikuti partai lokal Aceh, jadi tidak ada yang dibuang).
- Bila suara tidak tersedia, `votes` dan `totalValidVotes` tidak ditulis. Tidak ada nilai 0 yang dipakai sebagai pengganti "tidak tahu".
- `seats: 0` hanya ditulis bila sumber mencantumkan 0, atau bila partai mendapat 0 kursi secara nasional (misalnya PBB/PKPI 2014, partai di bawah ambang batas 2019/2024).
- **Suara luar negeri** masuk Dapil DKI Jakarta II, jadi tercatat di provinsi `31` (DKI Jakarta) pada ketiga tahun. Ini mengikuti pembagian dapil KPU. Kursi dapil tersebut juga dihitung di DKI.

## Ringkasan cakupan

| Tahun | Provinsi | Ada suara | Ada kursi | Total kursi |
|---|---|---|---|---|
| 2014 | 33 (Kaltara digabung ke Kaltim `64`) | 33 | 33 | 560 |
| 2019 | 34 | 33 (tanpa Kalimantan Selatan `63`) | 34 | 575 |
| 2024 | 38 | 38 | 38 | 580 |

Catatan: DPR 2019 berjumlah **575 kursi**, bukan 560. Penambahan 15 kursi berlaku sejak Pemilu 2019 (UU 7/2017). Total 560 hanya berlaku untuk 2014.

## 2014

**Suara (resmi KPU).** KPU, *Buku Data & Infografik Pemilu Anggota DPR RI & DPD RI 2014*, tabel "Perolehan Suara Parpol di tiap Provinsi" (Bagian IV, hlm. 32–33). PDF diunduh dari Google Drive yang dirujuk Wikipedia:
`https://drive.google.com/file/d/1wx04HuCWiWmo1R0dtSShyiWjxMb98d2i/view`
Teks diekstrak langsung dari content stream PDF. Tabel memuat 33 provinsi × 12 partai dan baris TOTAL.

**Kursi.** Wikipedia en, `2014_Indonesian_legislative_election`, bagian "=== By province ===" (sumber: Kompas.com, 13 Mei 2014):
`https://en.wikipedia.org/w/api.php?action=parse&page=2014_Indonesian_legislative_election&prop=wikitext&format=json&formatversion=2`
Sel PKB Kalimantan Tengah kosong di wikitext. Nilainya diisi 0 karena total provinsi (6) sudah habis dibagi partai lain (2+1+1+0+1+0+0+1+0 = 6).

**Verifikasi.**
- Jumlah suara 33 provinsi per partai = total nasional resmi (Wikipedia/KPU) dan = baris TOTAL tabel, **selisih 0 untuk ke-12 partai**.
- Jumlah kursi per partai = 560 dan sama dengan tabel nasional (PDIP 109, Golkar 91, Gerindra 73, Demokrat 61, PAN 49, PKB 47, PKS 40, PPP 39, NasDem 35, Hanura 16).
- Cek silang: alokasi kursi metode kuota Hare (BPP + sisa terbesar, ambang 3,5%) per dapil, memakai suara dapil `pemiluAPI/pemilu-data` (`results/2014/calon_legaslatif/totals/dapil_vote_totals-dpr.csv`, 77 dapil). Setelah dijumlah per provinsi, hasilnya identik dengan tabel kursi Wikipedia di 33/33 provinsi.
- Kaltara (`65`) belum ada sebagai dapil tahun 2014, sehingga datanya ada di Kaltim (`64`, 8 kursi).

**Sumber yang ditolak untuk suara 2014:** `pemiluAPI/pemilu-data` `provinsi_vote_totals-dpr.csv`. Selisihnya terhadap total nasional: Gerindra −0,53% dan PKS −0,73%, jadi melewati batas 0,5%. Penyebabnya kemungkinan suara luar negeri tidak dimasukkan (DKI kurang ±477 ribu). Ada juga selisih kecil di Riau, Sumsel, Jabar, NTB, dan Kalsel. Sumber ini hanya dipakai untuk cek silang kursi di atas.

## 2019

**Suara (resmi KPU).** KPU Open Data, dataset "Rekapitulasi Hasil Penghitungan Perolehan Suara Calon Anggota DPR RI Pemilu 2019 Daerah Pemilihan …" (formulir Model DD1-DPR, xlsx). Daftar dataset dari `https://opendata.kpu.go.id/ds?page=1..40`. ID yang dipakai (`https://opendata.kpu.go.id/ds/<id>`):
75, 83, 85, 87, 92, 98, 101, 102, 104, 107, 108, 113, 114, 118, 120, 126, 128, 129, 130, 133, 134, 142, 149, 150, 151, 152, 154, 161, 162, 165, 169, 170, 171, 172, 173, 174, 176, 177. ds/110 duplikat ds/108 (Bengkulu, file identik) dan tidak dipakai.
Totalnya 78 file dapil dari 80 dapil. Isi tiap file diambil dari kolom "JUMLAH AKHIR" pada baris "B. JUMLAH SUARA SAH PARTAI POLITIK DAN CALON (A.1+A.2)" per partai.
Tiga dapil (Papua, Sumut II, Sultra) dicetak dalam dua halaman kolom ("JUMLAH PINDAHAN" lalu "JUMLAH AKHIR"). Untuk dapil ini hanya nilai "JUMLAH AKHIR" yang diambil.

**Kursi (resmi KPU).** KPU Open Data ds/46 "Perolehan Kursi DPR RI Pemilu Tahun 2019" (xlsx, 80 dapil × 16 partai, total 575), dijumlah per provinsi.

**Verifikasi.**
- Per dapil: jumlah per kabupaten/kota = JUMLAH AKHIR untuk setiap partai, dan "Jumlah Seluruh Suara Sah" = jumlah 16 partai di 78/78 file.
- Alokasi Sainte-Laguë (ambang 4%, 9 partai) dari suara 78 dapil menghasilkan kursi per dapil yang **identik dengan ds/46 di 78/78 dapil**.
- Kursi per provinsi dari ds/46 identik dengan tabel "Seats won" Wikipedia `2019_Indonesian_general_election` di 34/34 provinsi. Total per partai = nasional (PDIP 128, Golkar 85, Gerindra 78, NasDem 59, PKB 58, Demokrat 54, PKS 50, PAN 44, PPP 19; total 575).
- Suara: jumlah 33 provinsi belum bisa sama dengan total nasional karena Kalsel tidak ada. Selisih total nasional resmi (Wikipedia/KPU 21 Mei 2019) dikurangi jumlah 33 provinsi:

| Partai | Σ 33 provinsi | Nasional | Selisih (= implied Kalsel) |
|---|---|---|---|
| PDIP | 26.719.565 | 27.053.961 | 334.396 (1,24%) |
| GERINDRA | 17.305.940 | 17.594.839 | 288.899 (1,64%) |
| GOLKAR | 16.886.645 | 17.229.789 | 343.144 (1,99%) |
| PKB | 13.387.639 | 13.570.097 | 182.458 (1,34%) |
| NASDEM | 12.561.955 | 12.661.792 | 99.837 (0,79%) |
| PKS | 11.290.440 | 11.493.663 | 203.223 (1,77%) |
| DEMOKRAT | 10.807.782 | 10.876.507 | 68.725 (0,63%) |
| PAN | 9.399.680 | 9.572.623 | 172.943 (1,81%) |
| PPP | 6.165.901 | 6.323.147 | 157.246 (2,49%) |
| PERINDO | 3.696.984 | 3.738.320 | 41.336 |
| BERKARYA | 2.874.938 | 2.929.495 | 54.557 |
| PSI | 2.633.454 | 2.650.361 | 16.907 |
| HANURA | 2.145.179 | 2.161.507 | 16.328 |
| PBB | 1.076.167 | 1.099.848 | 23.681 |
| GARUDA | 694.521 | 702.536 | 8.015 |
| PKPI | 308.463 | 312.775 | 4.312 |
| Total | 137.955.253 | 139.971.260 | 2.016.007 |

Selisih ini secara aritmetika adalah suara Kalsel (Kalsel I + II). Kebenarannya bergantung pada asumsi bahwa total nasional sama dengan jumlah 80 dapil, dan asumsi ini tidak bisa diverifikasi per dapil. Karena merupakan turunan, bukan data yang diunduh, angka residual **tidak disimpan** di JSON.

**Tidak tersedia:** suara DPR RI 2019 Kalimantan Selatan (`63`). Dataset dapil Kalsel I/II tidak ada di KPU Open Data (ID yang hilang dari daftar diperiksa satu per satu dan kosong). Rekap resmi `pemilu2019.kpu.go.id` tidak terjangkau dan tidak tersimpan di Wayback. Kalsel 2019 hanya berisi `seats`.

**Sumber yang ditolak:** `politikata/caleg_2019` `hasil_pileg_20190511.csv`. Ini hitungan sementara per 11 Mei 2019, jauh di bawah hasil final (contoh: Kalsel I PDIP 32.575).

## 2024

**Suara.**
1. Resmi: Keputusan KPU No. 1050 Tahun 2024 (perubahan atas KPU 360/2024, pasca putusan MK), Lampiran II "Perolehan Suara Sah Partai Politik … dari Setiap Daerah Pemilihan Anggota DPR RI". PDF `https://jdih.kpu.go.id/data/data_kepkpu/2024kpt1050_L2.pdf` tidak bisa diakses langsung (diblokir), jadi diambil dari arsip Wayback `https://web.archive.org/web/20250122154254id_/https://jdih.kpu.go.id/data/data_kepkpu/2024kpt1050_L2.pdf`. Snapshot 2024-08-08 dan 2026-10-09 identik (SHA-1 `2e975e79…`).
   - Teks Lembar 1–6 dari 7 berhasil diekstrak: 73 dapil, Aceh I s.d. Sulawesi Selatan III. Setiap baris lolos cek jumlah kolom = JUMLAH. Hasilnya dijumlah per provinsi untuk 27 provinsi.
   - Lembar 7 (11 dapil: Sultra, Gorontalo, Sulbar, Maluku, Malut, dan 6 provinsi Papua) tidak ada di PDF tersebut.
2. Untuk 11 provinsi sisanya: GitHub `Widyasa/analisis-sentimen-dan-pemilu-golkar`, `datasets/kpu_suara_partai_dprri_per_provinsi_2024.csv`. Data ini non-resmi, tetapi menyatakan diri sebagai transkripsi KPU 1050/2024 Lampiran II:
   `https://raw.githubusercontent.com/Widyasa/analisis-sentimen-dan-pemilu-golkar/HEAD/datasets/kpu_suara_partai_dprri_per_provinsi_2024.csv`

**Kursi.** Wikipedia en, `2024_Indonesian_legislative_election`, bagian "==== By province ====" (38 provinsi, 8 partai lolos ambang batas). Partai lain diberi `seats: 0` karena mendapat 0 kursi secara nasional.

**Verifikasi.**
- CSV Widyasa vs PDF resmi untuk 27 provinsi: **identik di semua sel** (18 partai + total, selisih 0).
- Untuk 11 provinsi sisanya: total nasional dikurangi kumulatif "JUMLAH" di akhir Lembar 6 PDF resmi = jumlah 11 provinsi di CSV Widyasa, **selisih 0 untuk ke-18 partai**.
- Jumlah suara 38 provinsi per partai = total nasional resmi pasca-MK (KPU 1204/2024; Wikipedia en/id: PDIP 25.384.673, Golkar 23.208.488, Gerindra 20.071.345, PKB 16.115.358, NasDem 14.660.328, PKS 12.781.241, Demokrat 11.283.053, PAN 10.984.639, PPP 5.878.708, PSI 4.260.108, Perindo 1.955.131, Gelora 1.282.000, Hanura 1.094.599, Buruh 972.898, Ummat 642.550, PBB 484.487, Garuda 406.884, PKN 326.803). **Selisih 0 untuk semua partai**. Total 151.793.293.
- Kursi per partai = 580 dan sama dengan nasional (PDIP 110, Golkar 102, Gerindra 86, NasDem 69, PKB 68, PKS 53, PAN 48, Demokrat 44).
- Alokasi Sainte-Laguë (ambang 4%) mereproduksi kursi Wikipedia di 38/38 provinsi:
  - 27 provinsi: dari suara dapil resmi KPU 1050 L2, dengan jumlah kursi tiap dapil dari id.wikipedia `Pemilihan_umum_legislatif_Indonesia_2024` (tabel dapil, total 84 dapil/580 kursi).
  - 11 provinsi satu-dapil: dari suara Widyasa.

**Sumber yang ditolak:** `wahyuarizeina/Analisis-Data-Elektoral-Pemilu-2024-Indonesia` `data_suara_partai_per_provinsi.csv`. Jumlahnya meleset 3–34% dari total nasional (contoh: PKB +34%, PPP +24%), sehingga tampak sintetis.

## Catatan metode

- Unduhan dan script ada di scratchpad (`agent-leg/dl`, `agent-leg/scripts`). Parsing memakai `python3 -I` dengan pembaca xlsx/PDF minimal (zipfile/zlib), tanpa library pihak ketiga.
- Kode provinsi KPU 2019 (nama) dan Wikipedia (nama) dipetakan ke kode Kemendagri secara manual. Papua 2019/2014 tercatat sebagai `91`/`92` (sebelum pemekaran).
