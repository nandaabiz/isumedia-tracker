/**
 * Menyusun `ProvinceElectoralData` dari file data resmi di `data/electoral/` (lihat SOURCES-*.md).
 * Modul murni agar dapat diuji dengan `node --test`.
 */
import type {
  AnalystProfileNote,
  ElectionYear,
  LegislativeResult,
  PartyCode,
  PresidentialResult,
  ProvinceElectoralData
} from '~/types/electoral'

export const PARTY_COLORS: Record<PartyCode, { name: string; hex: string }> = {
  PDIP: { name: 'PDI Perjuangan', hex: '#B91C1C' },
  GOLKAR: { name: 'Partai Golkar', hex: '#D97706' },
  GERINDRA: { name: 'Partai Gerindra', hex: '#0284C7' },
  PKB: { name: 'Partai Kebangkitan Bangsa', hex: '#15803D' },
  PKS: { name: 'Partai Keadilan Sejahtera', hex: '#EA580C' },
  NASDEM: { name: 'Partai NasDem', hex: '#1E3A8A' },
  DEMOKRAT: { name: 'Partai Demokrat', hex: '#2563EB' },
  PAN: { name: 'Partai Amanat Nasional', hex: '#0E7490' },
  PPP: { name: 'Partai Persatuan Pembangunan', hex: '#047857' },
  PSI: { name: 'Partai Solidaritas Indonesia', hex: '#E11D48' },
  HANURA: { name: 'Partai Hanura', hex: '#C2410C' },
  PERINDO: { name: 'Partai Perindo', hex: '#1D4ED8' },
  PBB: { name: 'Partai Bulan Bintang', hex: '#166534' },
  PKPI: { name: 'PKPI', hex: '#9F1239' },
  BERKARYA: { name: 'Partai Berkarya', hex: '#A16207' },
  GARUDA: { name: 'Partai Garuda', hex: '#7F1D1D' },
  GELORA: { name: 'Partai Gelora', hex: '#0369A1' },
  BURUH: { name: 'Partai Buruh', hex: '#EA580C' },
  UMMAT: { name: 'Partai Ummat', hex: '#3F3F46' },
  PKN: { name: 'Partai Kebangkitan Nusantara', hex: '#BE123C' }
}

/** Koalisi pengusung resmi tiap pasangan calon (kode partai) dan warna penanda */
export const CANDIDATE_META: Record<ElectionYear, Record<string, { coalition: PartyCode[]; colorHex: string }>> = {
  2014: {
    'Prabowo - Hatta': { coalition: ['GERINDRA', 'GOLKAR', 'PAN', 'PKS', 'PPP', 'PBB'], colorHex: '#0284C7' },
    'Jokowi - JK': { coalition: ['PDIP', 'PKB', 'NASDEM', 'HANURA', 'PKPI'], colorHex: '#B91C1C' }
  },
  2019: {
    "Jokowi - Ma'ruf": { coalition: ['PDIP', 'GOLKAR', 'PKB', 'NASDEM', 'PPP', 'HANURA', 'PERINDO', 'PSI', 'PKPI'], colorHex: '#B91C1C' },
    'Prabowo - Sandi': { coalition: ['GERINDRA', 'PKS', 'PAN', 'DEMOKRAT', 'BERKARYA'], colorHex: '#0284C7' }
  },
  2024: {
    'Anies - Muhaimin (01)': { coalition: ['NASDEM', 'PKB', 'PKS', 'UMMAT'], colorHex: '#1E3A8A' },
    'Prabowo - Gibran (02)': { coalition: ['GERINDRA', 'GOLKAR', 'PAN', 'DEMOKRAT', 'PSI', 'PBB', 'GELORA', 'GARUDA'], colorHex: '#0284C7' },
    'Ganjar - Mahfud (03)': { coalition: ['PDIP', 'PPP', 'PERINDO', 'HANURA'], colorHex: '#B91C1C' }
  }
}

const YEARS: ElectionYear[] = [2014, 2019, 2024]

export interface RawProvince {
  code: string
  name: string
  island: ProvinceElectoralData['island']
  capital: string
  coordinates: [number, number]
}
type ByYear<T> = Partial<Record<string, Record<string, T>>>
export interface RawPresidential { totalValidVotes: number; candidates: { name: string; votes: number }[] }
export interface RawVoters { dpt: number; turnoutPct?: number; turnoutVoters?: number; note?: string }
export interface RawLegislative { totalValidVotes?: number; parties: { partyCode: string; votes?: number; seats?: number }[] }

const round2 = (n: number) => Math.round(n * 100) / 100

