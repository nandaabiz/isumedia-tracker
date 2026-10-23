# Sumber Data Pemilihan Gubernur (Pilgub) per Provinsi

File data: `pilkada.json`. Struktur: `{ "<periode>": { "<kodeProvinsi>": { electionYear, electionDate, winner, parties, independent, votePercentage?, source, note? } | null } }`.

- `<periode>` adalah tahun pemilu nasional (`2014`, `2019`, `2024`), bukan tahun Pilgub. Tahun Pilgub ada di `electionYear`.
- Kode provinsi mengikuti `provinces.json` di repo ini (91 Papua, 92 Papua Barat, 93 Papua Selatan, 94 Papua Tengah, 95 Papua Pegunungan, 96 Papua Barat Daya). Kode ini berbeda dari kode BPS/Kemendagri untuk Papua (91/92/94/95/96/97).
- `winner` = "Calon Gubernur - Calon Wakil Gubernur" pemenang putaran final atau hasil final pasca-PSU.
- `parties` = partai **pengusung** yang mendaftarkan pasangan di KPU daerah. Bila sumber memisahkan "pengusung" dan "pendukung", hanya pengusung yang dicatat; pendukung disebut di `note`. Partai yang cocok memakai kode standar aplikasi (`PDIP`, `GOLKAR`, … `PKN`). Partai lain ditulis dengan nama resminya (lihat daftar di bawah).
- `independent: true` hanya untuk calon perseorangan. Tidak ada pemenang dari jalur perseorangan di ketiga periode.
- `votePercentage` = persentase suara sah pasangan pemenang pada putaran final. Bila tidak terverifikasi, key ini tidak ditulis.
- Field yang tidak bisa diverifikasi diisi `null` (`electionDate`, `parties`, `independent`) dan dijelaskan di `note`. Tidak ada nilai yang ditebak.
- DI Yogyakarta (`34`) bernilai `null` di ketiga periode (lihat bagian khusus).

## Aturan pemilihan periode

Untuk setiap pemilu nasional (Pileg/Pilpres 9 April 2014, 17 April 2019, 14 Februari 2024) dipilih Pilgub yang tanggal pemungutannya **paling dekat** dengan tanggal pemilu itu, baik sebelum maupun sesudahnya. Daftar yang diberikan peminta sudah diperiksa terhadap tanggal di sumber:

- **2014**: semua pilihan valid. Ada tiga penyesuaian:
  - Kalteng (`62`): Pilgub semula dijadwalkan 9 Desember 2015, lalu ditunda ke **27 Januari 2016**. Jaraknya 1,8 tahun dari 9 April 2014, lebih dekat daripada Pilgub 2010.
  - Papua Barat (`92`): yang dipakai adalah Pemilukada Papua Barat **Tahun 2011** (nama resmi di Putusan MK 84/PHPU.D-IX/2011). Pemungutan awalnya 20 Juli 2011, lalu ada PSU sebelum pelantikan 17 Januari 2012. Peminta menulis "2012", mungkin mengikuti tahun pelantikan.
  - Gorontalo (`75`): Pemilukada Provinsi Gorontalo **Tahun 2011** (rekapitulasi KPU 23 November 2011, pelantikan 16 Januari 2012).
- **2019**: semua pilihan valid. Pilgub 9 Desember 2020 berjarak 1,65 tahun dari 17 April 2019, lebih dekat daripada Pilgub Desember 2015/Januari 2016 (sekitar 3,2–3,35 tahun).
- **2024**: Pilkada serentak 27 November 2024 untuk 37 provinsi. Papua (`91`) memakai hasil PSU 6 Agustus 2025 (lihat catatan).
- Bila ada dua putaran, `electionDate` adalah tanggal putaran final dan putaran pertama disebut di `note`. Ini berlaku untuk DKI 2012, Riau 2013, Maluku 2013, Maluku Utara 2013, dan DKI 2017.
- Bila ada PSU yang mengubah hasil akhir, `votePercentage` diambil dari hasil pasca-PSU dan `electionDate` tetap tanggal pemungutan utama, kecuali Papua 2024 yang PSU-nya diulang di seluruh provinsi. Kasus ini: Sumsel 2013, Jambi 2020, Kalsel 2020, dan Papua 2024.

