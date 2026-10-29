/**
 * Isu trend per kategori dari pencarian RSS Google Berita (48 jam terakhir). Tiap kategori punya satu feed;
 * dari judul-judulnya dipilih tema dengan liputan terbanyak (kata utama + kata pendamping yang paling sering
 * muncul bersamanya), sehingga kartu isu mewakili tema umum, bukan satu headline.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP fetch ada di server/api/topics/latest.get.ts.
 */
import { decodeHtmlEntities } from './atom.ts'
import { formatWib, tokenize } from './issue-analysis.ts'
import type { MonitoredTopic, PlatformType } from '../types/issue.ts'

export const LATEST_ISSUE_ID_PREFIX = 'latest_'
export const THEMES_PER_CATEGORY = 2

type Category = MonitoredTopic['category']

export const CATEGORY_QUERIES: { category: Category; query: string }[] = [
  { category: 'Politik', query: 'politik OR DPR OR partai OR pilkada OR presiden OR menteri OR KPU' },
  { category: 'Ekonomi', query: 'ekonomi OR harga OR pajak OR rupiah OR inflasi OR saham OR BBM' },
  { category: 'Sosial & Hukum', query: 'hukum OR polisi OR KPK OR sidang OR korupsi OR demo OR kriminal' },
  { category: 'Kesejahteraan', query: 'bansos OR BPJS OR kesehatan OR pendidikan OR MBG OR gizi OR guru' },
  { category: 'Lingkungan', query: 'banjir OR gempa OR longsor OR cuaca OR BMKG OR sampah OR polusi OR iklim' }
]

export function categoryFeedUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:2d`)}&hl=id&gl=ID&ceid=ID:id`
}

const ALL_PLATFORMS: PlatformType[] = ['news', 'threads', 'x', 'youtube', 'tiktok', 'forum']

// Nama kategori dan jabatan umum terlalu luas untuk dijadikan tema
const BROAD_TERMS = new Set([
  'politik', 'ekonomi', 'hukum', 'sosial', 'kesehatan', 'pendidikan', 'lingkungan', 'kesejahteraan',
  'presiden', 'menteri', 'polisi', 'pejabat', 'ketua'
])
// Kata pendamping wajib muncul di minimal seperempat artikel tema agar label tidak menyesatkan
const PARTNER_MIN_SHARE = 0.25

// Kata kerja/keterangan khas judul berita yang tidak menggambarkan isu
const GENERIC_TERMS = new Set([
  'perkuat', 'dorong', 'gelar', 'minta', 'bahas', 'terima', 'siapkan', 'tekankan', 'ajak', 'capai', 'klaim', 'sebut',
  'ungkap', 'soroti', 'buka', 'suara', 'pastikan', 'lewat', 'melalui', 'kepada', 'bersama', 'sama', 'mulai', 'bakal',
  'siap', 'tetap', 'hanya', 'bukan', 'terkait', 'lihat', 'lainnya', 'dugaan', 'kasus', 'data', 'program', 'layanan',
  'kerja', 'kepala', 'anggota', 'warga', 'masyarakat', 'pemerintah', 'nasional', 'indonesia', 'daerah', 'kota',
  'kabupaten', 'wilayah', 'pemkab', 'pemkot', 'pemprov', 'kolaborasi', 'sinergi', 'inovasi', 'evaluasi', 'perluas',
  'potensi', 'peluang', 'waspada', 'peringatkan', 'peringatan', 'terdampak', 'berpotensi', 'disertai', 'sepekan',
  'pukul', 'wib', 'malam', 'pagi', 'siang', 'sore', 'depan', 'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember', 'kumparan', 'detikcom', 'tribunnews', 'juta',
  'miliar', 'triliun', 'persen', 'naik', 'turun', 'tembus', 'jadi', 'punya', 'beri', 'resmi', 'langsung', 'imbau'
])

export interface FeedItem {
  guid: string
  title: string
  source: string
  publishedAt: string
}

export interface IssueTheme {
  category: Category
  terms: string[]
  label: string
  articles: FeedItem[]
}

const textOf = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))?.[1]?.trim() ?? ''

