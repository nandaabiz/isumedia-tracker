import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildProvinces } from '../lib/electoral-data.ts'
import { detectSplitTicket } from '../lib/electoral-metrics.ts'

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/electoral/${f}`, import.meta.url), 'utf8'))

test('buildProvinces dari data resmi: 38 provinsi, cakupan per tahun sesuai sejarah pemekaran', () => {
  const provinces = buildProvinces({
    provinces: read('provinces.json'),
    presidential: read('presidential.json'),
    voters: read('voters.json'),
    legislative: {},
    demography: read('demography.json'),
    pilkada: read('pilkada.json')
  })
  assert.equal(provinces.length, 38)
  const count = (y: 2014 | 2019 | 2024) => provinces.filter(p => p.presidential[y]).length
  assert.equal(count(2014), 33)
  assert.equal(count(2019), 34)
  assert.equal(count(2024), 38)

  const papuaTengah = provinces.find(p => p.code === '94')!
  assert.equal(papuaTengah.presidential[2019], undefined)
  assert.ok(papuaTengah.dataNotes.length > 0)

  // Jawa Tengah 2019: Jokowi - Ma'ruf menang
  const jateng = provinces.find(p => p.code === '33')!
  assert.equal(jateng.presidential[2019]!.candidates.find(c => c.isWinner)!.name, "Jokowi - Ma'ruf")
  const pctSum = jateng.presidential[2019]!.candidates.reduce((s, c) => s + c.percentage, 0)
  assert.ok(Math.abs(pctSum - 100) < 0.05)

  // Profil BPS bersumber di 38 provinsi untuk 2024
  assert.equal(provinces.filter(p => p.demography[2024]?.hdi).length, 38)
  assert.equal(jateng.demography[2019]!.hdi!.refYear, 2019)

  // Pilgub: 37 provinsi 2024 (DIY tanpa Pilgub)
  assert.equal(provinces.filter(p => p.gubernatorial[2024]).length, 37)
  const diy = provinces.find(p => p.code === '34')!
  assert.deepEqual(diy.gubernatorial, {})
  assert.ok(diy.dataNotes.some(n => n.includes('UU 13/2012')))
})

test('pemenang Pileg berbasis suara, jatuh ke kursi bila suara tidak tersedia', () => {
  const base = { provinces: [{ code: '11', name: 'Aceh', island: 'Sumatera', capital: 'Banda Aceh', coordinates: [5.5, 95.3] }], presidential: {}, voters: {} } as any
  const [byVotes] = buildProvinces({ ...base, legislative: { 2024: { 11: { parties: [{ partyCode: 'GERINDRA', votes: 100, seats: 1 }, { partyCode: 'PKS', votes: 300, seats: 1 }] } } } })
  assert.equal(byVotes.legislative[2024]!.winnerParty, 'PKS')
  assert.equal(byVotes.legislative[2024]!.winnerBasis, 'votes')
  assert.equal(byVotes.legislative[2024]!.parties[0].votePercentage, 75)

  const [bySeats] = buildProvinces({ ...base, legislative: { 2014: { 11: { parties: [{ partyCode: 'GOLKAR', seats: 1 }, { partyCode: 'NASDEM', seats: 3 }] } } } })
  assert.equal(bySeats.legislative[2014]!.winnerParty, 'NASDEM')
  assert.equal(bySeats.legislative[2014]!.winnerBasis, 'seats')
})

test('split-ticket memakai koalisi resmi capres (kode partai)', () => {
  const [p] = buildProvinces({
    provinces: [{ code: '33', name: 'Jawa Tengah', island: 'Jawa', capital: 'Semarang', coordinates: [-7, 110.4] }],
    presidential: { 2024: { 33: { totalValidVotes: 100, candidates: [{ name: 'Prabowo - Gibran (02)', votes: 60 }, { name: 'Ganjar - Mahfud (03)', votes: 40 }] } } },
    voters: {},
    legislative: { 2024: { 33: { parties: [{ partyCode: 'PDIP', votes: 50 }, { partyCode: 'GERINDRA', votes: 30 }] } } },
    pilkada: { 2024: { 33: { electionYear: 2024, winner: 'A - B', parties: ['GERINDRA', 'GOLKAR'], independent: false, source: 'x' } } }
  } as any)
  const result = detectSplitTicket(p, 2024)!
  assert.equal(result.isSplitTicket, true)
  // Eksekutif vs legislatif: PDIP menang Pileg tapi tidak mengusung gubernur terpilih
  assert.equal(result.governor?.winner, 'A - B')
  assert.equal(result.governor?.alignedWithLegislative, false)
})

test('gubernur perseorangan tidak searah dengan partai mana pun; tanpa Pilgub tidak ada blok gubernur', () => {
  const base = {
    provinces: [{ code: '11', name: 'Aceh', island: 'Sumatera', capital: 'Banda Aceh', coordinates: [5.5, 95.3] }],
    presidential: { 2019: { 11: { totalValidVotes: 10, candidates: [{ name: 'Prabowo - Sandi', votes: 8 }, { name: "Jokowi - Ma'ruf", votes: 2 }] } } },
    voters: {},
    legislative: { 2019: { 11: { parties: [{ partyCode: 'GERINDRA', votes: 5 }, { partyCode: 'PKS', votes: 3 }] } } }
  }
  const [indep] = buildProvinces({ ...base, pilkada: { 2019: { 11: { electionYear: 2017, winner: 'X - Y', parties: [], independent: true, source: 'x' } } } } as any)
  assert.equal(detectSplitTicket(indep, 2019)?.governor?.alignedWithLegislative, false)
  const [aligned] = buildProvinces({ ...base, pilkada: { 2019: { 11: { electionYear: 2017, winner: 'X - Y', parties: ['PKS', 'Gerindra'], independent: false, source: 'x' } } } } as any)
  assert.equal(detectSplitTicket(aligned, 2019)?.governor?.alignedWithLegislative, true)
  const [unverified] = buildProvinces({ ...base, pilkada: { 2019: { 11: { electionYear: 2017, electionDate: null, winner: 'X - Y', parties: null, independent: null, source: 'x' } } } } as any)
  assert.equal(detectSplitTicket(unverified, 2019)?.governor?.winner, 'X - Y')
  assert.equal(detectSplitTicket(unverified, 2019)?.governor?.alignedWithLegislative, undefined)
  const [none] = buildProvinces(base as any)
  assert.equal(detectSplitTicket(none, 2019)?.governor, undefined)
})
