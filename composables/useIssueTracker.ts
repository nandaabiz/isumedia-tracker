import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '~/composables/useApi'
import { useScraperStream } from '~/composables/useScraperStream'
import type {
  MonitoredTopic,
  OriginPost,
  AmplificationNode,
  AmplificationEdge,
  RegionalIssueStat,
  PlatformType,
  IssueAnalysis,
  NarrativeQuote
} from '~/types/issue'

// Realistic seed data reflecting current Indonesian public issues and verified policy documents
const SEED_TOPICS: MonitoredTopic[] = [
  {
    id: 'topic_ppn12',
    title: 'Wacana Penyesuaian Tarif PPN 12% & Ketahanan Daya Beli',
    category: 'Ekonomi',
    keywords: ['PPN 12%', 'pajak pertambahan nilai', 'daya beli', 'UU HPP', '#TolakPPN12', 'sembako'],
    isTrending: true,
    trendVelocity: '+184% / 3 jam',
    totalMentions: 148200,
    originTimestamp: '2026-09-18 07:14:22 WIB',
    activeMediaSources: ['news', 'x', 'youtube', 'tiktok', 'forum'],
    summary: 'Diskusi publik melonjak tajam setelah beredarnya draf peraturan teknis pelaksanaan UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (HPP). Pelaku usaha ritel dan warganet menyoroti potensi efek berantai kenaikan tarif terhadap harga bahan pokok, biaya logistik, dan daya beli kelas menengah.',
    proArguments: 'Kementerian Keuangan dan Badan Kebijakan Fiskal menegaskan penyesuaian tarif merupakan amanat sah UU HPP untuk menjamin keberlanjutan APBN, mendanai belanja jaring pengaman sosial, dan menjaga defisit anggaran tetap di bawah 3% PDB.',
    contraArguments: 'Asosiasi Pengusaha Ritel Indonesia (APRINDO), asosiasi buruh, dan yayasan konsumen menilai ekonomi keluarga menengah rentan mengalami pelemahan konsumsi agregat serta dapat memicu gelombang pemutusan hubungan kerja.'
  },
  {
    id: 'topic_mbg',
    title: 'Implementasi Program Makan Bergizi Gratis (MBG) & Ketahanan Pangan',
    category: 'Kesejahteraan',
    keywords: ['Makan Bergizi Gratis', 'MBG', 'Badan Gizi Nasional', 'satuan pelayanan', 'gizi anak', 'distribusi pangan'],
    isTrending: true,
    trendVelocity: '+92% / 6 jam',
    totalMentions: 96450,
    originTimestamp: '2026-09-19 11:05:08 WIB',
    activeMediaSources: ['news', 'x', 'youtube', 'tiktok'],
    summary: 'Pemantauan pengadaan dapur Satuan Pelayanan MBG berdasarkan mandat Perpres No. 83 Tahun 2024 tentang Badan Gizi Nasional di 14 provinsi. Sorotan tertuju pada standar higienitas BPOM, keterlibatan peternak/petani lokal, serta transparansi pagu anggaran Rp71 triliun.',
    proArguments: 'Menjamin intervensi nutrisi langsung bagi 1,2 juta siswa di wilayah prioritas stunting, menstimulasi perputaran ekonomi lokal dengan menyerap pasokan telur, susu, sayuran, dan beras dari UMKM pertanian setempat.',
    contraArguments: 'Kekhawatiran pemusatan pengadaan pada katering korporasi besar, risiko insiden keamanan pangan bila rantai pendingin (cold chain) belum merata, serta tantangan akuntabilitas per porsi menu.'
  },
  {
    id: 'topic_pilkada',
    title: 'Dinamika Koalisi Pilkada Serentak Pasca Putusan Mahkamah Konstitusi',
    category: 'Politik',
    keywords: ['Pilkada Serentak', 'Putusan MK 60', 'Ambang Batas', 'KPU Daerah', 'Kotak Kosong'],
    isTrending: false,
    trendVelocity: '+45% / hari',
    totalMentions: 62800,
    originTimestamp: '2026-09-15 14:30:19 WIB',
    activeMediaSources: ['news', 'x', 'youtube', 'forum'],
    summary: 'Perubahan konstelasi persaingan calon kepala daerah pasca Putusan Mahkamah Konstitusi No. 60/PUU-XXII/2024 yang menurunkan syarat ambang batas pencalonan menjadi 6.5%–10% suara sah. Putusan ini membuka peluang partai non-koalisi gemuk di DKI Jakarta, Jawa Barat, Jawa Tengah, dan Sumatera Utara.',
    proArguments: 'Memberi masyarakat opsi kepemimpinan kompetitif yang sehat, memulihkan marwah kontestasi demokratis, dan meniadakan monopoli tiket borongan melawan kotak kosong.',
    contraArguments: 'Menuntut kewaspadaan tinggi dari Bawaslu terhadap potensi polarisasi identitas di sisa masa kampanye yang padat dan pencegahan politik uang di akar rumput.'
  }
]

