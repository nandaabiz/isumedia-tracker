/**
 * Builder laporan PDF berbasis teks (jsPDF + autotable): tajam di layar ponsel, ukuran kecil
 * untuk dibagikan via WhatsApp, dan teksnya dapat dicari/disalin.
 * Modul murni: konstruktor jsPDF & autoTable diinjeksi agar bisa dipakai di browser maupun diuji di Node.
 */
import type { jsPDF as JsPDF } from 'jspdf'
import type { UserOptions } from 'jspdf-autotable'
import type { AmplificationNode, IssueAnalysis, MonitoredTopic, OriginPost, RegionalIssueStat } from '~/types/issue'
import type { ElectionYear, ProvinceElectoralData, SplitTicketResult, VoterClassification } from '~/types/electoral'

export type AutoTableFn = (doc: JsPDF, options: UserOptions) => void
export type JsPDFCtor = new (options?: any) => JsPDF

const COLOR = {
  claret: [126, 32, 50] as [number, number, number],
  brass: [184, 134, 11] as [number, number, number],
  ink: [31, 33, 40] as [number, number, number],
  muted: [94, 98, 110] as [number, number, number],
  hairline: [230, 224, 212] as [number, number, number],
  wash: [250, 248, 245] as [number, number, number]
}

const PAGE_MARGIN = 16
const ROLE_LABEL: Record<AmplificationNode['role'], string> = {
  origin: 'Pemantik',
  kol: 'Pengganda awal',
  amplifier: 'Amplifier',
  news_media: 'Media berita',
  bot_suspect: 'Salin-tempel'
}
const SENTIMENT_LABEL = { positive: 'Positif', neutral: 'Netral', negative: 'Negatif' } as const
const INTENSITY_LABEL = { very_high: 'Sangat tinggi', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' } as const
const CLASSIFICATION_LABEL: Record<VoterClassification, string> = {
  stronghold: 'Kandang loyalis',
  leaning_loyal: 'Condong loyalis',
  battleground: 'Medan pertempuran',
  volatile: 'Anomali (sangat mengambang)',
  insufficient: 'Data belum cukup'
}

export interface ReportMeta {
  generatedBy: string
  generatedAt?: Date
}

export interface MediaReportInput extends ReportMeta {
  topic: MonitoredTopic
  analysis: IssueAnalysis | null
  dataSource: 'live' | 'seed' | 'empty'
  origin: OriginPost | null
  nodes: AmplificationNode[]
  regional: RegionalIssueStat[]
}

export interface ElectoralReportInput extends ReportMeta {
  year: ElectionYear
  province: ProvinceElectoralData
  provinces: ProvinceElectoralData[]
  splitRows: { provinceId: string; provinceName: string; result: SplitTicketResult }[]
  nationalSummary: { totalDPT: number; avgTurnout: number; totalProvinces: number }
}

export function formatDateTimeWib(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date) + ' WIB'
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
}

function formatDelay(sec: number): string {
  if (sec <= 0) return '0'
  if (sec < 3600) return `+${Math.round(sec / 60)} mnt`
  if (sec < 86400) return `+${(sec / 3600).toFixed(1)} jam`
  return `+${(sec / 86400).toFixed(1)} hari`
}

const num = (n: number) => n.toLocaleString('id-ID')

const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'
const REPLACEMENTS: Record<string, string> = { '≥': '>=', '≤': '<=', '→': '->', '−': '-', 'Σ': 'jumlah ', '\u00A0': ' ' }

/** Font standar PDF hanya mendukung WinAnsi (cp1252); karakter lain (emoji, simbol matematika) diganti. */
export function toWinAnsi(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (REPLACEMENTS[ch] !== undefined) out += REPLACEMENTS[ch]
    else if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || CP1252_EXTRA.includes(ch) || ch === '\n') out += ch
    else if (/\s/.test(ch)) out += ' '
    else out += ''
  }
  return out.replace(/ {2,}/g, ' ').trim()
}

/** Kursor vertikal sederhana dengan pindah halaman otomatis. */
class Writer {
  y = PAGE_MARGIN
  readonly doc: JsPDF
  readonly autoTable: AutoTableFn

  constructor(doc: JsPDF, autoTable: AutoTableFn) {
    this.doc = doc
    this.autoTable = autoTable
  }

  get width() {
    return this.doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2
  }

  ensure(space: number) {
    if (this.y + space > this.doc.internal.pageSize.getHeight() - PAGE_MARGIN - 8) {
      this.doc.addPage()
      this.y = PAGE_MARGIN
    }
  }