## Ringkasan cakupan

| Periode | Entri terisi | Ada `parties` | Ada `votePercentage` | Ada `electionDate` | `null` |
|---|---|---|---|---|---|
| 2014 | 33 | 27 | 31 | 29 | DIY |
| 2019 | 33 | 33 | 33 | 33 | DIY |
| 2024 | 37 | 37 | 37 | 37 | DIY |

Provinsi `93`–`96` tidak ada di periode 2014 dan 2019 (dimekarkan 2022) sehingga tidak ditulis. Pada 2014 dan 2019, Papua (`91`) dan Papua Barat (`92`) berarti wilayah provinsi sebelum pemekaran.

## Metode dan sumber utama

1. **Wikipedia bahasa Indonesia**, satu halaman per pemilihan (`Pemilihan umum Gubernur <Provinsi> <Tahun>`), diambil lewat API `action=parse&prop=wikitext` pada 23 Oktober 2026. Data yang diambil:
   - infobox: tanggal, nominee/running mate, persentase, `after_election` untuk memastikan pemenang;
   - tabel/paragraf bagian "Calon"/"Kandidat": partai pengusung dan pendukung.
   - Dari 103 judul yang dicari, 99 halaman ada. Setiap file unduhan diperiksa judulnya. Unduhan pertama sempat tertukar karena rate limit (HTTP 429), lalu diulang dan diverifikasi.
2. **Putusan Mahkamah Konstitusi** (PDF dari arsip Wayback `mkri.id`, diekstrak dengan parser PDF minimal) untuk entri yang tidak punya halaman Wikipedia atau perlu konfirmasi:
   - 84/PHPU.D-IX/2011 (Papua Barat 2011): https://web.archive.org/web/20230122125100/https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_84%20PHPU%20Papua%20Barat_TELAH%20BACA.pdf
   - 121/PHPU.D-IX/2011 (Gorontalo 2011): https://web.archive.org/web/2024/https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_121%20PHPU%20Gorontalo_telah%20BACA.pdf
   - 14/PHPU.D-XI/2013 (Papua 2013): https://web.archive.org/web/2024/https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_14%20PHPU%202013-provPapua-telahbaca-11Maret2013.pdf
3. **Wikipedia bahasa Inggris** untuk Aceh 2012 (`2012_Aceh_gubernatorial_election`), NTT 2013 (artikel `Frans_Lebu_Raya`), dan tanggal Kaltim 2018 (`2018_Indonesian_local_elections`).
4. **Daftar Gubernur** di id.wikipedia (Sulawesi Tenggara, Papua Barat, Gorontalo, NTT) untuk memastikan siapa yang dilantik pada entri yang halamannya tidak ada.

Pemetaan kolom tabel ke pasangan calon (tabel berformat kolom per pasangan) dicek silang dengan `party`/`running_mate` di infobox, warna partai, dan nomor urut. Persentase 2024 dicocokkan otomatis dengan `percentageN` infobox lewat nama wakil, dan cocok untuk 37/37 entri.

## Sumber per provinsi

### Periode 2014

