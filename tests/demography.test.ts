import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildDemographySnapshot,
  demographicVoteCorrelations,
  educationIndex,
  nearestRefYear,
  pearson,
  urbanTypology
} from '../lib/demography.ts'
import { buildProvinces } from '../lib/electoral-data.ts'

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/electoral/${f}`, import.meta.url), 'utf8'))
const demography = read('demography.json')
const provinces = read('provinces.json') as { code: string }[]

test('nearestRefYear memilih tahun terdekat, seri memilih yang lebih awal', () => {
  assert.equal(nearestRefYear([2015, 2020, 2025], 2014), 2015)
  assert.equal(nearestRefYear([2020, 2025], 2024), 2025)
  assert.equal(nearestRefYear([2018, 2020], 2019), 2018)
  assert.equal(nearestRefYear([], 2019), undefined)
})

test('indeks pendidikan & tipologi urban', () => {
  // Rumus BPS: (RLS/15 + HLS/18) / 2
  assert.equal(educationIndex(9, 13.5), 67.5)
  assert.equal(educationIndex(20, 20), 100)
  assert.equal(urbanTypology(60), 'urban')
  assert.equal(urbanTypology(45.1), 'transition')
  assert.equal(urbanTypology(39.9), 'rural')
})

test('profil BPS 2024 tersedia untuk 38 provinsi dengan tahun acuan', () => {
  for (const { code } of provinces) {
    const s = buildDemographySnapshot(demography, code, 2024)
    assert.ok(s?.hdi && s.hdi.refYear === 2024, `IPM 2024 ${code}`)
    assert.ok(s.generations?.refYear === 2025, `generasi SUPAS 2025 ${code}`)
    assert.ok(s.employment?.refYear === 2024 && s.employment.sectors.length >= 10, `Sakernas 2024 ${code}`)
    assert.ok(s.educationIndex, `indeks pendidikan ${code}`)
    assert.ok(s.hdi.national === 74.2)
  }
})

test('batas wilayah pemekaran Papua & jarak tahun acuan dihormati', () => {
  // Proyeksi perkotaan berbatas lama: dipakai untuk Papua 2019, tidak untuk 2024
  assert.equal(buildDemographySnapshot(demography, '91', 2019)?.urbanPercentage?.refYear, 2020)
  assert.equal(buildDemographySnapshot(demography, '91', 2024)?.urbanPercentage, undefined)
  assert.equal(buildDemographySnapshot(demography, '93', 2019), undefined)
  // Kalimantan Utara tidak ada di tabel proyeksi
  assert.equal(buildDemographySnapshot(demography, '65', 2024)?.urbanPercentage, undefined)
  // 2014: SP2020 & Sakernas 2021 terlalu jauh (> 4 tahun)
  const aceh2014 = buildDemographySnapshot(demography, '11', 2014)!
  assert.equal(aceh2014.generations, undefined)
  assert.equal(aceh2014.employment, undefined)
  assert.equal(aceh2014.urbanPercentage?.refYear, 2015)
  assert.equal(aceh2014.hdi?.refYear, 2014)
  // 2019 memakai SP2020 batas lama & Sakernas 2021
  const papua2019 = buildDemographySnapshot(demography, '91', 2019)!
  assert.equal(papua2019.generations?.refYear, 2020)
  assert.equal(papua2019.employment?.refYear, 2021)
})

test('persentase generasi dihitung dari jumlah penduduk', () => {
  const jakarta = buildDemographySnapshot(demography, '31', 2024)!.generations!
  const sum = Object.values(jakarta.shares).reduce((s, v) => s + v, 0)
  assert.ok(Math.abs(sum - 100) < 0.05)
  assert.equal(jakarta.genZAndMillennial, Math.round(((demography.generations.data['2025']['31'].genZ + demography.generations.data['2025']['31'].millennial) / demography.generations.data['2025']['31'].total) * 10000) / 100)
  assert.ok(jakarta.nationalGenZAndMillennial! > 40)
})

test('pearson & korelasi lintas provinsi', () => {
  assert.equal(pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1)
  assert.equal(pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1)
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), undefined)
  assert.equal(pearson([1, 2], [1, 2]), undefined)

  const built = buildProvinces({
    provinces: read('provinces.json'),
    presidential: read('presidential.json'),
    voters: {},
    legislative: {},
    demography
  })
  const corr = demographicVoteCorrelations(built, 2024)
  const urban = corr.find(c => c.candidate === 'Anies - Muhaimin (01)' && c.factor === 'urbanPercentage')!
  assert.equal(urban.n, 31) // 38 − Kaltara − 6 provinsi Papua tanpa angka perkotaan 2024
  assert.ok(corr.every(c => c.r >= -1 && c.r <= 1))
  assert.equal(corr.filter(c => c.factor === 'hdi').length, 3)
})
