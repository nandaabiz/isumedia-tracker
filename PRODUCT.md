# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Nuxt.js 3 (Vue 3, TypeScript, Vite) + shadcn-vue (Radix Vue, Tailwind CSS) + PocketBase (embedded SQLite, Auth, REST & SSE Realtime) + Leaflet (Peta GIS Indonesia) + Vis-Network/D3 (Graph Jaringan Pemantik & Duplikasi) + Lucide Icons.

## Users

1. **Analis Media & Komunikasi Publik**: Memantau narasi yang beredar di ruang publik, melacak akun pemantik awal (*origin*), akun-akun amplifikator/duplikasi, serta sebaran daerah isu.
2. **Ahli Strategi Politik & Tim Kebijakan**: Mempelajari peta pemilih 3 periode pemilu (2014, 2019, 2024), mendeteksi basis loyalis parpol versus zona pertempuran suara mengambang (*swing voters*), dan faktor sosio-ekologis yang memengaruhinya.
3. **Peneliti / Akademisi / Pengawas Pemilu**: Mengkaji korelasi linimasa pemberitaan media terhadap fluktuasi suara pemilu KPU.

## Product Purpose

Menyediakan instrumen intelijen terintegrasi yang menyandingkan analisis dinamika percakapan media publik (*real-time issue & amplifier tracker*) dengan analisis historis perilaku pemilih Indonesia 3 periode (*electoral & voter intelligence*) dalam antarmuka yang berwibawa, transparan, objektif, dan humanis.

## Positioning

Satu-satunya platform yang menyatukan pelacakan anatomi isu media sosial (siapa pemantiknya, siapa penggandanya, di mana persebarannya) dengan basis data elektoral komprehensif 3 periode KPU/Bawaslu untuk mengungkap relasi antara opini publik di media dan keputusan elektoral di bilik suara.

## Operating Context

Digunakan di ruang kendali strategi (*situation room*), meja riset analis, ruang redaksi data, dan presentasi meja bundar pengambil keputusan. Digunakan dalam sesi pemantauan intensif berjam-jam sehingga menuntut kenyamanan visual tinggi, minim kelelahan mata (*low cognitive fatigue*), dan respon kueri cepat.

## Capabilities and Constraints

- **Capabilities**:
  - Pemantau isu populer (trending) dan pemantau kustom berdasarkan kata kunci / tagar.
  - Pelacakan akun pemantik (*timestamp zero*) dan graf duplikasi/amplifikasi narasi.
  - Sebaran spasial isu ke 38 Provinsi dan 514 Kabupaten/Kota.
  - Filter pemilihan kanal media publik (Portal Berita, X, YouTube publik, TikTok, Forum).
  - Peta GIS Pemilu 2014, 2019, 2024: Pilpres, Pileg DPR RI, dan profil DPT.
  - Komputasi Indeks Loyalitas Partai dan Indeks Volatilitas Pemilih (*Pedersen Swing Index*).
  - Integrasi arsip berita pemilu untuk melihat sentimen penentu pergeseran suara.
  - Backend mandiri berbasis PocketBase yang portabel dan berkinerja tinggi.
- **Constraints**:
  - Hanya memantau data media sosial publik. Akun privat mutlak diabaikan demi mematuhi privasi dan UU Perlindungan Data Pribadi (UU PDP).
  - Data pemilu merujuk ke data historis resmi KPU/Bawaslu.

## Brand Commitments

- **Tone & Voice**: Berwibawa, teduh, objektif, tanpa sensasionalisme, berakar pada fakta (*evidence-based*).
- **Aesthetic Pillars**: **Netral, Gerejawi, dan Humanis**. Menghadirkan ketenangan seperti ruang skriptorium katedral, martabat manuskrip sejarah, dan kehangatan kemanusiaan yang menghargai akal budi.

## Evidence on Hand

- Data resmi perolehan suara KPU 3 Periode (2014, 2019, 2024) untuk Pilpres dan Pileg tingkat nasional dan provinsi.
- Peta GeoJSON resmi batas wilayah administrasi 38 Provinsi Indonesia.
- Rekam jejak berita pemilu dan linimasa perdebatan publik nasional.

## Product Principles

1. **Kebenaran Asal-Usul (Origin Integrity)**: Setiap narasi harus dapat dilacak titik mulanya; jangan sekadar menampilkan volume, tetapi tunjukkan siapa pemantiknya dan bagaimana rantai amplifikasinya.
2. **Kemandirian & Kenetralan Data**: Menampilkan data pemilu apa adanya sesuai catatan KPU tanpa keberpihakan ideologis.
3. **Keheningan & Fokus Analitis**: Desain visual tidak berteriak; antarmuka adalah panggung tenang di mana data, peta, dan graf berbicara dengan jelas.
4. **Sentuhan Kemanusiaan (Human Dignity)**: Data elektoral dan data medsos bukan sekadar angka agregat dingin, melainkan cerminan aspirasi, keresahan, dan pilihan nyata manusia Indonesia.

## Accessibility & Inclusion

- Standar kepatuhan kontras warna WCAG 2.1 AA untuk seluruh teks dan kontrol.
- Skema warna pemilu yang dapat dibedakan dengan jelas dengan indikator label teks pendukung (ramah *color-vision deficiency*).
- Navigasi keyboard penuh untuk interaksi filter dan kartu ringkasan.