| Kode | Provinsi | Pilgub | Tanggal | Pemenang | % | Sumber |
|---|---|---|---|---|---|---|
| 11 | Aceh | 2012 | 2012-04-09 | Zaini Abdullah - Muzakir Manaf | 55,78 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Aceh_2012 |
| 12 | Sumatera Utara | 2013 | 2013-03-07 | Gatot Pujo Nugroho - Tengku Erry Nuradi | 33,0 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Utara_2013 |
| 13 | Sumatera Barat | 2015 | 2015-12-09 | Irwan Prayitno - Nasrul Abit | 58,62 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Barat_2015 |
| 14 | Riau | 2013 | 2013-11-27 | Annas Maamun - Arsyadjuliandi Rachman | 60,75 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Riau_2013 |
| 15 | Jambi | 2015 | 2015-12-09 | Zumi Zola - Fachrori Umar | 60,25 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jambi_2015 |
| 16 | Sumatera Selatan | 2013 | 2013-06-06 | Alex Noerdin - Ishak Mekki | 39,29 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatra_Selatan_2013 |
| 17 | Bengkulu | 2015 | 2015-12-09 | Ridwan Mukti - Rohidin Mersyah | 57,37 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bengkulu_2015 |
| 18 | Lampung | 2014 | 2014-04-09 | Muhammad Ridho Ficardo - Bachtiar Basri | 44,96 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Lampung_2014 |
| 19 | Kepulauan Bangka Belitung | 2012 | 2012-02-23 | Eko Maulana Ali - Rustam Effendi | 33,24 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Bangka_Belitung_2012 |
| 21 | Kepulauan Riau | 2015 | 2015-12-09 | Muhammad Sani - Nurdin Basirun | 53,2 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Riau_2015 |
| 31 | DKI Jakarta | 2012 | 2012-09-20 | Joko Widodo - Basuki Tjahaja Purnama | 53,82 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_DKI_Jakarta_2012 |
| 32 | Jawa Barat | 2013 | 2013-02-24 | Ahmad Heryawan - Deddy Mizwar | 32,39 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Barat_2013 |
| 33 | Jawa Tengah | 2013 | 2013-05-26 | Ganjar Pranowo - Heru Sudjatmoko | 48,82 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Tengah_2013 |
| 34 | DI Yogyakarta | – | – | tidak ada Pilgub (`null`) | – | – |
| 35 | Jawa Timur | 2013 | 2013-08-29 | Soekarwo - Saifullah Yusuf | 47,25 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Timur_2013 |
| 36 | Banten | 2011 | 2011-10-22 | Ratu Atut Chosiyah - Rano Karno | 49,64 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Banten_2011 |
| 51 | Bali | 2013 | 2013-05-15 | I Made Mangku Pastika - I Ketut Sudikerta | 50,02 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bali_2013 |
| 52 | Nusa Tenggara Barat | 2013 | 2013-05-13 | Muhammad Zainul Majdi - Muhammad Amin | 44,37 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Nusa_Tenggara_Barat_2013 |
| 53 | Nusa Tenggara Timur | 2013 | *tidak terverifikasi* | Frans Lebu Raya - Benny Alexander Litelnoni | 51,25 | https://en.wikipedia.org/wiki/Frans_Lebu_Raya |
| 61 | Kalimantan Barat | 2012 | 2012-09-20 | Cornelis - Christiandy Sanjaya | 52,1 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Barat_2012 |
| 62 | Kalimantan Tengah | 2016 | 2016-01-27 | Sugianto Sabran - Said Ismail | 51,52 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Tengah_2016 |
| 63 | Kalimantan Selatan | 2015 | 2015-12-09 | Sahbirin Noor - Rudy Resnawan | 41,09 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Selatan_2015 |
| 64 | Kalimantan Timur | 2013 | 2013-09-10 | Awang Faroek Ishak - Mukmin Faisyal | 43,02 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Timur_2013 |
| 65 | Kalimantan Utara | 2015 | 2015-12-09 | Irianto Lambrie - Udin Hianggio | 53,03 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Utara_2015 |
| 71 | Sulawesi Utara | 2015 | 2015-12-09 | Olly Dondokambey - Steven Kandouw | 51,41 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Utara_2015 |
| 72 | Sulawesi Tengah | 2015 | 2015-12-09 | Longki Djanggola - Sudarto | 54,5 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Tengah_2015 |
| 73 | Sulawesi Selatan | 2013 | 2013-01-22 | Syahrul Yasin Limpo - Agus Arifin Nu'mang | 52,42 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Selatan_2013 |
| 74 | Sulawesi Tenggara | 2012 | *tidak terverifikasi* | Nur Alam - Saleh Lasata | – | https://id.wikipedia.org/wiki/Daftar_Gubernur_Sulawesi_Tenggara |
| 75 | Gorontalo | 2011 | *tidak terverifikasi* | Rusli Habibie - Idris Rahim | 43,98 | https://web.archive.org/web/2024/https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_121%20PHPU%20Gorontalo_telah%20BACA.pdf |
| 76 | Sulawesi Barat | 2011 | 2011-10-10 | Anwar Adnan Saleh - Aladin S. Mengga | 48,93 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Barat_2011 |
| 81 | Maluku | 2013 | 2013-12-14 | Said Assagaff - Zeth Sahuburua | 50,4 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_2013 |
| 82 | Maluku Utara | 2013 | 2013-10-31 | Abdul Ghani Kasuba - Muhammad Natsir Thaib | 50,41 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_Utara_2013 |
| 91 | Papua | 2013 | 2013-01-29 | Lukas Enembe - Klemen Tinal | 51,69 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_2013 |
| 92 | Papua Barat | 2011 | *tidak terverifikasi* | Abraham Octavianus Atururi - Rahimin Katjong | – | https://web.archive.org/web/20230122125100/https://www.mkri.id/public/content/persidangan/putusan/putusan_sidang_84%20PHPU%20Papua%20Barat_TELAH%20BACA.pdf |

