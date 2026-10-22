/**
 * Electoral Metrics (Modul 2 PRD: FR-2.2.2, FR-2.3.1, FR-2.3.2)
 *
 * Pure functions agar hasil perhitungan dapat diverifikasi dan diuji dengan `node --test`.
 */
import type {
  ElectionYear,
  PartyCode,
  ProvinceElectoralData,
  VoterClassification,
  VoterMetrics,
  SplitTicketResult
} from '~/types/electoral'

export const ELECTION_YEARS: ElectionYear[] = [2014, 2019, 2024]

/** FR-2.3.1: stronghold bila pemenang sama 3 periode dan variasi suaranya < 8 poin persen. */
export const STRONGHOLD_MAX_SHARE_RANGE = 8
/** Ambang rata-rata Pedersen untuk wilayah anomali/sangat mengambang. */
export const VOLATILE_MIN_PEDERSEN = 20
/** Ambang rata-rata Pedersen di bawahnya wilayah masih dianggap condong loyal. */
export const LEANING_MAX_PEDERSEN = 12

const OTHERS_BUCKET = '__LAINNYA__'

/**
 * Pedersen Index = ½ Σ |P(i,t) − P(i,t−1)|.
 * Partai yang tidak tercatat digabung ke satu bucket "lainnya" (100 − Σ partai tercatat) agar total tetap 100%.
 */
export function pedersenIndex(previous: Record<string, number>, current: Record<string, number>): number {
  const withOthers = (shares: Record<string, number>): Record<string, number> => {
    const listed = Object.values(shares).reduce((s, v) => s + v, 0)
    return { ...shares, [OTHERS_BUCKET]: Math.max(0, 100 - listed) }
  }
  const prev = withOthers(previous)
  const curr = withOthers(current)
  const parties = new Set([...Object.keys(prev), ...Object.keys(curr)])
  let total = 0
  for (const p of parties) total += Math.abs((curr[p] ?? 0) - (prev[p] ?? 0))
  return Math.round((total / 2) * 10) / 10
}

function legislativeShares(province: ProvinceElectoralData, year: ElectionYear): Record<string, number> | null {
  const leg = province.legislative[year]
  if (!leg || leg.winnerBasis !== 'votes') return null
  const shares: Record<string, number> = {}
  for (const p of leg.parties) shares[p.partyCode] = p.votePercentage
  return shares
}

export function computeVoterMetrics(province: ProvinceElectoralData): VoterMetrics {
  const years = ELECTION_YEARS.filter(y => province.legislative[y])
  const winners = years.map(y => province.legislative[y]!.winnerParty)

  // Pedersen hanya antar dua pemilu berurutan yang sama-sama punya data suara
  const pedersenByPeriod: VoterMetrics['pedersenByPeriod'] = []
  for (let i = 1; i < years.length; i++) {
    const prev = legislativeShares(province, years[i - 1])
    const curr = legislativeShares(province, years[i])
    if (prev && curr) pedersenByPeriod.push({ from: years[i - 1], to: years[i], value: pedersenIndex(prev, curr) })
  }
  const averagePedersen = pedersenByPeriod.length
    ? Math.round((pedersenByPeriod.reduce((s, p) => s + p.value, 0) / pedersenByPeriod.length) * 10) / 10
    : 0

  // Partai modal = paling sering menang; seri dipecah oleh pemenang terbaru
  const winCount = new Map<PartyCode, number>()
  for (const w of winners) winCount.set(w, (winCount.get(w) ?? 0) + 1)
  let modalParty: PartyCode | undefined
  let modalWins = 0
  for (const w of [...winners].reverse()) {
    if ((winCount.get(w) ?? 0) > modalWins) {
      modalParty = w
      modalWins = winCount.get(w)!
    }
  }

  const modalShares = modalParty
    ? years
        .map(y => province.legislative[y]!)
        .filter(l => l.winnerBasis === 'votes')
        .map(l => l.parties.find(p => p.partyCode === modalParty)?.votePercentage ?? 0)
    : []
  const shareRange = modalShares.length ? Math.round((Math.max(...modalShares) - Math.min(...modalShares)) * 10) / 10 : 0
  const sameWinnerAllPeriods = years.length === ELECTION_YEARS.length && modalWins === ELECTION_YEARS.length

  let classification: VoterClassification
  if (years.length < 2) classification = 'insufficient'
  else if (sameWinnerAllPeriods && shareRange < STRONGHOLD_MAX_SHARE_RANGE) classification = 'stronghold'
  else if (averagePedersen >= VOLATILE_MIN_PEDERSEN) classification = 'volatile'
  else if (sameWinnerAllPeriods || (modalWins >= 2 && averagePedersen < LEANING_MAX_PEDERSEN)) classification = 'leaning_loyal'
  else classification = 'battleground'

  // Loyalitas: porsi kemenangan partai modal, didiskon oleh volatilitas agregat
  const loyaltyScore = years.length
    ? Math.round((modalWins / years.length) * (1 - Math.min(averagePedersen, 100) / 100) * 100) / 100
    : 0

  return {
    classification,
    loyaltyParty: modalWins >= 2 ? modalParty : undefined,
    loyaltyScore,
    pedersenSwingIndex: averagePedersen,
    pedersenByPeriod,
    winnersByYear: Object.fromEntries(years.map(y => [y, province.legislative[y]!.winnerParty])),
    modalWinnerShareRange: shareRange
  }
}

function normalizePartyName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]/g, '')
}

/**
 * FR-2.2.2: Split-ticket voting — partai pemenang Pileg DPR RI di wilayah tersebut
 * bukan anggota koalisi pengusung capres pemenang di wilayah yang sama.
 */
export function detectSplitTicket(province: ProvinceElectoralData, year: ElectionYear): SplitTicketResult | null {
  const pres = province.presidential[year]
  const leg = province.legislative[year]
  const presWinner = pres?.candidates.find(c => c.isWinner)
  if (!presWinner || !leg?.winnerParty) return null
  const coalition = presWinner.parties.map(normalizePartyName)
  return {
    year,
    presidentialWinner: presWinner.name,
    coalition: presWinner.parties,
    legislativeWinner: leg.winnerParty,
    isSplitTicket: !coalition.includes(normalizePartyName(leg.winnerParty))
  }
}
