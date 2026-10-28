/**
 * Issue Analysis Engine (Modul 1 PRD: FR-1.1.1, FR-1.1.2, FR-1.2.1–1.2.3, FR-1.3.1, FR-1.4.1–1.4.3)
 *
 * Pure functions tanpa dependency runtime Nuxt agar dapat dipakai di server (Nitro)
 * maupun diuji langsung dengan `node --test`.
 */
import type {
  PlatformType,
  SentimentType,
  OriginPost,
  AmplificationNode,
  AmplificationEdge,
  RegionalIssueStat,
  RegionalPostRef,
  IssueAnalysis
} from '~/types/issue'

export interface AnalysisInputPost {
  id: string
  title: string
  content: string
  url: string
  source: string
  authorHandle: string
  platform: PlatformType
  /** ISO 8601 timestamp, presisi detik */
  publishedAt: string
  /** 0 berarti metrik tidak tersedia dari sumber (mis. RSS) */
  reach: number
  engagement: number
}

// ---------------------------------------------------------------------------
// Teks: normalisasi, tokenisasi, stopword
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 'dalam', 'akan', 'tidak',
  'ada', 'atau', 'juga', 'oleh', 'sebagai', 'karena', 'jadi', 'bisa', 'agar', 'saat', 'telah', 'sudah',
  'belum', 'masih', 'lebih', 'para', 'kata', 'soal', 'hingga', 'bagi', 'tak', 'pun', 'lagi', 'usai',
  'jelang', 'kini', 'harus', 'dapat', 'antara', 'tersebut', 'serta', 'namun', 'tapi', 'secara', 'begini',
  'apa', 'siapa', 'kenapa', 'mengapa', 'bagaimana', 'kapan', 'mana', 'ia', 'dia', 'mereka', 'kami', 'kita',
  'saya', 'anda', 'nya', 'lah', 'kah', 'sejumlah', 'buat', 'baru', 'hari', 'tahun', 'bulan', 'minggu',
  'jam', 'menit', 'detik', 'kali', 'satu', 'dua', 'tiga', 'per', 'via', 'the', 'of', 'and', 'to', 'in',
  'a', 'is', 'for', 'on', 'com', 'co', 'id', 'www', 'https', 'http', 'berita', 'news', 'terkini',
  'terbaru', 'hari ini', 'video', 'foto', 'baca', 'selengkapnya', 'klik'
])

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}#%\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter(t => t.length >= 2 && !STOPWORDS.has(t))
}

// ---------------------------------------------------------------------------
// Similarity: Jaccard + Levenshtein (FR-1.2.3)
// ---------------------------------------------------------------------------

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Rasio kemiripan karakter 0..1 berbasis Levenshtein; teks dipotong agar O(n·m) tetap ringan. */
export function levenshteinRatio(a: string, b: string, maxLen = 160): number {
  const na = normalizeText(a).slice(0, maxLen)
  const nb = normalizeText(b).slice(0, maxLen)
  const longest = Math.max(na.length, nb.length)
  if (longest === 0) return 0
  return 1 - levenshteinDistance(na, nb) / longest
}

/** Duplication score gabungan: leksikal (Jaccard) + urutan karakter (Levenshtein). */
export function textSimilarity(a: string, b: string): number {
  const score = 0.6 * jaccardSimilarity(a, b) + 0.4 * levenshteinRatio(a, b)
  return Math.round(score * 1000) / 1000
}

// ---------------------------------------------------------------------------
// Boolean query: AND / OR / NOT, "frasa", tanda kurung (FR-1.1.2)
// ---------------------------------------------------------------------------

export type QueryNode =
  | { type: 'term'; value: string }
  | { type: 'and'; left: QueryNode; right: QueryNode }
  | { type: 'or'; left: QueryNode; right: QueryNode }
  | { type: 'not'; operand: QueryNode }

type QueryToken = { kind: 'term'; value: string } | { kind: 'op'; value: 'AND' | 'OR' | 'NOT' | '(' | ')' }

function lexQuery(query: string): QueryToken[] {
  const tokens: QueryToken[] = []
  const re = /"([^"]+)"|(\()|(\))|([^\s()"]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    if (m[1] !== undefined) tokens.push({ kind: 'term', value: m[1].trim() })
    else if (m[2]) tokens.push({ kind: 'op', value: '(' })
    else if (m[3]) tokens.push({ kind: 'op', value: ')' })
    else if (m[4]) {
      const upper = m[4].toUpperCase()
      if (upper === 'AND' || upper === 'OR' || upper === 'NOT') tokens.push({ kind: 'op', value: upper })
      else if (m[4].startsWith('-') && m[4].length > 1) {
        tokens.push({ kind: 'op', value: 'NOT' })
        tokens.push({ kind: 'term', value: m[4].slice(1) })
      } else tokens.push({ kind: 'term', value: m[4] })
    }
  }
  return tokens
}