const SEED_ORIGIN_POSTS: Record<string, OriginPost> = {
  topic_ppn12: {
    id: 'orig_01',
    topicId: 'topic_ppn12',
    platform: 'x',
    authorHandle: '@fiskal_rakyat',
    authorName: 'Rangga P. Danubrata',
    authorRole: 'Peneliti Kebijakan Publik Independen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: '🚨 BREAKING: Simulasi internal kenaikan PPN jadi 12% per 1 Januari ini bukan cuma kena barang mewah, tapi merembes ke biaya logistik bahan pangan pokok. Efek inflasi riil bisa tembus 2.8% di Q1! Utas analisis perhitungannya di bawah 🧵👇 #TolakPPN12',
    publishedAt: '2026-09-18 07:14:22 WIB',
    timeAgo: '4 hari lalu (Timestamp Zero)',
    reach: 342000,
    engagement: 18900,
    url: 'https://x.com/fiskal_rakyat/status/1836291048192',
    isVerifiedOrigin: true
  },
  topic_mbg: {
    id: 'orig_02',
    topicId: 'topic_mbg',
    platform: 'news',
    authorHandle: 'Antara News',
    authorName: 'Redaksi Antara Kantor Berita',
    authorRole: 'Media Arus Utama',
    avatar: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop&q=80',
    content: 'Badan Gizi Nasional resmikan 120 Satuan Pelayanan Dapur Terpadu di 14 provinsi untuk uji coba penuh distribusi makan bergizi gratis bagi 1,2 juta siswa.',
    publishedAt: '2026-09-19 11:05:08 WIB',
    timeAgo: '3 hari lalu (Timestamp Zero)',
    reach: 520000,
    engagement: 12400,
    url: 'https://antaranews.com/berita/mbg-nasional-resmi',
    isVerifiedOrigin: true
  },
  topic_pilkada: {
    id: 'orig_03',
    topicId: 'topic_pilkada',
    platform: 'x',
    authorHandle: '@politik_kritis',
    authorName: 'Ardiansyah Siregar',
    authorRole: 'Pengamat Tata Negara',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Peta pertarungan Pilgub Jakarta berubah total. Tanpa tiket borongan, partai-partai menengah kini punya daya tawar mengajukan figur teknokrat.',
    publishedAt: '2026-09-15 14:30:19 WIB',
    timeAgo: '7 hari lalu (Timestamp Zero)',
    reach: 180000,
    engagement: 8200,
    url: 'https://x.com/politik_kritis/status/183592109',
    isVerifiedOrigin: true
  }
}