  title(kicker: string, title: string, meta: string[]) {
    const { doc } = this
    doc.setFillColor(...COLOR.claret)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR.brass)
    doc.text(toWinAnsi(kicker.toUpperCase()), PAGE_MARGIN, this.y + 4)
    this.y += 11
    doc.setFont('times', 'bold')
    doc.setFontSize(19)
    doc.setTextColor(...COLOR.ink)
    const lines = doc.splitTextToSize(toWinAnsi(title), this.width)
    doc.text(lines, PAGE_MARGIN, this.y)
    this.y += lines.length * 7.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR.muted)
    for (const line of meta) {
      const wrapped = doc.splitTextToSize(toWinAnsi(line), this.width)
      doc.text(wrapped, PAGE_MARGIN, this.y)
      this.y += wrapped.length * 4
    }
    this.y += 2
    doc.setDrawColor(...COLOR.hairline)
    doc.line(PAGE_MARGIN, this.y, PAGE_MARGIN + this.width, this.y)
    this.y += 7
  }

  heading(text: string) {
    this.ensure(16)
    const { doc } = this
    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...COLOR.claret)
    doc.text(toWinAnsi(text), PAGE_MARGIN, this.y)
    this.y += 6
  }

  paragraph(text: string, options: { size?: number; color?: [number, number, number]; italic?: boolean } = {}) {
    if (!text) return
    const { doc } = this
    doc.setFont('helvetica', options.italic ? 'italic' : 'normal')
    doc.setFontSize(options.size ?? 9.5)
    doc.setTextColor(...(options.color ?? COLOR.ink))
    const lines: string[] = doc.splitTextToSize(toWinAnsi(text), this.width)
    for (const line of lines) {
      this.ensure(5)
      doc.text(line, PAGE_MARGIN, this.y)
      this.y += (options.size ?? 9.5) * 0.45
    }
    this.y += 2.5
  }

  bullets(items: string[]) {
    for (const item of items) this.paragraph(`•  ${item}`)
  }

  table(head: string[], body: (string | number)[][], columnStyles: UserOptions['columnStyles'] = {}) {
    if (!body.length) {
      this.paragraph('Tidak ada data.', { color: COLOR.muted, italic: true })
      return
    }
    this.autoTable(this.doc, {
      startY: this.y,
      head: [head.map(toWinAnsi)],
      body: body.map(r => r.map(c => toWinAnsi(String(c)))),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: COLOR.ink, lineColor: COLOR.hairline, lineWidth: 0.1, overflow: 'linebreak' },
      headStyles: { fillColor: COLOR.claret, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLOR.wash },
      columnStyles
    })
    this.y = ((this.doc as any).lastAutoTable?.finalY ?? this.y) + 7
  }

  keyValues(rows: [string, string][]) {
    this.table(['Indikator', 'Nilai'], rows, { 0: { cellWidth: 62, fontStyle: 'bold' } })
  }

  finish(footerLabel: string) {
    const { doc } = this
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      const h = doc.internal.pageSize.getHeight()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...COLOR.muted)
      doc.text(toWinAnsi(footerLabel), PAGE_MARGIN, h - 8)
      doc.text(`Halaman ${i} dari ${pages}`, PAGE_MARGIN + this.width, h - 8, { align: 'right' })
    }
  }
}

