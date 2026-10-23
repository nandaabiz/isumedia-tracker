import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsPDF } from 'jspdf'
import * as autoTableModule from 'jspdf-autotable'
import { readFileSync } from 'node:fs'
import { buildElectoralReport, buildMediaReport, demographyRows, toWinAnsi, slugify } from '../lib/report-pdf.ts'
import { analyzeIssue } from '../lib/issue-analysis.ts'
import { buildProvinces } from '../lib/electoral-data.ts'
import { detectSplitTicket } from '../lib/electoral-metrics.ts'
import { demographicVoteCorrelations } from '../lib/demography.ts'

// Interop CJS di Node membungkus default export sekali lagi
const autoTable: any = typeof (autoTableModule as any).default === 'function' ? (autoTableModule as any).default : (autoTableModule as any).default.default

test('toWinAnsi mengganti simbol di luar cp1252 dan membuang emoji', () => {
  assert.equal(toWinAnsi('Pedersen ≥ 20 → anomali 🚨'), 'Pedersen >= 20 -> anomali')
  assert.equal(toWinAnsi('“Kutipan” – Sumber'), '“Kutipan” – Sumber')
})

test('slugify nama file aman', () => {
  assert.equal(slugify('Wacana PPN 12% & Daya Beli!'), 'wacana-ppn-12-daya-beli')
})

test('laporan isu menghasilkan PDF valid', () => {
  const analysis = analyzeIssue('t', [
    { id: 'a', title: 'Pemerintah naikkan PPN 12 persen di Jakarta', content: 'x', url: 'https://e.test/a', source: 'Media A', authorHandle: '@a', platform: 'news', publishedAt: '2026-10-20T01:00:00Z', reach: 0, engagement: 0 },
    { id: 'b', title: 'Pemerintah naikkan PPN 12 persen di Jakarta', content: 'x', url: 'https://e.test/b', source: 'Media B', authorHandle: '@b', platform: 'news', publishedAt: '2026-10-20T02:00:00Z', reach: 0, engagement: 0 }
  ], Date.parse('2026-10-20T12:00:00Z'))
  const doc = buildMediaReport(jsPDF as any, autoTable, {
    generatedBy: 'QA',
    generatedAt: new Date('2026-10-20T12:00:00Z'),
    topic: { id: 't', title: 'PPN 12%', category: 'Ekonomi', keywords: ['PPN'], isTrending: false, trendVelocity: '-', totalMentions: 2, originTimestamp: '-', activeMediaSources: ['news'], summary: 's', proArguments: '', contraArguments: '' },
    analysis,
    dataSource: 'live',
    origin: analysis.origin,
    nodes: analysis.nodes,
    regional: analysis.regional
  })
  const bytes = new Uint8Array(doc.output('arraybuffer'))
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  assert.ok(doc.getNumberOfPages() >= 1)
})

test('toCsv: escape kutip/koma dan cegah formula injection', async () => {
  const { toCsv } = await import('../lib/csv.ts')
  const csv = toCsv(['a', 'b'], [['=HYPERLINK("x")', 'koma, "kutip"'], [12, null]])
  assert.equal(csv, 'a,b\r\n"\'=HYPERLINK(""x"")","koma, ""kutip"""\r\n12,')
})

test('laporan pemilu memuat profil BPS dan gubernur terpilih', () => {
  const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/electoral/${f}`, import.meta.url), 'utf8'))
  const provinces = buildProvinces({
    provinces: read('provinces.json'),
    presidential: read('presidential.json'),
    voters: read('voters.json'),
    legislative: read('legislative.json'),
    demography: read('demography.json'),
    pilkada: read('pilkada.json')
  })
  const jabar = provinces.find(p => p.code === '32')!
  const splitRows = provinces
    .map(p => ({ provinceId: p.id, provinceName: p.name, result: detectSplitTicket(p, 2024)! }))
    .filter(r => r.result)

  const rows = demographyRows(jabar.demography[2024])
  assert.match(rows.find(r => r[0] === 'IPM')![1], /2024; nasional 74,20/)
  assert.match(rows.find(r => r[0] === 'Lapangan kerja utama')![1], /Sakernas Agustus 2024/)
  assert.deepEqual(demographyRows(undefined), [['Profil BPS', 'Tidak tersedia untuk periode ini']])

  const doc = buildElectoralReport(jsPDF as any, autoTable, {
    generatedBy: 'QA',
    generatedAt: new Date('2026-10-20T12:00:00Z'),
    year: 2024,
    province: jabar,
    provinces,
    splitRows,
    correlations: demographicVoteCorrelations(provinces, 2024),
    nationalSummary: { totalDPT: 1, avgTurnout: 80, totalProvinces: 38 }
  })
  const text = new TextDecoder('latin1').decode(new Uint8Array(doc.output('arraybuffer')))
  assert.ok(text.startsWith('%PDF-'))
  assert.ok(text.includes('Karakteristik Masyarakat Jawa Barat'))
  assert.ok(text.includes(jabar.gubernatorial[2024]!.winner.split(' ')[0]))
})
