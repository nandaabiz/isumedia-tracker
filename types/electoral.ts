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

/** Profil kualitatif lama dari catatan analis; belum diverifikasi ke data BPS */
export interface AnalystProfileNote {
  urbanPercentage: number
  genZAndMillennialPercentage: number
  dominantEmployment: string
  keyIssue: string
  historicalNarrative: string
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
  voterProfile: {
    classification: VoterClassification
    loyaltyParty?: PartyCode
    loyaltyScore: number // 0.0 - 1.0
    pedersenSwingIndex: number // Volatilitas pemilih
    analystNote?: AnalystProfileNote
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
