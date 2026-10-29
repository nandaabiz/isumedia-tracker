import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LATEST_ISSUE_ID_PREFIX, parseNewsFeed, pickCategoryThemes, toThemeTopic, type FeedItem } from '../lib/latest-issues.ts'

const rssItem = (title: string, source: string, pubDate: string) => `<item>
<title>${title} - ${source}</title><link>https://news.google.com/rss/articles/${encodeURIComponent(title)}</link>
<guid isPermaLink="false">${encodeURIComponent(title)}</guid><pubDate>${pubDate}</pubDate>
<description>&lt;a href="https://x"&gt;${title}&lt;/a&gt;</description><source url="https://example.com">${source}</source></item>`

test('feed Google Berita diparse: sufiks media dibuang, entitas didekode, item tanpa pubDate dilewati', () => {
  const xml = `<rss><channel><title>Feed</title>
${rssItem('Banjir Rendam Bekasi &amp; Depok', 'Detik', 'Thu, 29 Oct 2026 11:00:00 GMT')}
<item><title>Tanpa tanggal</title></item></channel></rss>`
  const items = parseNewsFeed(xml)
  assert.equal(items.length, 1)
  assert.equal(items[0].title, 'Banjir Rendam Bekasi & Depok')
  assert.equal(items[0].source, 'Detik')
  assert.equal(items[0].publishedAt, '2026-10-29T11:00:00.000Z')
})

const article = (title: string, hour: number, source = 'Media'): FeedItem => ({
  guid: title,
  title,
  source,
  publishedAt: `2026-10-29T${String(hour).padStart(2, '0')}:00:00.000Z`
})

const lingkungan = [
  article('Banjir Rendam Ratusan Rumah di Bekasi', 1),
  article('Banjir Bekasi Belum Surut, Warga Mengungsi', 2),
  article('Warga Bekasi Perkuat Tanggul Usai Banjir', 3),
  article('BMKG Prediksi Hujan Lebat Sepekan', 4),
  article('Hujan Lebat Diprediksi BMKG Guyur Jawa', 5),
  article('Gempa Kecil Guncang Garut', 6)
]

test('tema dipilih dari kata dengan liputan terbanyak, artikel tidak dihitung dua kali, kata generik diabaikan', () => {
  const themes = pickCategoryThemes('Lingkungan', lingkungan)
  assert.equal(themes.length, 2)
  assert.deepEqual(themes[0].terms, ['banjir', 'bekasi'])
  assert.equal(themes[0].label, 'Banjir Bekasi')
  assert.equal(themes[0].articles.length, 3)
  assert.equal(themes[0].articles[0].title, 'Warga Bekasi Perkuat Tanggul Usai Banjir')
  assert.equal(themes[1].label, 'BMKG Hujan')
})

test('kata kategori/jabatan umum tidak jadi tema; pendamping lemah tidak ditempel ke label', () => {
  const themes = pickCategoryThemes('Politik', [
    article('Presiden Lantik Menteri Baru', 1),
    article('Presiden Kunjungi Papua', 2),
    article('Presiden Bahas APBN', 3),
    article('DPR Sahkan RUU Pemilu', 4),
    article('DPR Kritik Anggaran Pertahanan', 5),
    article('Fraksi DPR Tolak Revisi', 6)
  ])
  assert.equal(themes[0].label, 'DPR')
  assert.ok(themes.every(t => !t.terms.includes('presiden')))
})

test('kategori tanpa kata berulang tidak menghasilkan tema', () => {
  assert.deepEqual(pickCategoryThemes('Ekonomi', [article('Rupiah Menguat', 1), article('Harga Cabai Turun', 2)]), [])
})

test('tema dipetakan ke topik pantauan dengan id stabil dan kueri gabungan', () => {
  const [theme] = pickCategoryThemes('Lingkungan', lingkungan)
  const topic = toThemeTopic(theme)
  assert.equal(topic.id, `${LATEST_ISSUE_ID_PREFIX}lingkungan_banjir_bekasi`)
  assert.equal(topic.category, 'Lingkungan')
  assert.equal(topic.query, 'banjir AND bekasi')
  assert.equal(topic.totalMentions, 3)
  assert.equal(topic.trendVelocity, '3 artikel / 48 jam')
})