const SEED_AMPLIFICATION_NODES: Record<string, AmplificationNode[]> = {
  topic_ppn12: [
    {
      id: 'node_origin',
      authorHandle: '@fiskal_rakyat',
      authorName: 'Rangga P. Danubrata',
      role: 'origin',
      platform: 'x',
      publishedAt: '07:14:22 WIB',
      delaySec: 0,
      similarityScore: 1.0,
      reach: 342000,
      sentiment: 'negative',
      contentSnippet: 'BREAKING: Simulasi internal kenaikan PPN jadi 12%...'
    },
    {
      id: 'node_kol_1',
      authorHandle: '@dian_ekonomi',
      authorName: 'Dian Sastrodimedjo (KOL)',
      role: 'kol',
      platform: 'x',
      publishedAt: '07:22:15 WIB',
      delaySec: 473,
      similarityScore: 0.88,
      reach: 610000,
      sentiment: 'negative',
      contentSnippet: 'Thread bagus dari @fiskal_rakyat. Kelas menengah beneran lagi diperas dari segala arah...'
    },
    {
      id: 'node_bot_cluster_1',
      authorHandle: '@suararakyat_99 & 14 Akun Serentak',
      authorName: 'Amplifier Ring Alpha (Buzzer/Bot)',
      role: 'bot_suspect',
      platform: 'x',
      publishedAt: '07:28:40 WIB',
      delaySec: 858,
      similarityScore: 0.96,
      reach: 215000,
      sentiment: 'negative',
      contentSnippet: 'Tolak PPN 12%! Kenaikan ini mencekik rakyat kecil dan pelaku usaha!'
    },
    {
      id: 'node_news_1',
      authorHandle: 'Kompas.com Digital',
      authorName: 'Kompas Cyber Media',
      role: 'news_media',
      platform: 'news',
      publishedAt: '08:45:10 WIB',
      delaySec: 5448,
      similarityScore: 0.74,
      reach: 1200000,
      sentiment: 'neutral',
      contentSnippet: 'Viral Simulasi Dampak Kenaikan PPN 12 Persen, Begini Tanggapan Kemenkeu'
    },
    {
      id: 'node_tiktok_1',
      authorHandle: '@melek_finansial',
      authorName: 'Finansial Harian (TikTok)',
      role: 'amplifier',
      platform: 'tiktok',
      publishedAt: '09:12:00 WIB',
      delaySec: 7058,
      similarityScore: 0.65,
      reach: 480000,
      sentiment: 'negative',
      contentSnippet: 'Studi kasus belanja bulanan kalau PPN naik jadi 12%. Hemat di mana lagi guys?'
    },
    {
      id: 'node_youtube_1',
      authorHandle: 'Kanal Bisnis Mandiri',
      authorName: 'Kanal Bisnis Mandiri (YouTube)',
      role: 'amplifier',
      platform: 'youtube',
      publishedAt: '10:30:25 WIB',
      delaySec: 11763,
      similarityScore: 0.61,
      reach: 310000,
      sentiment: 'neutral',
      contentSnippet: 'Podcast Analisa Pajak 12%: Solusi Fiskal atau Pemicu Resesi?'
    }
  ],
  topic_mbg: [
    {
      id: 'node_origin',
      authorHandle: 'Antara News',
      authorName: 'Redaksi Antara Kantor Berita',
      role: 'origin',
      platform: 'news',
      publishedAt: '11:05:08 WIB',
      delaySec: 0,
      similarityScore: 1.0,
      reach: 520000,
      sentiment: 'positive',
      contentSnippet: 'Badan Gizi Nasional resmikan 120 Satuan Pelayanan Dapur Terpadu...'
    },
    {
      id: 'node_kol_1',
      authorHandle: '@dr_tirta_gizi',
      authorName: 'dr. Tirta W. (KOL Kesehatan)',
      role: 'kol',
      platform: 'x',
      publishedAt: '11:18:42 WIB',
      delaySec: 814,
      similarityScore: 0.82,
      reach: 780000,
      sentiment: 'positive',
      contentSnippet: 'Program MBG jika diawasi standar HACCP dan higienitasnya ketat akan jadi lompatan gizi generasi muda.'
    },
    {
      id: 'node_bot_cluster_1',
      authorHandle: '@anak_sehat_99 & 12 Akun Serentak',
      authorName: 'Amplifier Ring MBG (Bot Network)',
      role: 'bot_suspect',
      platform: 'x',
      publishedAt: '11:24:10 WIB',
      delaySec: 1142,
      similarityScore: 0.94,
      reach: 190000,
      sentiment: 'positive',
      contentSnippet: 'Dukung penuh Makan Bergizi Gratis untuk anak bangsa! Menuju Indonesia Emas 2045!'
    },
    {
      id: 'node_news_1',
      authorHandle: 'Detik.com Edukasi',
      authorName: 'Detik Network',
      role: 'news_media',
      platform: 'news',
      publishedAt: '12:05:30 WIB',
      delaySec: 3622,
      similarityScore: 0.77,
      reach: 950000,
      sentiment: 'neutral',
      contentSnippet: 'Uji Coba Makan Bergizi Gratis di 14 Provinsi, Menu Disusun Bersama Ahli Gizi'
    },
    {
      id: 'node_tiktok_1',
      authorHandle: '@dapur_mbg_official',
      authorName: 'Kilas Dapur Nusantara',
      role: 'amplifier',
      platform: 'tiktok',
      publishedAt: '12:45:00 WIB',
      delaySec: 5992,
      similarityScore: 0.68,
      reach: 620000,
      sentiment: 'positive',
      contentSnippet: 'Spill menu MBG hari pertama di SD Percobaan: ayam bumbu kuning, tumis buncis, buah pepaya, dan susu!'
    },
    {
      id: 'node_youtube_1',
      authorHandle: 'Narasi TV Official',
      authorName: 'Narasi Newsroom (YouTube)',
      role: 'amplifier',
      platform: 'youtube',
      publishedAt: '14:20:15 WIB',
      delaySec: 11707,
      similarityScore: 0.63,
      reach: 410000,
      sentiment: 'neutral',
      contentSnippet: 'Investigasi Dapur MBG: Bagaimana Memastikan Transparansi Rp15.000 per Porsi?'
    }
  ],
  topic_pilkada: [
    {
      id: 'node_origin',
      authorHandle: '@politik_kritis',
      authorName: 'Ardiansyah Siregar',
      role: 'origin',
      platform: 'x',
      publishedAt: '14:30:19 WIB',
      delaySec: 0,
      similarityScore: 1.0,
      reach: 180000,
      sentiment: 'neutral',
      contentSnippet: 'Peta pertarungan Pilgub Jakarta berubah total. Tanpa tiket borongan, partai menengah kini punya daya tawar.'
    },
    {
      id: 'node_kol_1',
      authorHandle: '@burhan_muhtadi',
      authorName: 'Burhanuddin M. (KOL Elektoral)',
      role: 'kol',
      platform: 'x',
      publishedAt: '14:48:05 WIB',
      delaySec: 1066,
      similarityScore: 0.85,
      reach: 890000,
      sentiment: 'neutral',
      contentSnippet: 'Putusan MK membuka kompetisi multipartai yang lebih sehat di Pilkada tingkat provinsi dan kabupaten/kota.'
    },
    {
      id: 'node_bot_cluster_1',
      authorHandle: '@relawan_muda_demokrasi & 18 Akun',
      authorName: 'Relawan Digital Cluster',
      role: 'bot_suspect',
      platform: 'x',
      publishedAt: '14:59:30 WIB',
      delaySec: 1751,
      similarityScore: 0.93,
      reach: 280000,
      sentiment: 'positive',
      contentSnippet: 'Kawal putusan MK! Saatnya figur pemimpin muda dan berintegritas maju tanpa halangan dinasti!'
    },
    {
      id: 'node_news_1',
      authorHandle: 'CNN Indonesia',
      authorName: 'CNN Digital Indonesia',
      role: 'news_media',
      platform: 'news',
      publishedAt: '16:15:00 WIB',
      delaySec: 6281,
      similarityScore: 0.72,
      reach: 1400000,
      sentiment: 'neutral',
      contentSnippet: 'Daftar Calon Kepala Daerah yang Diuntungkan Ambang Batas Baru Pasca Putusan Mahkamah Konstitusi'
    },
    {
      id: 'node_tiktok_1',
      authorHandle: '@suara_demokrasi',
      authorName: 'Debat Publik Pilkada (TikTok)',
      role: 'amplifier',
      platform: 'tiktok',
      publishedAt: '17:10:20 WIB',
      delaySec: 9601,
      similarityScore: 0.66,
      reach: 530000,
      sentiment: 'neutral',
      contentSnippet: 'Penjelasan mudah dampak putusan MK untuk Pilkada daerahmu dalam 60 detik!'
    },
    {
      id: 'node_youtube_1',
      authorHandle: 'Total Politik TV',
      authorName: 'Total Politik Podcast (YouTube)',
      role: 'amplifier',
      platform: 'youtube',
      publishedAt: '19:00:00 WIB',
      delaySec: 16181,
      similarityScore: 0.60,
      reach: 460000,
      sentiment: 'neutral',
      contentSnippet: 'Blak-blakan Koalisi Goyang: Siapa yang Diuntungkan Kotak Kosong Batal?'
    }
  ]
}