export function buildMediaReport(JsPDF: JsPDFCtor, autoTable: AutoTableFn, input: MediaReportInput): JsPDF {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' })
  const w = new Writer(doc, autoTable)
  const now = input.generatedAt ?? new Date()
  const { topic, analysis } = input

  w.title('IsuMedia Tracker  |  Laporan Analisis Isu', topic.title, [
    `Kategori: ${topic.category}  •  ${topic.query ? `Kueri: ${topic.query}` : `Kata kunci: ${topic.keywords.join(', ')}`}`,
    `Dibuat ${formatDateTimeWib(now)} oleh ${input.generatedBy}  •  Sumber data: ${
      input.dataSource === 'live' ? 'hasil perayapan riil (Google News & Antara RSS)' : input.dataSource === 'seed' ? 'data contoh bawaan (belum ada perayapan)' : 'belum ada data'
    }`
  ])

  w.heading('Ringkasan')
  w.paragraph(analysis?.narrative.summary || topic.summary)

  w.heading('Indikator Kunci')
  const rows: [string, string][] = [['Total publikasi', num(analysis?.totalPosts ?? topic.totalMentions)]]
  if (analysis) {
    rows.push(
      ['Sumber unik', num(analysis.uniqueSources)],
      ['Tren 24 jam', `${analysis.trend.last24h} publikasi (${analysis.trend.velocityPct > 0 ? '+' : ''}${analysis.trend.velocityPct}% vs 24 jam sebelumnya)`],
      ['Sentimen', `Positif ${analysis.sentiment.positive}% • Netral ${analysis.sentiment.neutral}% • Negatif ${analysis.sentiment.negative}%`],
      ['Indeks duplikasi narasi', `${Math.round(analysis.duplication.index * 100)}% (${analysis.duplication.copyPasteCount} terindikasi salin-tempel)`],
      ['Duplikasi tercepat', analysis.duplication.fastestDelaySec !== null ? formatDelay(analysis.duplication.fastestDelaySec) : '-']
    )
  } else {
    rows.push(['Laju tren', topic.trendVelocity])
  }
  w.keyValues(rows)

  w.heading('Pemantik Awal (Timestamp Zero)')
  if (input.origin) {
    w.keyValues([
      ['Sumber', `${input.origin.authorName} (${input.origin.authorHandle})`],
      ['Waktu publikasi', input.origin.publishedAt],
      ['Narasi', input.origin.content],
      ['Tautan', input.origin.url || '-']
    ])
  } else {
    w.paragraph('Pemantik awal belum ditemukan.', { color: COLOR.muted, italic: true })
  }

  w.heading('Jejaring Penyebaran & Duplikasi')
  const nodes = [...input.nodes].sort((a, b) => a.delaySec - b.delaySec).slice(0, 30)
  w.table(
    ['#', 'Sumber', 'Peran', 'Tunda', 'Mirip', 'Narasi'],
    nodes.map((n, i) => [i + 1, n.authorName, ROLE_LABEL[n.role], formatDelay(n.delaySec), `${Math.round(n.similarityScore * 100)}%`, n.contentSnippet]),
    { 0: { cellWidth: 7 }, 1: { cellWidth: 32 }, 2: { cellWidth: 22 }, 3: { cellWidth: 16 }, 4: { cellWidth: 13 } }
  )
  if (input.nodes.length > nodes.length) {
    w.paragraph(`Ditampilkan ${nodes.length} dari ${input.nodes.length} simpul paling awal.`, { size: 8, color: COLOR.muted })
  }

  w.heading('Sebaran Wilayah')
  w.table(
    ['Provinsi', 'Sebutan', 'Intensitas', 'Sentimen', 'Sorotan lokal'],
    input.regional.map(r => [r.provinceName, num(r.mentionCount), INTENSITY_LABEL[r.intensity], SENTIMENT_LABEL[r.dominantSentiment], r.localHeadline]),
    { 0: { cellWidth: 32 }, 1: { cellWidth: 16 }, 2: { cellWidth: 22 }, 3: { cellWidth: 18 } }
  )

  if (analysis) {
    w.heading('Frasa Kunci & Entitas')
    w.paragraph(`Frasa kunci: ${analysis.keyPhrases.map(k => `${k.phrase} (${k.count})`).join(', ') || '-'}`)
    w.paragraph(`Entitas tokoh/organisasi: ${analysis.entities.map(e => `${e.entity} (${e.count})`).join(', ') || '-'}`)

    w.heading('Narasi Pendukung & Pengkritik')
    w.paragraph('Pendukung', { size: 9, color: COLOR.muted })
    w.bullets(analysis.narrative.pro.length ? analysis.narrative.pro.map(q => `"${q.text}" (${q.source})`) : ['Belum ada publikasi bernada positif.'])
    w.paragraph('Pengkritik', { size: 9, color: COLOR.muted })
    w.bullets(analysis.narrative.contra.length ? analysis.narrative.contra.map(q => `"${q.text}" (${q.source})`) : ['Belum ada publikasi bernada negatif.'])
  }

  w.heading('Metodologi & Batasan')
  w.paragraph(
    'Pemantik awal adalah publikasi paling awal dalam jendela perayapan 7 hari. Induk tiap simpul ditentukan dari publikasi lebih awal dengan kemiripan teks tertinggi (gabungan Jaccard kata dan Levenshtein karakter); kemiripan ≥ 85% ditandai salin-tempel. Wilayah diekstraksi dari nama 38 provinsi dan kota utama. Sentimen memakai leksikon bahasa Indonesia dengan penanganan negasi, sehingga dapat keliru membaca sarkasme atau konteks. Hanya sumber publik yang dipantau.',
    { size: 8.5, color: COLOR.muted }
  )

  w.finish(`IsuMedia Tracker • Laporan isu "${topic.title.slice(0, 60)}"`)
  return doc
}

