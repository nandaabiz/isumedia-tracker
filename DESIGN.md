# Design System & Style Guide: Impeccable Craft
## Tema: Netral, Gerejawi, dan Humanis (*Ecclesia & Humanitas*)
**Project:** IsuMedia Tracker & Electoral Intelligence  
**Framework:** Nuxt 3 + Tailwind CSS + shadcn-vue  
**Shadcn Preset:** `--preset b2D2hq2C0` (Style: Luma, Base: Mist, Theme: Blue, Chart: Emerald)  
**Version:** 1.1.0  

---

## 1. Filosofi Desain: *Ecclesia & Humanitas*

Desain antarmuka ini menolak kebiasaan usang dashboard analitik modern yang seragam (latar belakang hitam pekat dengan gradien neon kebiruan yang dingin). Sebagai gantinya, platform ini dibangun di atas tiga pilar visual:

1. **Gerejawi (*Ecclesiastical / Liturgical*)**:
   - **Ketenangan & Wibawa**: Terinspirasi dari arsitektur basilika, kehangatan ruang skriptorium biara, dan manuskrip bersejarah.
   - **Warna Sakral**: Menggunakan merah anggur sakramental (*liturgical claret / deep burgundy*), lilin lebah hangat (*warm beeswax ivory*), serta kilau tembaga/emas katedral kuno (*sanctuary brass & antique gold*).
   - **Rasa Waktu**: Menghadirkan rasa kedalaman historis yang selaras dengan penelaahan pemilu 3 dekade dan penelusuran asal-usul kebenaran isu.

2. **Humanis (*Humanist & Empathetic*)**:
   - **Menghargai Mata Manusia**: Tidak ada kontras yang menyengat atau efek kilau yang melelahkan pandangan. Pengguna dapat menganalisis data selama 8 jam tanpa ketegangan visual.
   - **Tipografi Bertutur**: Perpaduan antara serif klasik yang agung (*Newsreader / Cormorant*) untuk tajuk reflektif dan angka metrik simbolik, dengan sans-serif humanis (*Plus Jakarta Sans*) yang tajam dan memiliki *x-height* proporsional untuk data tabular.
   - **Garis & Batas Organik**: Batas antar panel menggunakan *warm hairline* yang menyerupai lipatan kertas perkamen halus, bukan garis kaku abu-abu industri.

3. **Netral (*Restrained & Objective*)**:
   - **UI yang Menahan Diri**: Antarmuka bertindak sebagai kanvas yang tenang. Warna-warni parpol dan node graf jaringan menjadi titik fokus visual utama tanpa berebut perhatian dengan elemen navigasi.

---

## 2. Palet Warna (*Color Tokens*)

### 2.1 Palet Inti (Light & Dark Mode)

```
========================================================================================
TOKEN NAME             LIGHT MODE (Hex)       DARK MODE (Hex)        DESKRIPSI LITURGIS
========================================================================================
--bg-canvas            #FAF8F5 (Alabaster)    #121316 (Cathedral)    Latar dasar perkamen / batu biara
--bg-surface           #FFFFFF (Pure Vellum)  #1A1C22 (Monastic)     Permukaan kartu & panel analitik
--bg-muted             #F2EEE6 (Warm Sand)    #242731 (Crypt Stone)  Latar sekunder & baris tabel zebra
--border-subtle        #E6E0D4 (Parchment)    #2E3340 (Lead Casing)  Garis pemisah hangat bertekstur
--border-focus         #7E2032 (Claret Red)   #C59B27 (Warm Gold)    Indikator fokus / aksen aktif

--text-primary         #1F2128 (Iron Ink)     #F4F2EC (Beeswax Lum)  Tinta utama, kontras tinggi & lembut
--text-secondary       #5E626E (Monk Habit)   #A6ABB8 (Pewter)       Keterangan sekunder & metadata
--text-tertiary        #8E93A0 (Stone Dust)   #6C7280 (Incense Ash)  Label kecil, timestamp, caption

--primary (Claret)     #7E2032 (Liturgical)   #9E2A40 (Sacramental)  Merah anggur, lambang komitmen utama
--primary-foreground  #FFFFFF                #FFFFFF                Kontras teks pada tombol utama
--accent (Brass/Gold)  #B8860B (Old Brass)    #D4AF37 (Warm Gold)    Emas katedral, penanda pemantik/origin
--accent-muted         #F5EEDB (Gold Wash)    #3A321E (Gold Shadow)  Latar sorotan badge penting
```