const SEED_AMPLIFICATION_EDGES: Record<string, AmplificationEdge[]> = {
  topic_ppn12: [
    { source: 'node_origin', target: 'node_kol_1', type: 'quote', similarity: 0.88 },
    { source: 'node_kol_1', target: 'node_bot_cluster_1', type: 'duplicate_copy', similarity: 0.96 },
    { source: 'node_kol_1', target: 'node_news_1', type: 'news_coverage', similarity: 0.74 },
    { source: 'node_origin', target: 'node_tiktok_1', type: 'duplicate_copy', similarity: 0.65 },
    { source: 'node_news_1', target: 'node_youtube_1', type: 'news_coverage', similarity: 0.61 }
  ],
  topic_mbg: [
    { source: 'node_origin', target: 'node_kol_1', type: 'quote', similarity: 0.82 },
    { source: 'node_kol_1', target: 'node_bot_cluster_1', type: 'duplicate_copy', similarity: 0.94 },
    { source: 'node_origin', target: 'node_news_1', type: 'news_coverage', similarity: 0.77 },
    { source: 'node_news_1', target: 'node_tiktok_1', type: 'duplicate_copy', similarity: 0.68 },
    { source: 'node_news_1', target: 'node_youtube_1', type: 'news_coverage', similarity: 0.63 }
  ],
  topic_pilkada: [
    { source: 'node_origin', target: 'node_kol_1', type: 'quote', similarity: 0.85 },
    { source: 'node_kol_1', target: 'node_bot_cluster_1', type: 'duplicate_copy', similarity: 0.93 },
    { source: 'node_kol_1', target: 'node_news_1', type: 'news_coverage', similarity: 0.72 },
    { source: 'node_origin', target: 'node_tiktok_1', type: 'duplicate_copy', similarity: 0.66 },
    { source: 'node_news_1', target: 'node_youtube_1', type: 'news_coverage', similarity: 0.60 }
  ]
}

