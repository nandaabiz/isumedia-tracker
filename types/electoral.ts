export type ElectionYear = 2014 | 2019 | 2024

export type PartyCode =
  | 'PDIP'
  | 'GOLKAR'
  | 'GERINDRA'
  | 'PKB'
  | 'PKS'
  | 'NASDEM'
  | 'DEMOKRAT'
  | 'PAN'
  | 'PPP'
  | 'PSI'
  | 'HANURA'
  | 'PERINDO'
  | 'PBB'
  | 'PKPI'
  | 'BERKARYA'
  | 'GARUDA'
  | 'GELORA'
  | 'BURUH'
  | 'UMMAT'
  | 'PKN'

export type VoterClassification =
  | 'stronghold'     // Kandang Loyalis Kuat
  | 'leaning_loyal'  // Condong Loyalis
  | 'battleground'   // Medan Pertempuran Sengit (High Swing)
  | 'volatile'       // Sangat Mengambang / Fluktuatif
  | 'insufficient'   // Data Pileg < 2 periode (mis. provinsi pemekaran 2022)

export interface PartyResult {
  partyCode: PartyCode
  partyName: string
  /** 0 bila sumber hanya menyediakan kursi */
  voteCount: number
  votePercentage: number
  colorHex: string
  seatsWon?: number
}

export interface PresidentialResult {
  candidates: {
    name: string
    parties: string[]
    votes: number
    percentage: number
    colorHex: string
    isWinner: boolean
  }[]
  totalValidVotes: number
}

export interface LegislativeResult {
  winnerParty: PartyCode
  /** Dasar penentuan pemenang: suara sah atau (bila suara tidak tersedia) kursi */
  winnerBasis: 'votes' | 'seats'
  totalValidVotes?: number
  parties: PartyResult[]
}

/** Nilai indikator BPS beserta tahun acuan datanya */
export interface DemographyIndicator {
  value: number
  refYear: number
  /** Angka Indonesia pada tahun acuan yang sama */
  national?: number
}

export type GenerationKey = 'postGenZ' | 'genZ' | 'millennial' | 'genX' | 'boomer' | 'preBoomer'

/** Komposisi generasi hasil Sensus Penduduk 2020 (persen terhadap total penduduk) */
export interface GenerationProfile {
  refYear: number
  totalPopulation: number
  shares: Record<GenerationKey, number>
  genZAndMillennial: number
  nationalGenZAndMillennial?: number
}

/** Persentase penduduk bekerja menurut lapangan pekerjaan utama (Sakernas Agustus) */
export interface EmploymentProfile {
  refYear: number
  /** Urut menurun; label sektor mengikuti tabel BPS tahun acuan */
  sectors: { sector: string; percentage: number }[]
}

/** Tipologi turunan aplikasi dari % penduduk perkotaan: ≥ 60 urban, 40–60 transisi, < 40 rural */
export type UrbanTypology = 'urban' | 'transition' | 'rural'

export interface DemographySnapshot {
  /** Proyeksi penduduk BPS (bukan hasil sensus) */
  urbanPercentage?: DemographyIndicator
  urbanTypology?: UrbanTypology
  hdi?: DemographyIndicator
  meanYearsSchooling?: DemographyIndicator
  expectedYearsSchooling?: DemographyIndicator
  /** Indeks Pendidikan IPM = (RLS/15 + HLS/18) / 2, dihitung dari RLS & HLS BPS */
  educationIndex?: DemographyIndicator
  generations?: GenerationProfile
  employment?: EmploymentProfile
}

/** Hasil Pilgub terdekat dengan tanggal pemilu nasional (lihat SOURCES-pilkada.md) */
export interface GubernatorialResult {
  electionYear: number
  /** null = tanggal pemungutan tidak terverifikasi */
  electionDate: string | null
  winner: string
  /** Kode partai (lihat PartyCode) atau nama resmi partai lokal/non-parlemen; null = pengusung tidak terverifikasi */
  parties: string[] | null
  independent: boolean | null
  votePercentage?: number
  source: string
  note?: string
}

export interface ProvinceElectoralData {
  id: string
  code: string
  name: string
  capital: string
  island: 'Jawa' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Bali-Nusa' | 'Maluku-Papua'
  coordinates: [number, number] // [lat, lng]
  /** Tahun tanpa data: provinsi belum ada atau masih bergabung dengan provinsi induk */
  dpt: Partial<Record<ElectionYear, number>>
  turnoutPercentage: Partial<Record<ElectionYear, number>>
  dataNotes: string[]
  presidential: Partial<Record<ElectionYear, PresidentialResult>>
  legislative: Partial<Record<ElectionYear, LegislativeResult>>
  /** Profil sosio-demografis BPS dengan tahun acuan terdekat tiap pemilu */
  demography: Partial<Record<ElectionYear, DemographySnapshot>>
  gubernatorial: Partial<Record<ElectionYear, GubernatorialResult>>
  voterProfile: {
    classification: VoterClassification
    loyaltyParty?: PartyCode
    loyaltyScore: number // 0.0 - 1.0
    pedersenSwingIndex: number // Volatilitas pemilih
    /** Hasil perhitungan dari data Pileg (lib/electoral-metrics) */
    metrics?: VoterMetrics
  }
}

export interface VoterMetrics {
  classification: VoterClassification
  loyaltyParty?: PartyCode
  loyaltyScore: number
  /** Rata-rata Pedersen Index lintas periode */
  pedersenSwingIndex: number
  pedersenByPeriod: { from: ElectionYear; to: ElectionYear; value: number }[]
  winnersByYear: Partial<Record<ElectionYear, PartyCode>>
  /** Selisih maks–min porsi suara partai modal (poin persen) */
  modalWinnerShareRange: number
}

export interface SplitTicketResult {
  year: ElectionYear
  presidentialWinner: string
  coalition: string[]
  legislativeWinner: PartyCode
  isSplitTicket: boolean
  /** FR-2.2.2 eksekutif daerah vs legislatif; tidak ada bila Pilgub tidak tersedia */
  governor?: {
    winner: string
    parties: string[] | null
    electionYear: number
    independent: boolean | null
    /** Partai pemenang Pileg DPR RI termasuk pengusung gubernur terpilih; undefined bila pengusung tidak terverifikasi */
    alignedWithLegislative?: boolean
  }
}

export interface ElectionNewsRecord {
  year: ElectionYear
  date: string
  headline: string
  source: string
  provinceAffected: string
  impactDescription: string
  sentimentDirection: 'swung_to_challenger' | 'reinforced_incumbent' | 'split_vote'
}