export function buildElectoralReport(JsPDF: JsPDFCtor, autoTable: AutoTableFn, input: ElectoralReportInput): JsPDF {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' })
  const w = new Writer(doc, autoTable)
  const now = input.generatedAt ?? new Date()
  const { year, province } = input

  w.title('IsuMedia Tracker  |  Laporan Analitik Pemilu', `Pemilu ${year}: ${province.name} & Ringkasan Nasional`, [
    `Dibuat ${formatDateTimeWib(now)} oleh ${input.generatedBy}`,
    'Sumber: rekapitulasi resmi KPU (lihat data/electoral/SOURCES-*.md); indikator dihitung otomatis dari data tersebut.'
  ])

  w.heading('Ringkasan Nasional')
  const counts = input.provinces.reduce<Record<VoterClassification, number>>((acc, p) => {
    acc[p.voterProfile.classification]++
    return acc
  }, { stronghold: 0, leaning_loyal: 0, battleground: 0, volatile: 0, insufficient: 0 })
  w.keyValues([
    ['Provinsi dianalisis', String(input.nationalSummary.totalProvinces)],
    ['DPT tercatat', input.nationalSummary.totalDPT ? num(input.nationalSummary.totalDPT) : 'Tidak tersedia'],
    ['Rata-rata partisipasi', input.nationalSummary.avgTurnout ? `${input.nationalSummary.avgTurnout}%` : 'Tidak tersedia'],
    ['Klasifikasi pemilih', (Object.keys(counts) as VoterClassification[]).map(k => `${CLASSIFICATION_LABEL[k]} ${counts[k]}`).join(' • ')],
    ['Split-ticket', `${input.splitRows.filter(r => r.result.isSplitTicket).length} dari ${input.splitRows.length} provinsi`]
  ])

  w.heading(`Profil ${province.name}`)
  const metrics = province.voterProfile.metrics
  w.keyValues([
    ['Klasifikasi', CLASSIFICATION_LABEL[province.voterProfile.classification]],
    ['Indeks Pedersen rata-rata', metrics?.pedersenByPeriod.length ? `${metrics.pedersenSwingIndex} (${metrics.pedersenByPeriod.map(p => `${p.from}-${p.to}: ${p.value}`).join('; ')})` : 'Belum dapat dihitung (rekap suara 2 pemilu berurutan tidak tersedia)'],
    ['Pemenang Pileg per periode', metrics ? Object.entries(metrics.winnersByYear).filter(([, v]) => v).map(([y, v]) => `${y}: ${v}`).join(' • ') : '-'],
    ['Indeks loyalitas', metrics ? `${metrics.loyaltyScore}${metrics.loyaltyParty ? ` terhadap ${metrics.loyaltyParty}` : ''}` : '-'],
    ['DPT & partisipasi', `${province.dpt[year] ? num(province.dpt[year]) : 'N/A'} • ${province.turnoutPercentage[year] ? `${province.turnoutPercentage[year]}%` : 'N/A'}`]
  ])

  if (province.dataNotes.length) w.paragraph(`Catatan data: ${province.dataNotes.join(' ')}`, { size: 8, color: COLOR.muted })

  const pres = province.presidential[year]
  w.heading(`Pilpres ${year}`)
  w.table(['Pasangan', 'Suara', '%'], (pres?.candidates ?? []).map(c => [c.name + (c.isWinner ? ' (menang)' : ''), num(c.votes), c.percentage.toFixed(2)]))

  const leg = province.legislative[year]
  w.heading(`Pileg DPR RI ${year}`)
  w.table(
    ['Partai', 'Suara', '%', 'Kursi'],
    (leg?.parties ?? []).map(p => [p.partyName, p.voteCount ? num(p.voteCount) : '-', p.votePercentage ? p.votePercentage.toFixed(2) : '-', p.seatsWon ?? '-'])
  )

  w.heading(`Matriks Seluruh Provinsi (${year})`)
  const splitById = new Map(input.splitRows.map(r => [r.provinceId, r.result]))
  w.table(
    ['Provinsi', 'Capres pemenang', 'Pemenang Pileg', 'Pola', 'Klasifikasi', 'Pedersen'],
    input.provinces.map(p => {
      const s = splitById.get(p.id)
      return [
        p.name,
        s?.presidentialWinner ?? '-',
        s?.legislativeWinner ?? p.legislative[year]?.winnerParty ?? '-',
        s ? (s.isSplitTicket ? 'Split' : 'Searah') : '-',
        CLASSIFICATION_LABEL[p.voterProfile.classification],
        p.voterProfile.metrics?.pedersenByPeriod.length ? p.voterProfile.metrics.pedersenSwingIndex : '-'
      ]
    }),
    { 0: { cellWidth: 34 }, 3: { cellWidth: 14 }, 5: { cellWidth: 16 } }
  )

  w.heading('Metodologi')
  w.paragraph(
    'Indeks Pedersen = ½ Σ |P(i,t) − P(i,t−1)| atas porsi suara Pileg DPR RI per partai antar-pemilu. Kandang loyalis: partai yang sama menang 3 periode dengan variasi suara < 8 poin; anomali: rata-rata Pedersen ≥ 20. Split-ticket: partai pemenang Pileg bukan pengusung capres pemenang di provinsi yang sama. Empat provinsi Papua hasil pemekaran 2022 hanya memiliki data 2024.',
    { size: 8.5, color: COLOR.muted }
  )

  w.finish(`IsuMedia Tracker • Laporan Pemilu ${year} • ${province.name}`)
  return doc
}