const SEED_REGIONAL_STATS: Record<string, RegionalIssueStat[]> = {
  topic_ppn12: [
    { provinceCode: '32', provinceName: 'Jawa Barat', mentionCount: 42300, intensity: 'very_high', dominantSentiment: 'negative', localHeadline: 'Buruh Industri Tekstil Karawang & Bekasi Suarakan Penolakan PPN 12%' },
    { provinceCode: '31', provinceName: 'DKI Jakarta', mentionCount: 38900, intensity: 'very_high', dominantSentiment: 'negative', localHeadline: 'Pelaku Usaha Kafe dan Ritel Jakarta Soroti Potensi Penurunan Omzet' },
    { provinceCode: '35', provinceName: 'Jawa Timur', mentionCount: 24100, intensity: 'high', dominantSentiment: 'negative', localHeadline: 'Gubernur & Asosiasi UMKM Jatim Siapkan Skema Insentif Pajak Daerah' },
    { provinceCode: '33', provinceName: 'Jawa Tengah', mentionCount: 19800, intensity: 'high', dominantSentiment: 'neutral', localHeadline: 'Disperindag Jateng Pastikan Pasokan Sembako Aman di Tengah Isu Kenaikan PPN' },
    { provinceCode: '12', provinceName: 'Sumatera Utara', mentionCount: 11400, intensity: 'medium', dominantSentiment: 'negative', localHeadline: 'Kamar Dagang Medan: Sektor Distribusi Rentan Kena Tekanan Tambahan' },
    { provinceCode: '73', provinceName: 'Sulawesi Selatan', mentionCount: 8200, intensity: 'medium', dominantSentiment: 'neutral', localHeadline: 'Pengamat Ekonomi Unhas Beri Catatan Kritis Terkait Keadilan Fiskal' },
    { provinceCode: '51', provinceName: 'Bali', mentionCount: 3500, intensity: 'low', dominantSentiment: 'neutral', localHeadline: 'Pelaku Pariwisata Harapkan Jasa Hiburan Tidak Terkena Imbas Berlebih' }
  ],
  topic_mbg: [
    { provinceCode: '32', provinceName: 'Jawa Barat', mentionCount: 31200, intensity: 'very_high', dominantSentiment: 'positive', localHeadline: '18 Dapur Satuan Pelayanan Diresmikan di Sukabumi & Cianjur' },
    { provinceCode: '33', provinceName: 'Jawa Tengah', mentionCount: 26400, intensity: 'very_high', dominantSentiment: 'positive', localHeadline: 'Peternak Telur & Sayur Banyumas Siap Jadi Pemasok Utama MBG' },
    { provinceCode: '35', provinceName: 'Jawa Timur', mentionCount: 21800, intensity: 'high', dominantSentiment: 'positive', localHeadline: 'Uji Coba Sekolah Pesisir Probolinggo Tunjukkan Antusiasme Siswa Tinggi' },
    { provinceCode: '53', provinceName: 'Nusa Tenggara Timur', mentionCount: 14500, intensity: 'high', dominantSentiment: 'positive', localHeadline: 'Fokus MBG di Daerah Rentan Stunting Pulau Timor & Sumba' },
    { provinceCode: '13', provinceName: 'Sumatera Barat', mentionCount: 8900, intensity: 'medium', dominantSentiment: 'neutral', localHeadline: 'Dinas Pendidikan Padang Evaluasi Kesiapan Kantin Sehat Pendukung' },
    { provinceCode: '73', provinceName: 'Sulawesi Selatan', mentionCount: 6700, intensity: 'low', dominantSentiment: 'positive', localHeadline: 'Kerjasama Dapur Satuan dengan Koperasi Pangan Makassar' }
  ],
  topic_pilkada: [
    { provinceCode: '31', provinceName: 'DKI Jakarta', mentionCount: 36400, intensity: 'very_high', dominantSentiment: 'neutral', localHeadline: 'Peta Tiga Poros Pilgub Jakarta Pasca Pengesahan Syarat Suara Sah' },
    { provinceCode: '32', provinceName: 'Jawa Barat', mentionCount: 28900, intensity: 'very_high', dominantSentiment: 'neutral', localHeadline: 'Pertarungan Sengit Figur Populer di Wilayah Megapolitan Botabek' },
    { provinceCode: '33', provinceName: 'Jawa Tengah', mentionCount: 22100, intensity: 'high', dominantSentiment: 'neutral', localHeadline: 'Kompetisi Terbuka di Basis Tradisional Parpol' },
    { provinceCode: '12', provinceName: 'Sumatera Utara', mentionCount: 16800, intensity: 'high', dominantSentiment: 'negative', localHeadline: 'KPU Sumut Perpanjang Pendaftaran di Sejumlah Daerah Rawan Tunggal' },
    { provinceCode: '36', provinceName: 'Banten', mentionCount: 11200, intensity: 'medium', dominantSentiment: 'neutral', localHeadline: 'Geliat Calon Alternatif Menentang Polarisasi Kekuatan Lama' }
  ]
}