### Periode 2019

| Kode | Provinsi | Pilgub | Tanggal | Pemenang | % | Sumber |
|---|---|---|---|---|---|---|
| 11 | Aceh | 2017 | 2017-02-15 | Irwandi Yusuf - Nova Iriansyah | 37,22 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Aceh_2017 |
| 12 | Sumatera Utara | 2018 | 2018-06-27 | Edy Rahmayadi - Musa Rajekshah | 57,58 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Utara_2018 |
| 13 | Sumatera Barat | 2020 | 2020-12-09 | Mahyeldi Ansharullah - Audy Joinaldy | 32,43 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Barat_2020 |
| 14 | Riau | 2018 | 2018-06-27 | Syamsuar - Edy Natar Nasution | 38,2 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Riau_2018 |
| 15 | Jambi | 2020 | 2020-12-09 | Al Haris - Abdullah Sani | 38,26 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jambi_2020 |
| 16 | Sumatera Selatan | 2018 | 2018-06-27 | Herman Deru - Mawardi Yahya | 35,96 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Selatan_2018 |
| 17 | Bengkulu | 2020 | 2020-12-09 | Rohidin Mersyah - Rosjonsyah Syahili | 41,2 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bengkulu_2020 |
| 18 | Lampung | 2018 | 2018-06-27 | Arinal Djunaidi - Chusnunia Chalim | 37,78 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Lampung_2018 |
| 19 | Kepulauan Bangka Belitung | 2017 | 2017-02-15 | Erzaldi Rosman Djohan - Abdul Fatah | 38,94 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Bangka_Belitung_2017 |
| 21 | Kepulauan Riau | 2020 | 2020-12-09 | Ansar Ahmad - Marlin Agustina | 39,97 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Riau_2020 |
| 31 | DKI Jakarta | 2017 | 2017-04-19 | Anies Baswedan - Sandiaga Uno | 57,96 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_DKI_Jakarta_2017 |
| 32 | Jawa Barat | 2018 | 2018-06-27 | Ridwan Kamil - Uu Ruzhanul Ulum | 32,88 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Barat_2018 |
| 33 | Jawa Tengah | 2018 | 2018-06-27 | Ganjar Pranowo - Taj Yasin Maimoen | 58,78 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Tengah_2018 |
| 34 | DI Yogyakarta | – | – | tidak ada Pilgub (`null`) | – | – |
| 35 | Jawa Timur | 2018 | 2018-06-27 | Khofifah Indar Parawansa - Emil Dardak | 53,55 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Timur_2018 |
| 36 | Banten | 2017 | 2017-02-15 | Wahidin Halim - Andika Hazrumy | 50,95 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Banten_2017 |
| 51 | Bali | 2018 | 2018-06-27 | I Wayan Koster - Tjokorda Oka Artha Ardana Sukawati | 57,68 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bali_2018 |
| 52 | Nusa Tenggara Barat | 2018 | 2018-06-27 | Zulkieflimansyah - Sitti Rohmi Djalilah | 31,8 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Nusa_Tenggara_Barat_2018 |
| 53 | Nusa Tenggara Timur | 2018 | 2018-06-27 | Viktor Laiskodat - Josef Nae Soi | 35,6 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Nusa_Tenggara_Timur_2018 |
| 61 | Kalimantan Barat | 2018 | 2018-06-27 | Sutarmidji - Ria Norsan | 51,55 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Barat_2018 |
| 62 | Kalimantan Tengah | 2020 | 2020-12-09 | Sugianto Sabran - Edy Pratowo | 51,6 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Tengah_2020 |
| 63 | Kalimantan Selatan | 2020 | 2020-12-09 | Sahbirin Noor - Muhidin | 51,17 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Selatan_2020 |
| 64 | Kalimantan Timur | 2018 | 2018-06-27 | Isran Noor - Hadi Mulyadi | 31,33 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Timur_2018 |
| 65 | Kalimantan Utara | 2020 | 2020-12-09 | Zainal Arifin Paliwang - Yansen Tipa Padan | 45,86 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Utara_2020 |
| 71 | Sulawesi Utara | 2020 | 2020-12-09 | Olly Dondokambey - Steven Kandouw | 57,1 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Utara_2020 |
| 72 | Sulawesi Tengah | 2020 | 2020-12-09 | Rusdy Mastura - Ma'mun Amir | 59,61 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Tengah_2020 |
| 73 | Sulawesi Selatan | 2018 | 2018-06-27 | Nurdin Abdullah - Andi Sudirman Sulaiman | 43,87 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Selatan_2018 |
| 74 | Sulawesi Tenggara | 2018 | 2018-06-27 | Ali Mazi - Lukman Abunawas | 43,68 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Tenggara_2018 |
| 75 | Gorontalo | 2017 | 2017-02-15 | Rusli Habibie - Idris Rahim | 50,65 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Gorontalo_2017 |
| 76 | Sulawesi Barat | 2017 | 2017-02-15 | Ali Baal Masdar - Enny Anggraeny Anwar | 38,76 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Barat_2017 |
| 81 | Maluku | 2018 | 2018-06-27 | Murad Ismail - Barnabas Orno | 40,83 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_2018 |
| 82 | Maluku Utara | 2018 | 2018-06-27 | Abdul Ghani Kasuba - Al Yasin Ali | 31,79 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_Utara_2018 |
| 91 | Papua | 2018 | 2018-06-27 | Lukas Enembe - Klemen Tinal | 67,54 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_2018 |
| 92 | Papua Barat | 2017 | 2017-02-15 | Dominggus Mandacan - Mohamad Lakotani | 58,62 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Barat_2017 |

