import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeVoterMetrics, detectSplitTicket, pedersenIndex } from '../lib/electoral-metrics.ts'
import type { ElectionYear, PartyCode, ProvinceElectoralData } from '../types/electoral.ts'

test('pedersen index sesuai formula ½ Σ |ΔP|', () => {
  // A 50→40, B 30→40, lainnya 20→20 → (10 + 10 + 0) / 2 = 10
  assert.equal(pedersenIndex({ A: 50, B: 30 }, { A: 40, B: 40 }), 10)
  assert.equal(pedersenIndex({ A: 60 }, { A: 60 }), 0)
  // Partai baru masuk: A 50→30, C 0→20, lainnya 50→50 → (20 + 20) / 2 = 20
  assert.equal(pedersenIndex({ A: 50 }, { A: 30, C: 20 }), 20)
})

function province(
  winners: Partial<Record<ElectionYear, [PartyCode, number][]>>,
  presWinnerParties: string[] = ['PDIP']
): ProvinceElectoralData {
  const legislative = Object.fromEntries(
    (Object.entries(winners) as [string, [PartyCode, number][]][]).map(([year, parties]) => [
      year,
      {
        winnerParty: parties[0][0],
        winnerBasis: 'votes',
        parties: parties.map(([partyCode, votePercentage]) => ({
          partyCode, partyName: partyCode, voteCount: 0, votePercentage, colorHex: '#000'
        }))
      }
    ])
  ) as ProvinceElectoralData['legislative']
  const pres = { totalValidVotes: 0, candidates: [{ name: 'X', parties: presWinnerParties, votes: 0, percentage: 60, colorHex: '#000', isWinner: true }] }
  return {
    id: 'p', code: '00', name: 'Uji', capital: 'Kota Uji', island: 'Jawa', coordinates: [0, 0], dataNotes: [],
    dpt: { 2014: 0, 2019: 0, 2024: 0 },
    turnoutPercentage: { 2014: 0, 2019: 0, 2024: 0 },
    presidential: { 2014: pres, 2019: pres, 2024: pres },
    legislative,
    demography: {},
    gubernatorial: {},
    voterProfile: { classification: 'battleground', loyaltyScore: 0, pedersenSwingIndex: 0 }
  }
}

test('stronghold: pemenang sama 3 periode, variasi < 8 poin', () => {
  const m = computeVoterMetrics(province({
    2014: [['PDIP', 30], ['GOLKAR', 20]],
    2019: [['PDIP', 32], ['GOLKAR', 19]],
    2024: [['PDIP', 28], ['GOLKAR', 21]]
  }))
  assert.equal(m.classification, 'stronghold')
  assert.equal(m.loyaltyParty, 'PDIP')
  assert.equal(m.modalWinnerShareRange, 4)
})

test('pemenang berganti tiap periode → battleground', () => {
  const m = computeVoterMetrics(province({
    2014: [['PDIP', 20], ['GERINDRA', 15], ['GOLKAR', 14]],
    2019: [['GERINDRA', 19], ['PDIP', 16], ['GOLKAR', 14]],
    2024: [['GOLKAR', 18], ['GERINDRA', 17], ['PDIP', 13]]
  }))
  assert.equal(m.classification, 'battleground')
  assert.equal(m.loyaltyParty, undefined)
  assert.equal(m.pedersenByPeriod.length, 2)
})

test('volatilitas tinggi → volatile', () => {
  const m = computeVoterMetrics(province({
    2014: [['PDIP', 50], ['GOLKAR', 10]],
    2019: [['GOLKAR', 45], ['PDIP', 15]],
    2024: [['PKS', 40], ['GOLKAR', 10]]
  }))
  assert.equal(m.classification, 'volatile')
  assert.ok(m.pedersenSwingIndex >= 20)
})

test('split-ticket bila pemenang Pileg di luar koalisi capres pemenang', () => {
  const p = province({
    2014: [['PDIP', 20]], 2019: [['PDIP', 20]], 2024: [['PDIP', 20]]
  }, ['Gerindra', 'Golkar', 'NasDem'])
  assert.equal(detectSplitTicket(p, 2024)?.isSplitTicket, true)
  const q = province({
    2014: [['NASDEM', 20]], 2019: [['NASDEM', 20]], 2024: [['NASDEM', 20]]
  }, ['Gerindra', 'NasDem'])
  assert.equal(detectSplitTicket(q, 2024)?.isSplitTicket, false)
})

test('kurang dari dua pemilu → insufficient, satu periode tetap dihitung', () => {
  const single = computeVoterMetrics(province({ 2024: [['PDIP', 30], ['GOLKAR', 20]] }))
  assert.equal(single.classification, 'insufficient')
  assert.equal(single.pedersenByPeriod.length, 0)

  const twoYears = computeVoterMetrics(province({ 2019: [['PDIP', 30]], 2024: [['PDIP', 32]] }))
  assert.notEqual(twoYears.classification, 'insufficient')
  assert.equal(twoYears.pedersenByPeriod.length, 1)
  assert.notEqual(twoYears.classification, 'stronghold')
})