### 2.2 Kode Hex Tailwind (Untuk `tailwind.config.ts`)

```ts
// tailwind.config.ts - Palette Ecclesia & Humanitas
export default {
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFCF9',
          100: '#FAF8F5',
          200: '#F2EEE6',
          300: '#E6E0D4',
          400: '#D5CCBD',
          500: '#B8AB96',
          900: '#3D362C',
        },
        claret: {
          50: '#FBF3F4',
          100: '#F7E6E8',
          200: '#EFD0D4',
          500: '#9E2A40',
          700: '#7E2032', // Primary Liturgical Crimson
          800: '#641927',
          900: '#48111B',
        },
        brass: {
          50: '#FAF7EF',
          100: '#F5EEDB',
          300: '#E4CF9A',
          500: '#C59B27',
          600: '#B8860B', // Old Cathedral Brass
          800: '#735207',
        },
        monastic: {
          800: '#1A1C22',
          900: '#121316',
          950: '#0C0D0F',
        }
      }
    }
  }
}
```

### 2.3 Spesifikasi Shadcn Preset `b2D2hq2C0`
Konfigurasi preset shadcn didefinisikan dalam `components.json` dan CSS Variables di `assets/css/main.css`:

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "luma",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "assets/css/main.css",
    "baseColor": "mist",
    "cssVariables": true
  },
  "preset": "b2D2hq2C0",
  "presetConfig": {
    "style": "luma",
    "baseColor": "mist",
    "theme": "blue",
    "chartColor": "emerald",
    "font": "inter",
    "iconLibrary": "lucide",
    "radius": "default"
  }
}
```

**Mapping Token Preset ke CSS Variables:**
- **Base Color (`mist`)**: Memberikan nuansa latar netral lembut (`oklch(1 0 0)` light, `oklch(0.148 0.004 228.8)` dark) yang sangat bersahabat bagi mata dan selaras dengan perkamen Alabaster.
- **Theme (`blue`)**: Aksen interaktif primer (`oklch(0.488 0.243 264.376)` light, `oklch(0.424 0.199 265.638)` dark) untuk ring focus, status tautan, dan elemen navigasi aktif.
- **Chart Color (`emerald`)**: Rangkaian 5 palet chart (`oklch 164.978` - `166.913`) yang jernih dan kontras tinggi untuk visualisasi tren data media dan sebaran suara.
- **Radius**: `0.625rem` (`var(--radius)` / `rounded-lg`).

---

## 3. Palet Khusus: Parpol & Data Elektoral Indonesia

Untuk menjaga netralitas dan keterbacaan visual pada peta GIS dan grafik suara:

| Entitas Parpol / Kategori | Hex Utama | Nama Nuansa | Makna / Identitas |
|---|---|---|---|
| **PDI Perjuangan (PDIP)** | `#B91C1C` | Deep Banteng Crimson | Merah marun solid |
| **Partai Golkar** | `#D97706` | Ochre Imperial Gold | Kuning keemasan hangat |
| **Partai Gerindra** | `#0284C7` | Garuda Slate Blue | Biru keperakan terang |
| **Partai Kebangkitan Bangsa (PKB)** | `#15803D` | Forest Emerald Green | Hijau daun lebat |
| **Partai Keadilan Sejahtera (PKS)** | `#EA580C` | Warm Terracotta Orange | Oranye hangat |
| **Partai NasDem** | `#1E3A8A` | Deep Navy Midnight | Biru tua bahari |
| **Partai Demokrat** | `#2563EB` | Cobalt Star Blue | Biru kobalt menyala |
| **Partai Amanat Nasional (PAN)** | `#0284C7` | Azure Sunburst | Biru langit cerah |
| **Partai Persatuan Pembangunan (PPP)**| `#047857` | Sage Olive Green | Hijau zaitun tua |
| **Non-Partisan / Golput / Swing** | `#64748B` | Neutral Monastic Slate | Abu-abu netral |

---

## 4. Palet Graf Jaringan: Origin & Amplifier Network (Fitur 1)

Visualisasi relasi pemantik dan penyebar duplikasi:

- **Origin Node (Akun Pemantik / Titik Nol)**:
  - Fill: `#7E2032` (Claret Crimson) dengan cincin emas menyala (`#D4AF37`, stroke 3px).
  - Label: Bold serif, badge mahkota *"Origin / Pemantik"*.
  - Ukuran: Paling dominan (Radius 28px).
- **First Multipliers (KOL / Akun Penyebar Awal)**:
  - Fill: `#B8860B` (Sanctuary Brass).
  - Ukuran: Medium (Radius 18px).