### Periode 2024

| Kode | Provinsi | Pilgub | Tanggal | Pemenang | % | Sumber |
|---|---|---|---|---|---|---|
| 11 | Aceh | 2024 | 2024-11-27 | Muzakir Manaf - Fadhlullah | 53,27 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Aceh_2024 |
| 12 | Sumatera Utara | 2024 | 2024-11-27 | Bobby Nasution - Surya | 64,47 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Utara_2024 |
| 13 | Sumatera Barat | 2024 | 2024-11-27 | Mahyeldi Ansharullah - Vasko Ruseimy | 77,12 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatra_Barat_2024 |
| 14 | Riau | 2024 | 2024-11-27 | Abdul Wahid - S. F. Hariyanto | 44,31 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Riau_2024 |
| 15 | Jambi | 2024 | 2024-11-27 | Al Haris - Abdullah Sani | 61,01 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jambi_2024 |
| 16 | Sumatera Selatan | 2024 | 2024-11-27 | Herman Deru - Cik Ujang | 51,61 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sumatera_Selatan_2024 |
| 17 | Bengkulu | 2024 | 2024-11-27 | Helmi Hasan - Mian | 55,09 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bengkulu_2024 |
| 18 | Lampung | 2024 | 2024-11-27 | Rahmat Mirzani Djausal - Jihan Nurlela | 82,69 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Lampung_2024 |
| 19 | Kepulauan Bangka Belitung | 2024 | 2024-11-27 | Hidayat Arsani - Hellyana | 50,77 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Bangka_Belitung_2024 |
| 21 | Kepulauan Riau | 2024 | 2024-11-27 | Ansar Ahmad - Nyanyang Haris Pratamura | 55,06 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kepulauan_Riau_2024 |
| 31 | DKI Jakarta | 2024 | 2024-11-27 | Pramono Anung - Rano Karno | 50,07 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_DKI_Jakarta_2024 |
| 32 | Jawa Barat | 2024 | 2024-11-27 | Dedi Mulyadi - Erwan Setiawan | 62,22 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Barat_2024 |
| 33 | Jawa Tengah | 2024 | 2024-11-27 | Ahmad Luthfi - Taj Yasin Maimoen | 59,14 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Tengah_2024 |
| 34 | DI Yogyakarta | – | – | tidak ada Pilgub (`null`) | – | – |
| 35 | Jawa Timur | 2024 | 2024-11-27 | Khofifah Indar Parawansa - Emil Dardak | 58,81 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Jawa_Timur_2024 |
| 36 | Banten | 2024 | 2024-11-27 | Andra Soni - Achmad Dimyati Natakusumah | 55,88 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Banten_2024 |
| 51 | Bali | 2024 | 2024-11-27 | I Wayan Koster - I Nyoman Giri Prasta | 61,46 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Bali_2024 |
| 52 | Nusa Tenggara Barat | 2024 | 2024-11-27 | Lalu Muhamad Iqbal - Indah Dhamayanti Putri | 41,15 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Nusa_Tenggara_Barat_2024 |
| 53 | Nusa Tenggara Timur | 2024 | 2024-11-27 | Emanuel Melkiades Laka Lena - Johanis Asadoma | 37,33 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Nusa_Tenggara_Timur_2024 |
| 61 | Kalimantan Barat | 2024 | 2024-11-27 | Ria Norsan - Krisantus Kurniawan | 52,8 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Barat_2024 |
| 62 | Kalimantan Tengah | 2024 | 2024-11-27 | Agustiar Sabran - Edy Pratowo | 37,27 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Tengah_2024 |
| 63 | Kalimantan Selatan | 2024 | 2024-11-27 | Muhidin - Hasnuryadi Sulaiman | 82,4 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Selatan_2024 |
| 64 | Kalimantan Timur | 2024 | 2024-11-27 | Rudy Mas'ud - Seno Aji | 55,66 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Timur_2024 |
| 65 | Kalimantan Utara | 2024 | 2024-11-27 | Zainal Arifin Paliwang - Ingkong Ala | 58,53 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Kalimantan_Utara_2024 |
| 71 | Sulawesi Utara | 2024 | 2024-11-27 | Yulius Selvanus - Victor Mailangkay | 36,87 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Utara_2024 |
| 72 | Sulawesi Tengah | 2024 | 2024-11-27 | Anwar Hafid - Reny Lamadjido | 45,0 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Tengah_2024 |
| 73 | Sulawesi Selatan | 2024 | 2024-11-27 | Andi Sudirman Sulaiman - Fatmawati Rusdi | 65,32 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Selatan_2024 |
| 74 | Sulawesi Tenggara | 2024 | 2024-11-27 | Andi Sumangerukka - Hugua | 52,39 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Tenggara_2024 |
| 75 | Gorontalo | 2024 | 2024-11-27 | Gusnar Ismail - Idah Syahidah Rusli Habibie | 43,4 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Gorontalo_2024 |
| 76 | Sulawesi Barat | 2024 | 2024-11-27 | Suhardi Duka - Salim S. Mengga | 46,18 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Sulawesi_Barat_2024 |
| 81 | Maluku | 2024 | 2024-11-27 | Hendrik Lewerissa - Abdullah Vanath | 47,4 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_2024 |
| 82 | Maluku Utara | 2024 | 2024-11-27 | Sherly Tjoanda - Sarbin Sehe | 51,68 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Maluku_Utara_2024 |
| 91 | Papua | 2024 | 2025-08-06 | Mathius D. Fakhiri - Aryoko Alberto Ferdinand Rumaropen | 50,4 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_2024 |
| 92 | Papua Barat | 2024 | 2024-11-27 | Dominggus Mandacan - Mohamad Lakotani | 92,88 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Barat_2024 |
| 93 | Papua Selatan | 2024 | 2024-11-27 | Apolo Safanpo - Paskalis Imadawa | 51,65 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Selatan_2024 |
| 94 | Papua Tengah | 2024 | 2024-11-27 | Meki Fritz Nawipa - Deinas Geley | 45,48 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Tengah_2024 |
| 95 | Papua Pegunungan | 2024 | 2024-11-27 | John Tabo - Ones Pahabol | 56,09 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Pegunungan_2024 |
| 96 | Papua Barat Daya | 2024 | 2024-11-27 | Elisa Kambu - Ahmad Nausrau | 46,8 | https://id.wikipedia.org/wiki/Pemilihan_umum_Gubernur_Papua_Barat_Daya_2024 |

