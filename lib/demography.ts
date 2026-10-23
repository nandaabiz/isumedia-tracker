/**
 * Profil sosio-demografis BPS per provinsi (FR-2.3.3) dari `data/electoral/demography.json`
 * (lihat SOURCES-demography.md). Modul murni agar dapat diuji dengan `node --test`.
 */
import type {
  DemographyIndicator,
  DemographySnapshot,
  ElectionYear,
  EmploymentProfile,
  GenerationKey,
  GenerationProfile,
  ProvinceElectoralData,
  UrbanTypology
} from '~/types/electoral'

/** Kunci angka nasional di setiap tabel */
export const NATIONAL_KEY = 'ID'
/** Provinsi induk yang wilayahnya berubah oleh pemekaran Papua 2022 */
const SPLIT_PARENTS = ['91', '92']
/** Tahun pemilu pertama yang memakai batas 38 provinsi */
const POST_SPLIT_ELECTION: ElectionYear = 2024

type ByCode<T> = Record<string, T>
/** `boundary: 'pre2022'` = angka 91/92 memakai batas sebelum pemekaran walau tahun acuannya ≥ 2022 (mis. proyeksi 2013) */
export interface RawIndicatorTable { boundary?: 'pre2022'; data: Record<string, ByCode<number>> }
export type RawGenerationCounts = Record<GenerationKey | 'total', number>
export interface RawDemography {
  urbanPercentage: RawIndicatorTable
  hdi: RawIndicatorTable
  meanYearsSchooling: RawIndicatorTable
  expectedYearsSchooling: RawIndicatorTable
  generations: { data: Record<string, ByCode<RawGenerationCounts>> }
  employment: { data: Record<string, ByCode<Record<string, number>>> }
}

/** Tahun acuan yang berjarak lebih jauh dari ini tidak dipakai (mis. SP2020 untuk Pemilu 2014) */
export const MAX_REF_YEAR_GAP = 4
const GENERATION_KEYS: GenerationKey[] = ['postGenZ', 'genZ', 'millennial', 'genX', 'boomer', 'preBoomer']
const round2 = (n: number) => Math.round(n * 100) / 100

/** Tahun acuan terdekat; bila berjarak sama, pilih yang lebih awal (data yang sudah ada saat pemilu) */
export function nearestRefYear(available: number[], target: number): number | undefined {
  return [...available].sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)[0]
}

/** Angka 91/92 sebelum 2022 mencakup wilayah provinsi pemekaran, jadi hanya cocok untuk pemilu 2014/2019 */
function boundaryMatches(code: string, year: ElectionYear, refYear: number, boundary?: 'pre2022'): boolean {
  if (!SPLIT_PARENTS.includes(code)) return true
  const preSplitData = boundary === 'pre2022' || refYear < 2022
  return preSplitData === (year < POST_SPLIT_ELECTION)
}

function pickTable<T>(data: Record<string, ByCode<T>>, code: string, year: ElectionYear, boundary?: 'pre2022') {
  const years = Object.keys(data)
    .map(Number)
    .filter(y => data[y][code] !== undefined && Math.abs(y - year) <= MAX_REF_YEAR_GAP && boundaryMatches(code, year, y, boundary))
  const refYear = nearestRefYear(years, year)
  return refYear === undefined ? undefined : { refYear, value: data[refYear][code], national: data[refYear][NATIONAL_KEY] }
}

function pickIndicator(table: RawIndicatorTable, code: string, year: ElectionYear): DemographyIndicator | undefined {
  const hit = pickTable(table.data, code, year, table.boundary)
  return hit && { value: hit.value, refYear: hit.refYear, national: hit.national }
}

export function urbanTypology(urbanPct: number): UrbanTypology {
  if (urbanPct >= 60) return 'urban'
  if (urbanPct >= 40) return 'transition'
  return 'rural'
}

/** Indeks Pendidikan metode baru BPS: rata-rata RLS/15 dan HLS/18 */
export function educationIndex(meanYears: number, expectedYears: number): number {
  return round2(((Math.min(meanYears, 15) / 15 + Math.min(expectedYears, 18) / 18) / 2) * 100)
}

function generationShares(counts: RawGenerationCounts) {
  const shares = Object.fromEntries(GENERATION_KEYS.map(k => [k, round2((counts[k] / counts.total) * 100)])) as Record<GenerationKey, number>
  return { shares, genZAndMillennial: round2(((counts.genZ + counts.millennial) / counts.total) * 100) }
}

function pickGenerations(raw: RawDemography['generations'], code: string, year: ElectionYear): GenerationProfile | undefined {
  const hit = pickTable(raw.data, code, year)
  if (!hit) return undefined
  const { shares, genZAndMillennial } = generationShares(hit.value)
  const national = hit.national
  return {
    refYear: hit.refYear,
    totalPopulation: hit.value.total,
    shares,
    genZAndMillennial,
    nationalGenZAndMillennial: national ? generationShares(national).genZAndMillennial : undefined
  }
}

