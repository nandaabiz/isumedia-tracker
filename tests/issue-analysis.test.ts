import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeIssue,
  analyzeSentiment,
  detectProvinces,
  jaccardSimilarity,
  levenshteinDistance,
  matchesQuery,
  parseBooleanQuery,
  textSimilarity,
  toSearchEngineQuery,
  keywordsToQuery,
  extractEntities,
  type AnalysisInputPost
} from '../lib/issue-analysis.ts'

test('jaccard & levenshtein dasar', () => {
  assert.equal(jaccardSimilarity('tarif PPN naik', 'tarif PPN naik'), 1)
  assert.equal(jaccardSimilarity('harga beras', 'kursi dewan'), 0)
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3)
  assert.ok(textSimilarity('Pemerintah tetapkan PPN 12 persen', 'Pemerintah tetapkan PPN 12 persen mulai Januari') > 0.7)
})

test('boolean query AND/OR/NOT, frasa, kurung', () => {
  const q = parseBooleanQuery('"makan bergizi" AND (sekolah OR siswa) NOT hoaks')
  assert.ok(matchesQuery(q, 'Program makan bergizi gratis di sekolah dasar'))
  assert.ok(!matchesQuery(q, 'Program makan bergizi gratis di sekolah ternyata hoaks'))
  assert.ok(!matchesQuery(q, 'Makan siang pegawai di kantor'))
  assert.ok(matchesQuery(parseBooleanQuery('ppn -sembako'), 'Tarif PPN naik'))
  assert.throws(() => parseBooleanQuery('(ppn OR pajak'))
  assert.throws(() => parseBooleanQuery('ppn AND'))
  assert.equal(toSearchEngineQuery(parseBooleanQuery('(ppn OR "daya beli") NOT hoaks')), '(ppn OR "daya beli") -hoaks')
  assert.equal(keywordsToQuery(['PPN 12%', 'sembako']), '"PPN 12%" OR sembako')
})

test('sentimen dengan negasi', () => {
  assert.equal(analyzeSentiment('Warga mendukung program yang bermanfaat').sentiment, 'positive')
  assert.equal(analyzeSentiment('Buruh menolak kenaikan pajak yang membebani').sentiment, 'negative')
  assert.equal(analyzeSentiment('Kebijakan ini tidak efektif').sentiment, 'negative')
  assert.equal(analyzeSentiment('Rapat digelar Senin pagi').sentiment, 'neutral')
})

test('NER provinsi: alias terpanjang & case-sensitive', () => {
  assert.deepEqual(detectProvinces('Banjir melanda Papua Barat Daya dan Sorong').sort(), ['96'])
  assert.deepEqual(detectProvinces('Demo di Surabaya dan Bandung').sort(), ['32', '35'])
  assert.deepEqual(detectProvinces('Nasib malang pedagang di medan pertempuran'), [])
  assert.deepEqual(detectProvinces('Kampanye di Jateng dan DIY'), ['33', '34'])
})

function post(id: string, minutes: number, title: string, source: string): AnalysisInputPost {
  return {
    id,
    title,
    content: title,
    url: `https://example.test/${id}`,
    source,
    authorHandle: '@' + source.toLowerCase().replace(/\W/g, ''),
    platform: 'news',
    publishedAt: new Date(Date.UTC(2026, 9, 20, 0, minutes, 0)).toISOString(),
    reach: 0,
    engagement: 0
  }
}

test('analyzeIssue: origin, graf, duplikasi, wilayah', () => {
  const posts = [
    post('c', 30, 'Pemerintah resmi naikkan PPN 12 persen, buruh Jawa Barat menolak', 'Media C'),
    post('a', 0, 'Pemerintah resmi naikkan PPN 12 persen mulai Januari', 'Media A'),
    post('b', 10, 'Pemerintah resmi naikkan PPN 12 persen mulai Januari', 'Media B'),
    post('d', 50, 'Harga sembako di Surabaya naik, pedagang mengeluh', 'Media D')
  ]
  const now = Date.UTC(2026, 9, 20, 12, 0, 0)
  const r = analyzeIssue('t1', posts, now)

  assert.equal(r.origin?.id, 'a')
  assert.equal(r.origin?.publishedAt, '2026-10-20 07:00:00 WIB')
  assert.equal(r.nodes[0].role, 'origin')
  const b = r.nodes.find(n => n.id === 'b')!
  assert.equal(b.parentId, 'a')
  assert.equal(b.role, 'bot_suspect')
  assert.equal(b.delaySec, 600)
  assert.equal(r.edges.length, posts.length - 1)
  assert.ok(r.duplication.copyPasteCount >= 1)
  assert.equal(r.duplication.fastestDelaySec, 600)
  assert.deepEqual(r.regional.map(x => x.provinceCode).sort(), ['32', '35'])
  assert.equal(r.regional.find(x => x.provinceCode === '32')!.posts!.length, 1)
  assert.equal(r.sentiment.positive + r.sentiment.neutral + r.sentiment.negative, 100)
  assert.ok(r.keyPhrases.some(k => k.phrase.includes('ppn')))
  assert.equal(r.trend.last24h, 4)
  assert.equal(r.timeline.length, 1)
  assert.equal(r.timeline[0].date, '2026-10-20')
  const day = r.timeline[0]
  assert.equal(day.positive + day.neutral + day.negative, 4)
})

test('analyzeIssue tanpa data mengembalikan struktur kosong', () => {
  const r = analyzeIssue('kosong', [])
  assert.equal(r.origin, null)
  assert.equal(r.nodes.length, 0)
})

test('entitas yang saling memuat dideduplikasi', () => {
  const docs = [
    'Jaga Daya Beli Masyarakat lewat Gerakan Pangan Murah',
    'Jaga Daya Beli Masyarakat, BI turunkan suku bunga',
    'Gerakan Pangan Murah digelar BI'
  ]
  const entities = extractEntities(docs).map(e => e.entity)
  assert.ok(entities.includes('BI'))
  assert.equal(entities.filter(e => e.toLowerCase().includes('daya beli')).length, 1)
})

test('entitas: frasa umum ber-Title Case & akronim generik diabaikan', () => {
  const docs = [
    'Humas Polri Salurkan Paket Sembako di HUT ke-79',
    'Humas Polri bagikan paket sembako untuk warga',
    'Polri salurkan paket sembako, PT Pos bantu distribusi',
    'PT Pos dan Humas Polri gelar bakti sosial III'
  ]
  const entities = extractEntities(docs).map(e => e.entity)
  assert.ok(entities.includes('Humas Polri'))
  assert.ok(!entities.includes('Paket Sembako'))
  assert.ok(!entities.includes('HUT'))
  assert.ok(!entities.includes('III'))
})