/** Item RSS valid (judul & pubDate terbaca); sufiks " - Nama Media" Google Berita dibuang. */
export function parseNewsFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  for (const itemXml of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []) {
    const source = decodeHtmlEntities(textOf(itemXml, 'source'))
    let title = decodeHtmlEntities(textOf(itemXml, 'title'))
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3))
    const published = new Date(textOf(itemXml, 'pubDate'))
    if (!title || isNaN(published.getTime())) continue
    items.push({ guid: textOf(itemXml, 'guid') || textOf(itemXml, 'link') || title, title, source, publishedAt: published.toISOString() })
  }
  return items
}

function salientTerms(title: string): Set<string> {
  return new Set(tokenize(title).filter(t => t.length >= 3 && !/^\d+$/.test(t) && !GENERIC_TERMS.has(t)))
}

function mostFrequent(termSets: Set<string>[], exclude: (term: string) => boolean): { term: string; count: number } | null {
  const counts = new Map<string, number>()
  for (const terms of termSets) for (const t of terms) if (!exclude(t)) counts.set(t, (counts.get(t) ?? 0) + 1)
  let best: { term: string; count: number } | null = null
  for (const [term, count] of counts) if (!best || count > best.count) best = { term, count }
  return best
}

/** Akronim (MBG, BMKG) bila bentuk kapital mendominasi judul; judul berhuruf kapital semua tidak dihitung. */
function displayTerm(term: string, titles: string[]): string {
  const mixedCase = titles.filter(title => title !== title.toUpperCase())
  const upper = mixedCase.filter(title => new RegExp(`\\b${term.toUpperCase()}\\b`).test(title)).length
  const containing = mixedCase.filter(title => title.toLowerCase().includes(term)).length
  return upper > containing / 2 ? term.toUpperCase() : term.charAt(0).toUpperCase() + term.slice(1)
}

/**
 * `limit` tema dengan liputan terbanyak. Artikel yang sudah masuk satu tema tidak dihitung lagi untuk tema berikutnya
 * agar dua tema dalam satu kategori tidak membahas isu yang sama.
 */
export function pickCategoryThemes(category: Category, items: FeedItem[], limit = THEMES_PER_CATEGORY): IssueTheme[] {
  let remaining = items.map(item => ({ item, terms: salientTerms(item.title) }))
  const themes: IssueTheme[] = []

  while (themes.length < limit) {
    const lead = mostFrequent(remaining.map(r => r.terms), t => BROAD_TERMS.has(t))
    if (!lead || lead.count < 2) break
    const members = remaining.filter(r => r.terms.has(lead.term))
    const partner = mostFrequent(members.map(r => r.terms), t => t === lead.term || BROAD_TERMS.has(t))
    const minPartner = Math.max(2, Math.ceil(members.length * PARTNER_MIN_SHARE))
    const terms = partner && partner.count >= minPartner ? [lead.term, partner.term] : [lead.term]
    const titles = members.map(r => r.item.title)
    themes.push({
      category,
      terms,
      label: terms.map(t => displayTerm(t, titles)).join(' '),
      articles: members.map(r => r.item).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    })
    remaining = remaining.filter(r => !r.terms.has(lead.term))
  }
  return themes
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function toThemeTopic(theme: IssueTheme): MonitoredTopic {
  const [latest] = theme.articles
  const count = theme.articles.length
  return {
    id: `${LATEST_ISSUE_ID_PREFIX}${slug(theme.category)}_${slug(theme.terms.join(' '))}`,
    title: theme.label,
    category: theme.category,
    keywords: theme.terms,
    query: theme.terms.length > 1 ? theme.terms.join(' AND ') : undefined,
    isTrending: count >= 5,
    trendVelocity: `${count} artikel / 48 jam`,
    totalMentions: count,
    originTimestamp: formatWib(latest.publishedAt),
    activeMediaSources: [...ALL_PLATFORMS],
    summary: `Tema terhangat kategori ${theme.category}: ${count} artikel Google Berita dalam 48 jam terakhir. Terbaru: "${latest.title}"${latest.source ? ` (${latest.source})` : ''}. Analisa narasi muncul setelah perayapan selesai.`,
    proArguments: 'Menunggu data perayapan.',
    contraArguments: 'Menunggu data perayapan.'
  }
}
