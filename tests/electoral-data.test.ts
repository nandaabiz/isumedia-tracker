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
    analystNotes: read('analyst-notes.json')
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
})

test('pemenang Pileg berbasis suara, jatuh ke kursi bila suara tidak tersedia', () => {
  const base = { provinces: [{ code: '11', name: 'Aceh', island: 'Sumatera', capital: 'Banda Aceh', coordinates: [5.5, 95.3] }], presidential: {}, voters: {}, analystNotes: {} } as any
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
    analystNotes: {}
  } as any)
  assert.equal(detectSplitTicket(p, 2024)?.isSplitTicket, true)
})