- **Amplifiers & Duplicate Bots (Akun Duplikasi / Pengganda)**:
  - Fill: `#8E93A0` (Muted Slate) atau merah transparan jika terdeteksi bot identik.
  - Ukuran: Kompak (Radius 10px).
- **Edges (Garis Relasi & Waktu)**:
  - Warna: Gradasi dari `#B8860B` ke `#D5CCBD`.
  - Animasi partikel mengalir: Menggambarkan arah aliran informasi dari pemantik ke jaringan duplikasi.

---

## 5. Tipografi & Hierarki Teks

### 5.1 Pasangan Font
1. **Display & Serif Klasik**: `Newsreader` atau `Cinzel` / `Cormorant Garamond` (Google Fonts).
   - *Penggunaan*: Judul modul, angka metrik statistik besar (*KPI metrics*), nama isu terpopuler, kutipan teks pemantik asli.
2. **Body & UI Sans**: `Plus Jakarta Sans` atau `Inter` (Sans-Serif Humanis).
   - *Penggunaan*: Teks label, tombol kontrol, isi tabel data, navigasi sidebar, form input, dan tooltip peta.
3. **Monospace Tabular**: `JetBrains Mono` atau `Geist Mono`.
   - *Penggunaan*: Timestamp presisi detik, persentase suara pemilu, kode DPT wilayah, dan ID postingan.

### 5.2 Skala Tipografi (Type Scale)

```
Level                Size     Weight    Line Height   Font Family
---------------------------------------------------------------------------------
Display Metric (Big) 40px     700       1.1           Serif (Newsreader)
Heading 1 (Page)     28px     600       1.2           Serif (Newsreader)
Heading 2 (Section)  20px     600       1.3           Sans (Plus Jakarta Sans)
Heading 3 (Card)     16px     600       1.4           Sans (Plus Jakarta Sans)
Body Regular         14px     400       1.5           Sans (Plus Jakarta Sans)
Body Dense / Table   13px     400       1.4           Sans (Plus Jakarta Sans)
Caption / Timestamp  12px     500       1.4           Mono / Sans
Badge / Pill Text    11px     600       1.2           Sans (Uppercase, Tracked)
```

---

## 6. Aturan Komponen UI (shadcn-vue & Impeccable Standards)

### 6.1 Card & Container
- Latar: `bg-white dark:bg-monastic-800`.
- Border: `border border-parchment-300 dark:border-monastic-700/60`.
- Bayangan (*Shadow*): Sangat halus dan hangat: `shadow-[0_2px_12px_-3px_rgba(40,30,20,0.05)]`. Tidak menggunakan drop-shadow tebal hitam legam.
- Radius: `rounded-lg` (8px - 10px), proporsi bersahaja dan formal.

### 6.2 Tombol (*Buttons*)
- **Primary**: Latar merah anggur `bg-claret-700 hover:bg-claret-800 text-white font-medium shadow-sm transition-colors`.
- **Secondary / Ghost**: Latar perkamen transparan `border border-parchment-300 hover:bg-parchment-200/60 text-parchment-900`.
- **Accent (Filter Aktif)**: Aksen emas `bg-brass-100 dark:bg-brass-900/30 text-brass-800 dark:text-brass-300 border border-brass-300/50`.

### 6.3 Peta GIS & Grafis Interaktif
- Peta Leaflet menggunakan tile dasar yang bersih dan tenang (CartoDB Positron / Voyager atau tile bertekstur netral), bukan satelit warna-warni yang mengalihkan fokus dari batas wilayah.
- Tooltip peta menggunakan kartu melayang bernuansa perkamen bersih dengan visualisasi mini-bar perolehan suara partai atau sentimen isu.

---

## 7. Nada Bicara & Salinan Antarmuka (UX Microcopy)

- **Menghormati Intelektualitas Pengguna**: Hindari teks pemasaran yang berlebihan (*"Rasakan kedahsyatan AI kami"* ❌). Gunakan istilah faktual dan terukur (*"Algoritma melacak 142 amplifikasi dari akun awal dalam 38 menit"* ✔️).
- **Kejelasan Status**:
  - *"Pemantauan Aktif"* bukan sekadar bulatan hijau berkedip tanpa label.
  - *"Terverifikasi KPU D-Hasil"* untuk menandai keabsahan data elektoral.
  - *"Simulasi Rekonstruksi Waktu"* jika data sedang dalam proses estimasi difusi informasi.