function pickEmployment(raw: RawDemography['employment'], code: string, year: ElectionYear): EmploymentProfile | undefined {
  const hit = pickTable(raw.data, code, year)
  if (!hit) return undefined
  return {
    refYear: hit.refYear,
    sectors: Object.entries(hit.value)
      .map(([sector, percentage]) => ({ sector, percentage }))
      .sort((a, b) => b.percentage - a.percentage)
  }
}

export function buildDemographySnapshot(raw: RawDemography, code: string, year: ElectionYear): DemographySnapshot | undefined {
  const urbanPercentage = pickIndicator(raw.urbanPercentage, code, year)
  const meanYearsSchooling = pickIndicator(raw.meanYearsSchooling, code, year)
  const expectedYearsSchooling = pickIndicator(raw.expectedYearsSchooling, code, year)
  const snapshot: DemographySnapshot = {
    urbanPercentage,
    urbanTypology: urbanPercentage && urbanTypology(urbanPercentage.value),
    hdi: pickIndicator(raw.hdi, code, year),
    meanYearsSchooling,
    expectedYearsSchooling,
    generations: pickGenerations(raw.generations, code, year),
    employment: pickEmployment(raw.employment, code, year)
  }
  if (meanYearsSchooling && expectedYearsSchooling && meanYearsSchooling.refYear === expectedYearsSchooling.refYear) {
    const national = meanYearsSchooling.national !== undefined && expectedYearsSchooling.national !== undefined
      ? educationIndex(meanYearsSchooling.national, expectedYearsSchooling.national)
      : undefined
    snapshot.educationIndex = {
      value: educationIndex(meanYearsSchooling.value, expectedYearsSchooling.value),
      refYear: meanYearsSchooling.refYear,
      national
    }
  }
  const filled = Object.fromEntries(Object.entries(snapshot).filter(([, v]) => v !== undefined)) as DemographySnapshot
  return Object.keys(filled).length ? filled : undefined
}

/** Koefisien korelasi Pearson; undefined bila n < 3 atau variansi nol */
export function pearson(xs: number[], ys: number[]): number | undefined {
  const n = xs.length
  if (n < 3 || n !== ys.length) return undefined
  const mx = xs.reduce((s, x) => s + x, 0) / n
  const my = ys.reduce((s, y) => s + y, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (ys[i] - my) ** 2
  }
  if (!sxx || !syy) return undefined
  return Math.round((sxy / Math.sqrt(sxx * syy)) * 100) / 100
}

export type DemographicFactor = 'urbanPercentage' | 'hdi' | 'educationIndex' | 'genZAndMillennial' | 'agricultureShare'

export const FACTOR_LABEL: Record<DemographicFactor, string> = {
  urbanPercentage: '% penduduk perkotaan',
  hdi: 'IPM',
  educationIndex: 'Indeks pendidikan',
  genZAndMillennial: '% Gen Z + Milenial',
  agricultureShare: '% pekerja pertanian'
}

/** Sektor pertanian pada label BPS lintas klasifikasi (KBLI 2009 & 2015) */
export function agricultureShare(employment?: EmploymentProfile): number | undefined {
  return employment?.sectors.find(s => /^pertanian/i.test(s.sector))?.percentage
}

function factorValue(snapshot: DemographySnapshot | undefined, factor: DemographicFactor): number | undefined {
  if (!snapshot) return undefined
  if (factor === 'genZAndMillennial') return snapshot.generations?.genZAndMillennial
  if (factor === 'agricultureShare') return agricultureShare(snapshot.employment)
  return snapshot[factor]?.value
}

export interface FactorCorrelation {
  candidate: string
  factor: DemographicFactor
  r: number
  n: number
}

/**
 * Korelasi lintas provinsi antara indikator BPS dan porsi suara tiap capres.
 * Korelasi ekologis tingkat provinsi: menunjukkan pola wilayah, bukan perilaku individu pemilih.
 */
export function demographicVoteCorrelations(provinces: ProvinceElectoralData[], year: ElectionYear): FactorCorrelation[] {
  const candidates = new Set(provinces.flatMap(p => p.presidential[year]?.candidates.map(c => c.name) ?? []))
  const factors = Object.keys(FACTOR_LABEL) as DemographicFactor[]
  const result: FactorCorrelation[] = []
  for (const candidate of candidates) {
    for (const factor of factors) {
      const pairs = provinces
        .map(p => [factorValue(p.demography[year], factor), p.presidential[year]?.candidates.find(c => c.name === candidate)?.percentage] as const)
        .filter((pair): pair is readonly [number, number] => pair[0] !== undefined && pair[1] !== undefined)
      const r = pearson(pairs.map(p => p[0]), pairs.map(p => p[1]))
      if (r !== undefined) result.push({ candidate, factor, r, n: pairs.length })
    }
  }
  return result
}