## DI Yogyakarta (`34`)

Tidak ada Pilgub. Berdasarkan UU No. 13 Tahun 2012 tentang Keistimewaan DIY, Gubernur dan Wakil Gubernur DIY ditetapkan oleh DPRD DIY. Jabatan itu diisi Sultan Hamengku Buwono yang bertakhta dan Adipati Paku Alam yang bertakhta, tanpa pemilihan langsung. Karena itu `"34": null` di ketiga periode.

## Entri yang dikosongkan sebagian (periode 2014)

| Kode | Pilgub | Field kosong | Alasan |
|---|---|---|---|
| 53 NTT | 2013 | `electionDate`, `parties`, `independent` | Halaman Wikipedia pemilihan tidak ada. Pemenang dan 51,25% hanya dari artikel en Frans Lebu Raya (rujukan Antara 1 Juni 2013). Ada putaran kedua, tetapi tanggalnya tidak ditemukan. |
| 74 Sultra | 2012 | `electionDate`, `parties`, `independent`, `votePercentage` | Halaman pemilihan tidak ada. Pemenang hanya dari Daftar Gubernur (periode II Nur Alam-Saleh Lasata mulai 18 Februari 2013). Daftar Pilkada 2012 di Wikipedia menulis 21 November 2012 tanpa rujukan, jadi tidak dipakai. |
| 75 Gorontalo | 2011 | `electionDate`, `parties`, `independent` | Putusan MK hanya memuat tanggal rekapitulasi (23 November 2011), tidak memuat hari pemungutan. Daftar Pilkada 2012 di Wikipedia menulis "16 Januari 2012", yang sebenarnya tanggal pelantikan. Suara 264.011 (43,98%) dari putusan MK. |
| 76 Sulbar | 2011 | `parties`, `independent` | Halaman Wikipedia hanya berisi infobox, tanpa daftar partai pengusung. |
| 91 Papua | 2013 | `parties`, `independent` | Tanggal dan suara terverifikasi (Wikipedia + Putusan MK 14/PHPU.D-XI/2013), tetapi koalisi tidak tercantum di kedua sumber. |
| 92 Papua Barat | 2011 | `electionDate`, `parties`, `independent`, `votePercentage` | Hasil 20 Juli 2011 (57,71%) dibatalkan MK, yang memerintahkan PSU. Tanggal dan hasil PSU tidak ditemukan. Pemenang final dari Daftar Gubernur. |