/** Parser rekursif: OR < AND (eksplisit/implisit) < NOT < atom. Melempar Error untuk sintaks tidak valid. */
export function parseBooleanQuery(query: string): QueryNode | null {
  const tokens = lexQuery(query)
  if (tokens.length === 0) return null
  let pos = 0

  const peek = () => tokens[pos]
  const isOp = (t: QueryToken | undefined, v: string) => t?.kind === 'op' && t.value === v

  function parseOr(): QueryNode {
    let left = parseAnd()
    while (isOp(peek(), 'OR')) {
      pos++
      left = { type: 'or', left, right: parseAnd() }
    }
    return left
  }

  function parseAnd(): QueryNode {
    let left = parseNot()
    while (pos < tokens.length && !isOp(peek(), 'OR') && !isOp(peek(), ')')) {
      if (isOp(peek(), 'AND')) pos++
      left = { type: 'and', left, right: parseNot() }
    }
    return left
  }

  function parseNot(): QueryNode {
    if (isOp(peek(), 'NOT')) {
      pos++
      return { type: 'not', operand: parseNot() }
    }
    return parseAtom()
  }

  function parseAtom(): QueryNode {
    const t = peek()
    if (!t) throw new Error('Kueri berakhir tidak lengkap.')
    if (isOp(t, '(')) {
      pos++
      const inner = parseOr()
      if (!isOp(peek(), ')')) throw new Error('Tanda kurung tidak ditutup.')
      pos++
      return inner
    }
    if (t.kind === 'term') {
      pos++
      return { type: 'term', value: t.value.toLowerCase() }
    }
    throw new Error(`Operator "${t.value}" tidak pada posisi yang valid.`)
  }

  const ast = parseOr()
  if (pos < tokens.length) throw new Error(`Token tidak terduga: "${tokens[pos].value}".`)
  return ast
}

export function matchesQuery(node: QueryNode | null, text: string): boolean {
  if (!node) return true
  const haystack = ` ${normalizeText(text)} `
  const evaluate = (n: QueryNode): boolean => {
    switch (n.type) {
      case 'term': {
        const needle = normalizeText(n.value)
        return needle.length > 0 && haystack.includes(` ${needle} `)
      }
      case 'and': return evaluate(n.left) && evaluate(n.right)
      case 'or': return evaluate(n.left) || evaluate(n.right)
      case 'not': return !evaluate(n.operand)
    }
  }
  return evaluate(node)
}

/** Konversi AST ke sintaks pencarian Google News (spasi = AND, OR, -term). */
export function toSearchEngineQuery(node: QueryNode | null): string {
  if (!node) return ''
  switch (node.type) {
    case 'term': return node.value.includes(' ') ? `"${node.value}"` : node.value
    case 'and': return `${toSearchEngineQuery(node.left)} ${toSearchEngineQuery(node.right)}`
    case 'or': return `(${toSearchEngineQuery(node.left)} OR ${toSearchEngineQuery(node.right)})`
    case 'not': return node.operand.type === 'term' ? `-${toSearchEngineQuery(node.operand)}` : ''
  }
}

/**
 * Himpunan kata kunci minimum yang menjamin setiap post yang cocok dengan kueri pasti mengandung
 * salah satunya, untuk API pencarian yang tidak mendukung operator boolean (atau panjang kuerinya terbatas):
 * OR = gabungan kedua sisi, AND = sisi dengan kata kunci paling sedikit, NOT = tidak dapat dicari.
 * Hasil pencarian kemudian disaring ulang dengan `matchesQuery` di server.
 */