function buildPresidential(year: ElectionYear, raw?: RawPresidential): PresidentialResult | undefined {
  if (!raw) return undefined
  const maxVotes = Math.max(...raw.candidates.map(c => c.votes))
  return {
    totalValidVotes: raw.totalValidVotes,
    candidates: raw.candidates.map(c => {
      const meta = CANDIDATE_META[year][c.name]
      return {
        name: c.name,
        parties: meta?.coalition ?? [],
        votes: c.votes,
        percentage: raw.totalValidVotes ? round2((c.votes / raw.totalValidVotes) * 100) : 0,
        colorHex: meta?.colorHex ?? '#64748B',
        isWinner: c.votes === maxVotes
      }
    })
  }
}

function buildLegislative(raw?: RawLegislative): LegislativeResult | undefined {
  if (!raw?.parties.length) return undefined
  const known = raw.parties.filter(p => p.partyCode in PARTY_COLORS) as { partyCode: PartyCode; votes?: number; seats?: number }[]
  const hasVotes = known.some(p => typeof p.votes === 'number' && p.votes > 0)
  const totalVotes = raw.totalValidVotes ?? known.reduce((s, p) => s + (p.votes ?? 0), 0)
  const parties = known
    .map(p => ({
      partyCode: p.partyCode,
      partyName: PARTY_COLORS[p.partyCode].name,
      voteCount: p.votes ?? 0,
      votePercentage: hasVotes && totalVotes ? round2(((p.votes ?? 0) / totalVotes) * 100) : 0,
      colorHex: PARTY_COLORS[p.partyCode].hex,
      seatsWon: p.seats
    }))
    .sort((a, b) => (hasVotes ? b.voteCount - a.voteCount : (b.seatsWon ?? 0) - (a.seatsWon ?? 0)))
  if (!hasVotes && !parties.some(p => (p.seatsWon ?? 0) > 0)) return undefined
  return {
    winnerParty: parties[0].partyCode,
    winnerBasis: hasVotes ? 'votes' : 'seats',
    totalValidVotes: hasVotes ? totalVotes : undefined,
    parties
  }
}

export function buildProvinces(input: {
  provinces: RawProvince[]
  presidential: ByYear<RawPresidential>
  voters: ByYear<RawVoters>
  legislative: ByYear<RawLegislative>
  analystNotes: Record<string, AnalystProfileNote>
}): ProvinceElectoralData[] {
  return input.provinces.map(p => {
    const dataNotes: string[] = []
    const dpt: ProvinceElectoralData['dpt'] = {}
    const turnoutPercentage: ProvinceElectoralData['turnoutPercentage'] = {}
    const presidential: ProvinceElectoralData['presidential'] = {}
    const legislative: ProvinceElectoralData['legislative'] = {}

    for (const year of YEARS) {
      const voters = input.voters[year]?.[p.code]
      if (voters) {
        dpt[year] = voters.dpt
        if (voters.turnoutPct !== undefined) turnoutPercentage[year] = voters.turnoutPct
        if (voters.note) dataNotes.push(`${year}: ${voters.note}`)
      }
      const pres = buildPresidential(year, input.presidential[year]?.[p.code])
      if (pres) presidential[year] = pres
      const leg = buildLegislative(input.legislative[year]?.[p.code])
      if (leg) legislative[year] = leg
    }

    if (['93', '94', '95', '96'].includes(p.code)) {
      dataNotes.push('Provinsi hasil pemekaran 2022: data 2014 & 2019 tercakup dalam provinsi induk (Papua/Papua Barat).')
    }
    if (p.code === '31') {
      dataNotes.push('Suara Pileg DKI Jakarta termasuk pemilih luar negeri (bagian Dapil DKI Jakarta II).')
    }
    if (Object.values(legislative).some(l => l?.winnerBasis === 'seats')) {
      dataNotes.push(`Rekap suara Pileg ${YEARS.filter(y => legislative[y]?.winnerBasis === 'seats').join(', ')} tidak tersedia; pemenang ditentukan dari perolehan kursi.`)
    }
    if (p.code === '65' && !presidential[2014]) {
      dataNotes.push('Pemilu 2014: data Kalimantan Utara masih tergabung dengan Kalimantan Timur.')
    }

    return {
      id: `prov_${p.code}`,
      code: p.code,
      name: p.name,
      capital: p.capital,
      island: p.island,
      coordinates: p.coordinates,
      dpt,
      turnoutPercentage,
      dataNotes,
      presidential,
      legislative,
      voterProfile: {
        classification: 'insufficient',
        loyaltyScore: 0,
        pedersenSwingIndex: 0,
        analystNote: input.analystNotes[p.code]
      }
    }
  })
}