Periode 2019 dan 2024 terisi lengkap.

## Catatan ketidakpastian

- **Pengusung vs pendukung.** Wikipedia tidak konsisten. Sebagian tabel memakai judul "Partai pendukung" padahal isinya pengusung, misalnya DKI 2012, Kalbar 2012, Babel 2012, dan Sulsel 2013, yang tidak punya baris terpisah. Pada entri seperti ini seluruh daftar dianggap pengusung.
- **Koalisi berbeda antara paragraf dan tabel**:
  - Jabar 2013: tabel menambahkan PBB.
  - Sulsel 2013: paragraf menulis "PDS dan PDS"; dipakai tabel (PDS, PKNU).
  - Gorontalo 2017: tabel menambahkan PKNU dan PMB, partai yang tidak ikut Pemilu 2014. Dipakai paragraf (Golkar, Demokrat).
- **Dualisme Golkar/PPP (2015).** Jambi 2015 mencatat Golkar dan PPP per kubu sebagai pendukung. Kalsel 2015 tidak mencantumkan Golkar sebagai pengusung, padahal Sahbirin Noor kader Golkar.
- **Lampung 2014.** Partai bertanda "perlu rujukan" di Wikipedia tidak dimasukkan.
- **Jatim 2013.** Ada tambahan "22 partai non-parlemen" tanpa rincian nama.
- **Persentase hasil hitung sendiri.** Beberapa infobox memakai template `{{Percentage|a|b}}`, jadi persentase dihitung dari suara sah: Sumbar, Bengkulu, Kepri, Kalteng, dan Sulut 2020. Aceh 2012 dihitung dari tabel en.wikipedia (55,78%); infobox id menulis 55,8 dan en 55,9.
- **PSU dan sengketa MK.**
  - Sumsel 2013: PSU sebagian; persentase pasca-PSU 39,29%.
  - Jambi 2020: PSU 27 Mei 2021; 38,26%.
  - Kalsel 2020: PSU 9 Juni 2021; 51,17%.
  - Papua 2024: Putusan MK 304/PHPU.GUB-XXIII/2025 mendiskualifikasi cawagub Yermias Bisai dan memerintahkan PSU. PSU 6 Agustus 2025 dimenangkan Fakhiri-Rumaropen (50,40%), padahal 27 November 2024 Benhur Tomi Mano unggul 50,68%. Gugatan atas PSU ditolak lewat Putusan MK 328/PHPU.GUB-XXIII/2025.
  - Sengketa yang ditolak atau tidak diterima MK (pemenang tetap): Kalbar 2012, Papua 2013, Gorontalo 2011, dan Malut 2013 (perkara 100/PHPU.D-XI/2013 atas putaran pertama, ditolak 31 Juli 2013).
  - Digugat ke MK tetapi isi putusannya tidak dicek; pemenang sesuai pelantikan: Aceh 2012 dan Banten 2011.