export function keywordCoverTerms(node: QueryNode | null): string[] {
  const collect = (n: QueryNode): string[] | null => {
    switch (n.type) {
      case 'term': return [n.value]
      case 'not': return null
      case 'or': {
        const left = collect(n.left)
        const right = collect(n.right)
        // Satu sisi OR tanpa kata kunci positif berarti kueri tidak dapat dicakup secara lengkap
        return left && right ? [...left, ...right] : null
      }
      case 'and': {
        const left = collect(n.left)
        const right = collect(n.right)
        if (!left) return right
        if (!right) return left
        return left.length <= right.length ? left : right
      }
    }
  }
  if (!node) return []
  const seen = new Set<string>()
  return (collect(node) ?? []).filter(term => {
    const key = term.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Kueri default dari daftar kata kunci: kata kunci digabung OR. */
export function keywordsToQuery(keywords: string[]): string {
  return keywords
    .map(k => k.trim().replace(/"/g, ''))
    .filter(Boolean)
    .map(k => (/\s/.test(k) ? `"${k}"` : k))
    .join(' OR ')
}

// ---------------------------------------------------------------------------
// Sentimen leksikon + negasi (FR-1.4.1)
// ---------------------------------------------------------------------------

const POSITIVE_WORDS = new Set([
  'dukung', 'mendukung', 'dukungan', 'apresiasi', 'meningkat', 'peningkatan', 'solusi', 'stabil', 'positif',
  'berhasil', 'keberhasilan', 'tumbuh', 'pertumbuhan', 'sehat', 'efektif', 'transparan', 'untung',
  'menguntungkan', 'bantuan', 'membantu', 'sukses', 'optimis', 'optimistis', 'manfaat', 'bermanfaat',
  'sejahtera', 'kesejahteraan', 'lancar', 'aman', 'baik', 'membaik', 'puas', 'kepuasan', 'setuju',
  'menyambut', 'disambut', 'terobosan', 'prestasi', 'raih', 'meraih', 'naik', 'surplus', 'gratis'
])

const NEGATIVE_WORDS = new Set([
  'tolak', 'menolak', 'penolakan', 'mencekik', 'beban', 'membebani', 'phk', 'deflasi', 'inflasi',
  'keracunan', 'monopoli', 'keluhan', 'mengeluh', 'mahal', 'sulit', 'kesulitan', 'krisis', 'polemik',
  'protes', 'demo', 'turun', 'anjlok', 'cemas', 'khawatir', 'kekhawatiran', 'ancaman', 'mengancam',
  'berat', 'lemah', 'melemah', 'gugat', 'gugatan', 'korupsi', 'kecurangan', 'curang', 'hoaks', 'gagal',
  'kegagalan', 'kritik', 'mengkritik', 'kecam', 'mengecam', 'rugi', 'kerugian', 'defisit', 'buruk',
  'memburuk', 'bermasalah', 'masalah', 'skandal', 'pelanggaran', 'melanggar', 'tewas', 'korban', 'ricuh'
])

const NEGATORS = new Set(['tidak', 'tak', 'bukan', 'belum', 'tanpa', 'jangan', 'enggan'])

export function analyzeSentiment(text: string): { sentiment: SentimentType; score: number; confidence: number } {
  const words = normalizeText(text).split(' ')
  let pos = 0
  let neg = 0
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const isPos = POSITIVE_WORDS.has(w)
    const isNeg = NEGATIVE_WORDS.has(w)
    if (!isPos && !isNeg) continue
    const negated = NEGATORS.has(words[i - 1] ?? '') || NEGATORS.has(words[i - 2] ?? '')
    if ((isPos && !negated) || (isNeg && negated)) pos++
    else neg++
  }
  const total = pos + neg
  if (total === 0) return { sentiment: 'neutral', score: 0, confidence: 0.5 }
  const score = Math.round(((pos - neg) / total) * 100) / 100
  // Keyakinan naik dengan jumlah bukti dan ketegasan polaritas
  const confidence = Math.min(0.5 + Math.abs(score) * 0.3 + Math.min(total, 5) * 0.04, 0.97)
  const sentiment: SentimentType = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'
  return { sentiment, score, confidence: Math.round(confidence * 100) / 100 }
}

// ---------------------------------------------------------------------------
// NER wilayah: 38 provinsi (kode Kemendagri) + ibu kota & kota besar (FR-1.3.1)
// ---------------------------------------------------------------------------

interface ProvinceGazetteer {
  code: string
  name: string
  /** Alias dicocokkan case-sensitive agar kata umum ("malang", "padang", "medan") tidak salah terdeteksi. */
  aliases: string[]
}

export const PROVINCE_GAZETTEER: ProvinceGazetteer[] = [
  { code: '11', name: 'Aceh', aliases: ['Aceh', 'Banda Aceh', 'Lhokseumawe'] },
  { code: '12', name: 'Sumatera Utara', aliases: ['Sumatera Utara', 'Sumatra Utara', 'Sumut', 'SUMUT', 'Medan', 'Deli Serdang', 'Pematangsiantar'] },
  { code: '13', name: 'Sumatera Barat', aliases: ['Sumatera Barat', 'Sumatra Barat', 'Sumbar', 'SUMBAR', 'Padang', 'Bukittinggi'] },
  { code: '14', name: 'Riau', aliases: ['Riau', 'Pekanbaru', 'Dumai'] },
  { code: '15', name: 'Jambi', aliases: ['Jambi'] },
  { code: '16', name: 'Sumatera Selatan', aliases: ['Sumatera Selatan', 'Sumatra Selatan', 'Sumsel', 'SUMSEL', 'Palembang'] },
  { code: '17', name: 'Bengkulu', aliases: ['Bengkulu'] },
  { code: '18', name: 'Lampung', aliases: ['Lampung', 'Bandar Lampung'] },
  { code: '19', name: 'Kepulauan Bangka Belitung', aliases: ['Bangka Belitung', 'Babel', 'Pangkalpinang', 'Belitung'] },
  { code: '21', name: 'Kepulauan Riau', aliases: ['Kepulauan Riau', 'Kepri', 'KEPRI', 'Batam', 'Tanjungpinang'] },
  { code: '31', name: 'DKI Jakarta', aliases: ['DKI Jakarta', 'Jakarta', 'DKI'] },
  { code: '32', name: 'Jawa Barat', aliases: ['Jawa Barat', 'Jabar', 'JABAR', 'Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cirebon', 'Karawang', 'Tasikmalaya', 'Sukabumi'] },
  { code: '33', name: 'Jawa Tengah', aliases: ['Jawa Tengah', 'Jateng', 'JATENG', 'Semarang', 'Surakarta', 'Solo', 'Magelang', 'Pekalongan', 'Tegal', 'Banyumas'] },
  { code: '34', name: 'DI Yogyakarta', aliases: ['DI Yogyakarta', 'DIY', 'Yogyakarta', 'Jogja', 'Yogya', 'Sleman', 'Bantul'] },
  { code: '35', name: 'Jawa Timur', aliases: ['Jawa Timur', 'Jatim', 'JATIM', 'Surabaya', 'Malang', 'Sidoarjo', 'Kediri', 'Jember', 'Banyuwangi'] },
  { code: '36', name: 'Banten', aliases: ['Banten', 'Tangerang', 'Serang', 'Cilegon'] },
  { code: '51', name: 'Bali', aliases: ['Bali', 'Denpasar', 'Badung'] },
  { code: '52', name: 'Nusa Tenggara Barat', aliases: ['Nusa Tenggara Barat', 'NTB', 'Mataram', 'Lombok', 'Sumbawa'] },
  { code: '53', name: 'Nusa Tenggara Timur', aliases: ['Nusa Tenggara Timur', 'NTT', 'Kupang', 'Flores', 'Labuan Bajo'] },
  { code: '61', name: 'Kalimantan Barat', aliases: ['Kalimantan Barat', 'Kalbar', 'KALBAR', 'Pontianak'] },
  { code: '62', name: 'Kalimantan Tengah', aliases: ['Kalimantan Tengah', 'Kalteng', 'KALTENG', 'Palangka Raya', 'Palangkaraya'] },
  { code: '63', name: 'Kalimantan Selatan', aliases: ['Kalimantan Selatan', 'Kalsel', 'KALSEL', 'Banjarmasin', 'Banjarbaru'] },
  { code: '64', name: 'Kalimantan Timur', aliases: ['Kalimantan Timur', 'Kaltim', 'KALTIM', 'Samarinda', 'Balikpapan', 'IKN'] },
  { code: '65', name: 'Kalimantan Utara', aliases: ['Kalimantan Utara', 'Kaltara', 'KALTARA', 'Tarakan', 'Tanjung Selor'] },
  { code: '71', name: 'Sulawesi Utara', aliases: ['Sulawesi Utara', 'Sulut', 'SULUT', 'Manado', 'Bitung'] },
  { code: '72', name: 'Sulawesi Tengah', aliases: ['Sulawesi Tengah', 'Sulteng', 'SULTENG', 'Palu', 'Morowali'] },
  { code: '73', name: 'Sulawesi Selatan', aliases: ['Sulawesi Selatan', 'Sulsel', 'SULSEL', 'Makassar', 'Bone', 'Parepare'] },
  { code: '74', name: 'Sulawesi Tenggara', aliases: ['Sulawesi Tenggara', 'Sultra', 'SULTRA', 'Kendari'] },
  { code: '75', name: 'Gorontalo', aliases: ['Gorontalo'] },
  { code: '76', name: 'Sulawesi Barat', aliases: ['Sulawesi Barat', 'Sulbar', 'SULBAR', 'Mamuju'] },
  { code: '81', name: 'Maluku', aliases: ['Maluku', 'Ambon'] },
  { code: '82', name: 'Maluku Utara', aliases: ['Maluku Utara', 'Malut', 'Ternate', 'Sofifi'] },
  { code: '91', name: 'Papua', aliases: ['Papua', 'Jayapura'] },
  { code: '92', name: 'Papua Barat', aliases: ['Papua Barat', 'Manokwari'] },
  { code: '93', name: 'Papua Selatan', aliases: ['Papua Selatan', 'Merauke'] },
  { code: '94', name: 'Papua Tengah', aliases: ['Papua Tengah', 'Nabire', 'Mimika', 'Timika'] },
  { code: '95', name: 'Papua Pegunungan', aliases: ['Papua Pegunungan', 'Wamena', 'Jayawijaya'] },
  { code: '96', name: 'Papua Barat Daya', aliases: ['Papua Barat Daya', 'Sorong'] }
]

// Alias terpanjang dicocokkan lebih dulu, lalu span-nya dikonsumsi agar "Papua Barat Daya" tidak juga terhitung "Papua".
const ALIAS_INDEX = PROVINCE_GAZETTEER
  .flatMap(p => p.aliases.map(alias => ({ alias, code: p.code })))
  .sort((a, b) => b.alias.length - a.alias.length)
  .map(({ alias, code }) => ({
    code,
    re: new RegExp(`(?<![\\p{L}\\p{N}])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu')
  }))

export function detectProvinces(text: string): string[] {
  let remaining = text
  const found = new Set<string>()
  for (const { code, re } of ALIAS_INDEX) {
    re.lastIndex = 0
    if (re.test(remaining)) {
      found.add(code)
      re.lastIndex = 0
      remaining = remaining.replace(re, m => ' '.repeat(m.length))
    }
  }
  return [...found]
}

export function provinceName(code: string): string {
  return PROVINCE_GAZETTEER.find(p => p.code === code)?.name ?? code
}

// ---------------------------------------------------------------------------
// Frasa kunci & entitas (FR-1.4.2)
// ---------------------------------------------------------------------------

/** Frasa kunci berdasarkan document frequency bigram, jatuh ke unigram bila bigram jarang. */
export function extractKeyPhrases(docs: string[], limit = 8): { phrase: string; count: number }[] {
  const bigramDf = new Map<string, number>()
  const unigramDf = new Map<string, number>()
  for (const doc of docs) {
    const tokens = tokenize(doc).filter(t => !/^\d+$/.test(t))
    const bigrams = new Set<string>()
    for (let i = 0; i < tokens.length - 1; i++) bigrams.add(`${tokens[i]} ${tokens[i + 1]}`)
    for (const b of bigrams) bigramDf.set(b, (bigramDf.get(b) ?? 0) + 1)
    for (const u of new Set(tokens)) unigramDf.set(u, (unigramDf.get(u) ?? 0) + 1)
  }
  const ranked = [...bigramDf.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase, count]) => ({ phrase, count }))
  if (ranked.length < limit) {
    const covered = new Set(ranked.flatMap(r => r.phrase.split(' ')))
    const unigrams = [...unigramDf.entries()]
      .filter(([u, c]) => c >= 2 && u.length >= 4 && !covered.has(u))
      .sort((a, b) => b[1] - a[1])
      .map(([phrase, count]) => ({ phrase, count }))
    ranked.push(...unigrams)
  }
  return ranked.slice(0, limit)
}

const ENTITY_STOP = new Set([
  'Di', 'Dan', 'Yang', 'Ini', 'Itu', 'Ke', 'Dari', 'Untuk', 'Pada', 'Dengan', 'Akan', 'Tidak', 'Soal',
  'Usai', 'Jelang', 'Kata', 'Begini', 'Ada', 'Bisa', 'Jadi', 'Hari', 'Baru', 'Warga', 'Pemerintah',
  'Indonesia', 'RI', 'Video', 'Foto', 'Berita', 'Terkini', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat',
  'Sabtu', 'Minggu', 'Rp', 'Hingga', 'Apa', 'Siapa', 'Kenapa', 'Bagaimana', 'Pak', 'Bu',
  'HUT', 'PT', 'Tbk', 'WIB', 'WITA', 'WIT', 'CEO', 'VIDEO', 'FOTO'
])

const ROMAN_NUMERAL = /^[IVXLC]+$/

/**
 * Entitas tokoh/organisasi: akronim huruf kapital (KPK, DPR) dan rangkaian kata berhuruf kapital.
 * Hanya entitas yang muncul di ≥2 dokumen yang dihitung untuk meredam noise judul ber-Title Case.
 */
export function extractEntities(docs: string[], sources: string[] = [], limit = 8): { entity: string; count: number }[] {
  const df = new Map<string, number>()
  const sourceSet = new Set(sources.map(s => s.toLowerCase()))
  const provinceAliases = new Set(PROVINCE_GAZETTEER.flatMap(p => p.aliases))
  // Kata yang juga muncul berhuruf kecil di korpus adalah kata umum, bukan bagian nama diri
  const lowercaseWords = new Set(docs.flatMap(d => d.match(/(?<![\p{L}])\p{Ll}[\p{L}]*/gu) ?? []))
  const looksLikeCommonPhrase = (entity: string) => {
    const words = entity.split(/\s+/)
    const common = words.filter(w => lowercaseWords.has(w.toLowerCase())).length
    return words.length > 1 && common / words.length > 0.5
  }
  for (const doc of docs) {
    const found = new Set<string>()
    for (const m of doc.matchAll(/\b[A-Z]{2,6}\b/g)) found.add(m[0])
    for (const m of doc.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g)) {
      const words = m[0].split(/\s+/).filter(w => !ENTITY_STOP.has(w))
      if (words.length >= 2) found.add(words.join(' '))
    }
    for (const e of found) {
      if (ENTITY_STOP.has(e) || ROMAN_NUMERAL.test(e) || provinceAliases.has(e) || sourceSet.has(e.toLowerCase())) continue
      if (looksLikeCommonPhrase(e)) continue
      df.set(e, (df.get(e) ?? 0) + 1)
    }
  }
  // Rangkaian yang saling memuat ("Daya Beli" ⊂ "Daya Beli Masyarakat") cukup diwakili satu, yang paling sering
  const kept: { entity: string; count: number }[] = []
  const ranked = [...df.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
  for (const [entity, count] of ranked) {
    const lower = entity.toLowerCase()
    if (kept.some(k => k.entity.toLowerCase().includes(lower) || lower.includes(k.entity.toLowerCase()))) continue
    kept.push({ entity, count })
    if (kept.length >= limit) break
  }
  return kept
}

// ---------------------------------------------------------------------------
// Analisa utama: origin, graf amplifikasi, duplikasi, wilayah, narasi
// ---------------------------------------------------------------------------

const PARENT_SIMILARITY_THRESHOLD = 0.25
const COPY_PASTE_THRESHOLD = 0.85
const NARRATIVE_COPY_THRESHOLD = 0.6
const MAX_GRAPH_NODES = 60

export function formatWib(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} WIB`
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diffSec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (diffSec < 60) return `${diffSec} detik lalu`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`
  return `${Math.floor(diffSec / 86400)} hari lalu`
}

function postText(p: AnalysisInputPost): string {
  return p.title === p.content || p.content.startsWith(p.title) ? p.content : `${p.title}. ${p.content}`
}

function edgeType(platform: PlatformType, similarity: number): AmplificationEdge['type'] {
  if (similarity >= COPY_PASTE_THRESHOLD) return 'duplicate_copy'
  if (platform === 'news') return 'news_coverage'
  if (platform === 'x') return 'retweet'
  return 'quote'
}

export function analyzeIssue(
  topicId: string,
  rawPosts: AnalysisInputPost[],
  now = Date.now()
): IssueAnalysis {
  const posts = rawPosts
    .filter(p => !isNaN(new Date(p.publishedAt).getTime()))
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())

  const sentiments = new Map(posts.map(p => [p.id, analyzeSentiment(postText(p))]))

  if (posts.length === 0) {
    return {
      topicId,
      generatedAt: new Date(now).toISOString(),
      totalPosts: 0,
      uniqueSources: 0,
      origin: null,
      nodes: [],
      edges: [],
      regional: [],
      sentiment: { positive: 0, neutral: 0, negative: 0, averageScore: 0 },
      keyPhrases: [],
      entities: [],
      narrative: { summary: '', pro: [], contra: [] },
      duplication: { index: 0, copyPasteCount: 0, averageSimilarity: 0, fastestDelaySec: null },
      trend: { last24h: 0, previous24h: 0, velocityPct: 0, isTrending: false },
      timeline: []
    }
  }

  // --- Origin (Timestamp Zero, FR-1.2.1)
  const first = posts[0]
  const originTime = new Date(first.publishedAt).getTime()
  const origin: OriginPost = {
    id: first.id,
    topicId,
    platform: first.platform,
    authorHandle: first.authorHandle,
    authorName: first.source,
    authorRole: first.platform === 'news' ? 'Portal Berita Publik' : 'Akun Publik',
    avatar: '',
    content: first.title,
    publishedAt: formatWib(first.publishedAt),
    timeAgo: formatRelative(first.publishedAt, now),
    reach: first.reach,
    engagement: first.engagement,
    url: first.url,
    isVerifiedOrigin: true
  }

  // --- Graf amplifikasi (FR-1.2.2): parent = publikasi lebih awal dengan kemiripan tertinggi
  const graphPosts = posts.slice(0, MAX_GRAPH_NODES)
  const texts = graphPosts.map(postText)
  const depth = new Map<string, number>([[first.id, 0]])
  const childCount = new Map<string, number>()
  const parentOf = new Map<string, { parentId: string; similarity: number }>()
  const edges: AmplificationEdge[] = []

  for (let i = 1; i < graphPosts.length; i++) {
    let bestIdx = 0
    let bestSim = -1
    for (let j = 0; j < i; j++) {
      const sim = textSimilarity(texts[j], texts[i])
      if (sim > bestSim) {
        bestSim = sim
        bestIdx = j
      }
    }
    // Tanpa kemiripan berarti, simpul dianggap turunan langsung isu (terhubung ke origin)
    const parentIdx = bestSim >= PARENT_SIMILARITY_THRESHOLD ? bestIdx : 0
    const similarity = parentIdx === bestIdx ? bestSim : textSimilarity(texts[0], texts[i])
    const parent = graphPosts[parentIdx]
    const child = graphPosts[i]
    parentOf.set(child.id, { parentId: parent.id, similarity })
    depth.set(child.id, (depth.get(parent.id) ?? 0) + 1)
    childCount.set(parent.id, (childCount.get(parent.id) ?? 0) + 1)
    edges.push({ source: parent.id, target: child.id, type: edgeType(child.platform, similarity), similarity })
  }

  const nodes: AmplificationNode[] = graphPosts.map((p, i) => {
    const delaySec = Math.round((new Date(p.publishedAt).getTime() - originTime) / 1000)
    const link = parentOf.get(p.id)
    const similarity = i === 0 ? 1 : link?.similarity ?? 0
    let role: AmplificationNode['role']
    if (i === 0) role = 'origin'
    else if (similarity >= COPY_PASTE_THRESHOLD) role = 'bot_suspect'
    else if ((depth.get(p.id) ?? 0) === 1 && (childCount.get(p.id) ?? 0) >= 2) role = 'kol'
    else if (p.platform === 'news') role = 'news_media'
    else role = 'amplifier'
    return {
      id: p.id,
      authorHandle: p.authorHandle,
      authorName: p.source,
      role,
      platform: p.platform,
      publishedAt: formatWib(p.publishedAt),
      delaySec,
      similarityScore: similarity,
      reach: p.reach,
      sentiment: sentiments.get(p.id)!.sentiment,
      contentSnippet: p.title.slice(0, 200),
      depth: depth.get(p.id) ?? 0,
      parentId: link?.parentId,
      url: p.url
    }
  })

  // --- Duplication index (FR-1.2.3)
  const nonOrigin = nodes.slice(1)
  const copyPasteCount = nonOrigin.filter(n => n.similarityScore >= COPY_PASTE_THRESHOLD).length
  const narrativeCopies = nonOrigin.filter(n => n.similarityScore >= NARRATIVE_COPY_THRESHOLD).length
  const averageSimilarity = nonOrigin.length
    ? Math.round((nonOrigin.reduce((s, n) => s + n.similarityScore, 0) / nonOrigin.length) * 1000) / 1000
    : 0
  const copyDelays = nonOrigin
    .filter(n => n.similarityScore >= NARRATIVE_COPY_THRESHOLD && n.parentId)
    .map(n => {
      const parent = nodes.find(x => x.id === n.parentId)
      return parent ? n.delaySec - parent.delaySec : Infinity
    })
    .filter(Number.isFinite)
  const duplication = {
    index: nonOrigin.length ? Math.round((narrativeCopies / nonOrigin.length) * 1000) / 1000 : 0,
    copyPasteCount,
    averageSimilarity,
    fastestDelaySec: copyDelays.length ? Math.min(...copyDelays) : null
  }

  // --- Wilayah (FR-1.3.1 – 1.3.3)
  const byProvince = new Map<string, AnalysisInputPost[]>()
  for (const p of posts) {
    for (const code of detectProvinces(`${p.title} ${p.content}`)) {
      if (!byProvince.has(code)) byProvince.set(code, [])
      byProvince.get(code)!.push(p)
    }
  }
  const maxMentions = Math.max(1, ...[...byProvince.values()].map(v => v.length))
  const regional: RegionalIssueStat[] = [...byProvince.entries()]
    .map(([code, list]) => {
      const counts: Record<SentimentType, number> = { positive: 0, neutral: 0, negative: 0 }
      for (const p of list) counts[sentiments.get(p.id)!.sentiment]++
      const dominantSentiment = (Object.keys(counts) as SentimentType[]).reduce((a, b) => (counts[b] > counts[a] ? b : a), 'neutral')
      const ratio = list.length / maxMentions
      const latest = [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      const postsRef: RegionalPostRef[] = latest.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        source: p.source,
        platform: p.platform,
        publishedAt: formatWib(p.publishedAt),
        sentiment: sentiments.get(p.id)!.sentiment
      }))
      return {
        provinceCode: code,
        provinceName: provinceName(code),
        mentionCount: list.length,
        intensity: (ratio >= 0.75 ? 'very_high' : ratio >= 0.5 ? 'high' : ratio >= 0.25 ? 'medium' : 'low') as RegionalIssueStat['intensity'],
        dominantSentiment,
        localHeadline: latest[0].title,
        posts: postsRef
      }
    })
    .sort((a, b) => b.mentionCount - a.mentionCount)

  // --- Sentimen agregat (FR-1.4.1)
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  let scoreSum = 0
  for (const s of sentiments.values()) {
    sentimentCounts[s.sentiment]++
    scoreSum += s.score
  }
  const pct = (n: number) => Math.round((n / posts.length) * 1000) / 10

  // --- Frasa kunci & entitas (FR-1.4.2)
  const docs = posts.map(p => p.title)
  const uniqueSourceNames = [...new Set(posts.map(p => p.source))]
  const keyPhrases = extractKeyPhrases(docs)
  const entities = extractEntities(docs, uniqueSourceNames)

  // --- Ringkasan narasi ekstraktif pro/kontra (FR-1.4.3)
  const toQuote = (p: AnalysisInputPost) => ({ text: p.title, source: p.source, url: p.url, score: sentiments.get(p.id)!.score })
  const pro = posts.filter(p => sentiments.get(p.id)!.sentiment === 'positive')
    .sort((a, b) => sentiments.get(b.id)!.score - sentiments.get(a.id)!.score).slice(0, 3).map(toQuote)
  const contra = posts.filter(p => sentiments.get(p.id)!.sentiment === 'negative')
    .sort((a, b) => sentiments.get(a.id)!.score - sentiments.get(b.id)!.score).slice(0, 3).map(toQuote)
  const topRegions = regional.slice(0, 3).map(r => r.provinceName)
  const summary = [
    `${posts.length} publikasi dari ${uniqueSourceNames.length} sumber publik terekam sejak ${formatWib(first.publishedAt)}.`,
    `Komposisi sentimen: ${pct(sentimentCounts.positive)}% positif, ${pct(sentimentCounts.neutral)}% netral, ${pct(sentimentCounts.negative)}% negatif.`,
    keyPhrases.length ? `Frasa dominan: ${keyPhrases.slice(0, 4).map(k => `"${k.phrase}"`).join(', ')}.` : '',
    topRegions.length ? `Wilayah paling banyak disebut: ${topRegions.join(', ')}.` : '',
    `Indeks duplikasi narasi ${Math.round(duplication.index * 100)}% (${copyPasteCount} publikasi terindikasi salin-tempel).`
  ].filter(Boolean).join(' ')

  // --- Velocity tren (FR-1.1.1)
  const dayMs = 86_400_000
  const last24h = posts.filter(p => now - new Date(p.publishedAt).getTime() <= dayMs).length
  const previous24h = posts.filter(p => {
    const age = now - new Date(p.publishedAt).getTime()
    return age > dayMs && age <= 2 * dayMs
  }).length
  const velocityPct = previous24h === 0 ? (last24h > 0 ? 100 : 0) : Math.round(((last24h - previous24h) / previous24h) * 100)

  return {
    topicId,
    generatedAt: new Date(now).toISOString(),
    totalPosts: posts.length,
    uniqueSources: uniqueSourceNames.length,
    origin,
    nodes,
    edges,
    regional,
    sentiment: {
      positive: pct(sentimentCounts.positive),
      neutral: pct(sentimentCounts.neutral),
      negative: pct(sentimentCounts.negative),
      averageScore: Math.round((scoreSum / posts.length) * 100) / 100
    },
    keyPhrases,
    entities,
    narrative: { summary, pro, contra },
    duplication,
    trend: { last24h, previous24h, velocityPct, isTrending: last24h >= 3 && velocityPct >= 50 },
    timeline: buildDailyTimeline(posts, sentiments)
  }
}

function wibDate(ms: number): string {
  return formatWib(new Date(ms).toISOString()).slice(0, 10)
}

/** Ember harian berbasis tanggal WIB; hari tanpa publikasi tetap muncul agar sumbu waktu jujur. */
function buildDailyTimeline(
  posts: AnalysisInputPost[],
  sentiments: Map<string, { sentiment: SentimentType }>
): IssueAnalysis['timeline'] {
  const buckets = new Map<string, { positive: number; neutral: number; negative: number }>()
  for (const p of posts) {
    const date = wibDate(new Date(p.publishedAt).getTime())
    const bucket = buckets.get(date) ?? { positive: 0, neutral: 0, negative: 0 }
    bucket[sentiments.get(p.id)!.sentiment]++
    buckets.set(date, bucket)
  }
  const dates = [...buckets.keys()].sort()
  if (!dates.length) return []
  const out: IssueAnalysis['timeline'] = []
  const dayMs = 86_400_000
  // Tanggal WIB "YYYY-MM-DD" diparse sebagai tengah hari UTC agar iterasi harian tidak bergeser zona waktu
  for (let t = Date.parse(`${dates[0]}T12:00:00Z`); t <= Date.parse(`${dates[dates.length - 1]}T12:00:00Z`); t += dayMs) {
    const date = new Date(t).toISOString().slice(0, 10)
    out.push({ date, ...(buckets.get(date) ?? { positive: 0, neutral: 0, negative: 0 }) })
  }
  return out
}