export interface NewTopicInput {
  title: string
  category: MonitoredTopic['category']
  keywords: string[]
  query?: string
  entityFilter?: string[]
}

const CUSTOM_TOPICS_STORAGE_KEY = 'isumedia_custom_topics'
const ALL_PLATFORMS: PlatformType[] = ['news', 'x', 'youtube', 'tiktok', 'forum']

function formatQuotes(quotes: NarrativeQuote[], emptyText: string): string {
  if (!quotes.length) return emptyText
  return quotes.map(q => `“${q.text}” — ${q.source}`).join(' • ')
}

function hasLiveData(analysis?: IssueAnalysis): analysis is IssueAnalysis {
  return !!analysis && analysis.totalPosts > 0
}

export function useIssueTracker() {
  const { analysisByTopic } = useScraperStream()

  const topics = ref<MonitoredTopic[]>([...SEED_TOPICS])
  const activeTopicId = ref<string>('topic_ppn12')
  const filterMediaSources = ref<PlatformType[]>([...ALL_PLATFORMS])
  const searchQuery = ref('')

  // Data seed hanya untuk topik bawaan saat analisa live belum/tidak tersedia (mode offline)
  const seedOrigins: Record<string, OriginPost> = SEED_ORIGIN_POSTS
  const seedNodes: Record<string, AmplificationNode[]> = SEED_AMPLIFICATION_NODES
  const seedEdges: Record<string, AmplificationEdge[]> = SEED_AMPLIFICATION_EDGES
  const seedRegional: Record<string, RegionalIssueStat[]> = SEED_REGIONAL_STATS

  const activeAnalysis = computed<IssueAnalysis | null>(() => {
    const analysis = analysisByTopic.value[activeTopicId.value]
    return hasLiveData(analysis) ? analysis : null
  })

  /** 'live' = hasil perayapan & analisa riil, 'seed' = data contoh offline, 'empty' = belum ada data */
  const dataSource = computed<'live' | 'seed' | 'empty'>(() => {
    if (activeAnalysis.value) return 'live'
    return seedOrigins[activeTopicId.value] ? 'seed' : 'empty'
  })

  function withLiveData(base: MonitoredTopic): MonitoredTopic {
    const analysis = analysisByTopic.value[base.id]
    if (!hasLiveData(analysis)) return base
    const sign = analysis.trend.velocityPct > 0 ? '+' : ''
    return {
      ...base,
      isTrending: analysis.trend.isTrending,
      trendVelocity: `${sign}${analysis.trend.velocityPct}% / 24 jam`,
      totalMentions: analysis.totalPosts,
      originTimestamp: analysis.origin?.publishedAt ?? base.originTimestamp,
      summary: analysis.narrative.summary,
      proArguments: formatQuotes(analysis.narrative.pro, 'Belum ada publikasi bernada mendukung yang terdeteksi.'),
      contraArguments: formatQuotes(analysis.narrative.contra, 'Belum ada publikasi bernada kritis yang terdeteksi.')
    }
  }

  /** Daftar topik untuk Trending Issues Board; topik yang sudah dirayapi memakai metrik live */
  const topicCards = computed(() => topics.value.map(withLiveData))

  const activeTopic = computed<MonitoredTopic>(() => {
    return withLiveData(topics.value.find(t => t.id === activeTopicId.value) || topics.value[0])
  })

  const activeOrigin = computed<OriginPost | null>(() => {
    if (activeAnalysis.value) return activeAnalysis.value.origin
    return seedOrigins[activeTopicId.value] ?? null
  })

  const activeNodes = computed(() => {
    const rawNodes = activeAnalysis.value?.nodes ?? seedNodes[activeTopicId.value] ?? []
    return rawNodes.filter(n => n.role === 'origin' || filterMediaSources.value.includes(n.platform))
  })

  const activeEdges = computed(() => {
    const nodeIds = new Set(activeNodes.value.map(n => n.id))
    const rawEdges = activeAnalysis.value?.edges ?? seedEdges[activeTopicId.value] ?? []
    return rawEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  })

  const regionalStats = computed(() => {
    return activeAnalysis.value?.regional ?? seedRegional[activeTopicId.value] ?? []
  })

  const duplicateClusterSummary = computed(() => {
    const nodes = activeNodes.value
    const analysis = activeAnalysis.value
    return {
      totalNodes: nodes.length,
      suspectedAmplifiers: nodes.filter(n => n.role === 'bot_suspect').length,
      duplicationIndexPct: analysis
        ? Math.round(analysis.duplication.index * 100)
        : Math.round((nodes.filter(n => n.similarityScore > 0.85).length / (nodes.length || 1)) * 100),
      averageSimilarityPct: analysis ? Math.round(analysis.duplication.averageSimilarity * 100) : null,
      fastestAmplificationDelaySec: analysis?.duplication.fastestDelaySec ?? null
    }
  })

  function toggleMediaSource(platform: PlatformType) {
    const idx = filterMediaSources.value.indexOf(platform)
    if (idx > -1) {
      if (filterMediaSources.value.length > 1) {
        filterMediaSources.value.splice(idx, 1)
      }
    } else {
      filterMediaSources.value.push(platform)
    }
  }

  function saveCustomTopicsCache() {
    try {
      const custom = topics.value.filter(t => !SEED_TOPICS.some(s => s.id === t.id))
      localStorage.setItem(CUSTOM_TOPICS_STORAGE_KEY, JSON.stringify(custom))
    } catch (err) {
      console.warn('[Custom Topic Cache]:', err)
    }
  }

  async function createCustomTopic(input: NewTopicInput) {
    const topic: MonitoredTopic = {
      id: 'custom_' + Date.now().toString(36),
      title: input.title,
      category: input.category,
      keywords: input.keywords,
      query: input.query || undefined,
      entityFilter: input.entityFilter?.length ? input.entityFilter : undefined,
      isTrending: false,
      trendVelocity: 'Menunggu data',
      totalMentions: 0,
      originTimestamp: 'Menunggu perayapan pertama',
      activeMediaSources: [...ALL_PLATFORMS],
      summary: `Pemantauan kustom untuk ${input.query ? `kueri ${input.query}` : `kata kunci: ${input.keywords.join(', ')}`}. Analisa muncul setelah perayapan pertama selesai.`,
      proArguments: 'Menunggu data perayapan.',
      contraArguments: 'Menunggu data perayapan.'
    }

    topics.value.unshift(topic)
    activeTopicId.value = topic.id
    saveCustomTopicsCache()

    // Persist ke PocketBase via server; RBAC diverifikasi dari token sesi di server
    try {
      const res = await apiFetch<{ success: boolean; id?: string; fallback?: boolean; error?: string }>('/api/topics/create', {
        method: 'POST',
        body: {
          title: topic.title,
          category: topic.category,
          keywords: topic.keywords,
          query: topic.query,
          entityFilter: topic.entityFilter,
          summary: topic.summary
        }
      })
      if (res.success && res.id) {
        const oldId = topic.id
        const stored = topics.value.find(t => t.id === oldId)
        if (stored) stored.id = res.id
        if (activeTopicId.value === oldId) activeTopicId.value = res.id
        saveCustomTopicsCache()
      } else if (!res.success) {
        console.warn('[Topic Persistence]:', res.error)
      }
    } catch (err: any) {
      console.warn('[Topic Persistence]:', err?.data?.statusMessage || err?.message)
    }
  }

  const isCustomTopic = (id: string) => !SEED_TOPICS.some(s => s.id === id)

  async function archiveTopic(id: string) {
    if (!isCustomTopic(id)) return
    topics.value = topics.value.filter(t => t.id !== id)
    if (activeTopicId.value === id) activeTopicId.value = topics.value[0]?.id ?? ''
    saveCustomTopicsCache()
    if (id.startsWith('custom_')) return
    try {
      await apiFetch(`/api/topics/${id}/archive`, { method: 'POST' })
    } catch (err: any) {
      console.warn('[Topic Archive]:', err?.data?.statusMessage || err?.message)
    }
  }

  async function loadPersistedTopics() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(CUSTOM_TOPICS_STORAGE_KEY)
      if (stored) {
        const cached: MonitoredTopic[] = JSON.parse(stored)
        for (const item of cached) {
          if (!topics.value.some(t => t.id === item.id || t.title.toLowerCase() === item.title.toLowerCase())) {
            topics.value.push(item)
          }
        }
      }
    } catch {
      localStorage.removeItem(CUSTOM_TOPICS_STORAGE_KEY)
    }

    const res = await apiFetch<{ success: boolean; topics: any[] }>('/api/topics/list').catch(() => null)
    if (!res?.success || !Array.isArray(res.topics)) return
    for (const r of res.topics) {
      if (topics.value.some(t => t.id === r.id || t.title.toLowerCase() === r.title.toLowerCase())) continue
      topics.value.push({
        id: r.id,
        title: r.title,
        category: r.category || 'Ekonomi',
        keywords: Array.isArray(r.keywords) ? r.keywords : [r.title],
        query: r.query || undefined,
        entityFilter: Array.isArray(r.entity_filter) && r.entity_filter.length ? r.entity_filter : undefined,
        isTrending: !!r.is_trending,
        trendVelocity: r.trend_velocity || 'Menunggu data',
        totalMentions: r.total_mentions || 0,
        originTimestamp: r.origin_timestamp || 'Menunggu perayapan',
        activeMediaSources: Array.isArray(r.media_filter) ? r.media_filter : [...ALL_PLATFORMS],
        summary: r.summary || `Pemantauan isu: ${r.title}`,
        proArguments: r.pro_arguments || 'Menunggu data perayapan.',
        contraArguments: r.contra_arguments || 'Menunggu data perayapan.'
      })
    }
  }

  onMounted(() => {
    loadPersistedTopics()
  })

  return {
    topics,
    topicCards,
    activeTopicId,
    activeTopic,
    activeAnalysis,
    dataSource,
    activeOrigin,
    activeNodes,
    activeEdges,
    regionalStats,
    duplicateClusterSummary,
    filterMediaSources,
    searchQuery,
    toggleMediaSource,
    createCustomTopic,
    archiveTopic,
    isCustomTopic
  }
}