- **Kaltim 2018.** Infobox id menulis 23 Juni 2018. Dipakai 27 Juni 2018 sesuai Pilkada serentak (en "2018 Indonesian local elections").
- **Aceh 2017.** Infobox memakai dua nama untuk PNA (Partai Nanggroe Aceh / Partai Nasional Aceh). Yang dipakai adalah "Partai Nasional Aceh". Untuk 2024 dipakai "Partai Nanggroe Aceh".
- Wikipedia adalah sumber sekunder. Untuk 2024, data resmi KPU (`*.kpu.go.id`, kecuali opendata) tidak bisa diakses dari sandbox sehingga tidak dicek silang dengan Keputusan KPU.

## Nama partai non-standar yang dipakai

Partai lokal Aceh: `Partai Aceh`, `Partai Nasional Aceh` (2017), `Partai Nanggroe Aceh` (2024), `Partai Damai Aceh`.

Partai peserta Pemilu 2009 (dipakai pada Pilgub periode 2014):
- `Partai Bintang Reformasi`
- `Partai Damai Sejahtera`
- `Partai Kebangkitan Nasional Ulama`
- `Partai Karya Peduli Bangsa`
- `Partai Demokrasi Kebangsaan`
- `Partai Peduli Rakyat Nasional`
- `Partai Republika Nusantara`
- `Partai Indonesia Sejahtera`
- `Partai Persatuan Daerah`
- `Partai Perjuangan Indonesia Baru`
- `Partai Persatuan Nahdlatul Ummah Indonesia`
- `Partai Merdeka`
- `Partai Barisan Nasional`
- `Partai Demokrasi Pembaruan`
- `Partai Patriot`
- `Partai Pelopor`
- `Partai Nasional Indonesia Marhaenisme`
- `Partai Nasional Benteng Kerakyatan Indonesia`
- `Partai Karya Perjuangan`
- `Partai Buruh`: Partai Buruh peserta 2009 (Lampung 2014). Ditulis sebagai string agar tidak tertukar dengan kode `BURUH` (Partai Buruh peserta 2024).

Kode `PKPI` dipakai juga untuk periode 2014/2019 dan untuk Sulut 2024, sesuai sumber.

## Catatan teknis

Unduhan dan script ada di scratchpad sesi (`pk/dl`, `pk/scripts`): `find_titles.py`, `dl_pages.py`, `infobox.py`, `pengusung.py`, `winparty.py`, `pdftext.py`, `build.py`. Parsing memakai `python3 -I` tanpa library pihak ketiga.
