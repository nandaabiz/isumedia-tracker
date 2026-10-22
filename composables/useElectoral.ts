import { ref, computed } from 'vue'
import type {
  ElectionYear,
  ProvinceElectoralData,
  ElectionNewsRecord,
  VoterClassification
} from '~/types/electoral'
import { computeVoterMetrics, detectSplitTicket } from '~/lib/electoral-metrics'
import { buildProvinces, PARTY_COLORS } from '~/lib/electoral-data'
import provincesJson from '~/data/electoral/provinces.json'
import presidentialJson from '~/data/electoral/presidential.json'
import votersJson from '~/data/electoral/voters.json'
import legislativeJson from '~/data/electoral/legislative.json'
import analystNotesJson from '~/data/electoral/analyst-notes.json'

export { PARTY_COLORS }

// Data resmi KPU 38 provinsi (lihat data/electoral/SOURCES-*.md); metrik pemilih dihitung, bukan nilai statis
const PROVINCES_DATA: ProvinceElectoralData[] = buildProvinces({
  provinces: provincesJson as any,
  presidential: presidentialJson as any,
  voters: votersJson as any,
  legislative: legislativeJson as any,
  analystNotes: analystNotesJson as any
}).map(p => {
  const metrics = computeVoterMetrics(p)
  return {
    ...p,
    voterProfile: {
      ...p.voterProfile,
      classification: metrics.classification,
      loyaltyParty: metrics.loyaltyParty,
      loyaltyScore: metrics.loyaltyScore,
      pedersenSwingIndex: metrics.pedersenSwingIndex,
      metrics
    }
  }
})

// Historical news timeline correlated with vote changes
const SEED_ELECTION_NEWS: ElectionNewsRecord[] = [
  {
    year: 2024,
    date: 'Januari - Februari 2024',
    headline: 'Gencarnya Bantuan Sosial Pangan Menjelang Pencoblosan',
    source: 'Arsip Media Kompas & Detik',
    provinceAffected: 'Jawa Tengah & Jawa Timur',
    impactDescription: 'Penyaluran beras CBP dan bansos tunai secara masif berhasil menarik pemilih kelas bawah di perdesaan Jawa Tengah dan Jawa Timur menuju Paslon 02.',
    sentimentDirection: 'reinforced_incumbent'
  },
  {
    year: 2024,
    date: 'November 2023',
    headline: 'Putusan MK No. 90/PUU-XXI/2023 Soal Syarat Usia Capres-Cawapres',
    source: 'Tempo & BBC Indonesia',
    provinceAffected: 'DKI Jakarta & D.I. Yogyakarta',
    impactDescription: 'Memicu resistensi kuat di kalangan pemilih urban dan terpelajar, mendorong perpindahan suara kritis ke Paslon 01 (Anies-Muhaimin).',
    sentimentDirection: 'swung_to_challenger'
  },
  {
    year: 2019,
    date: 'Maret 2019',
    headline: 'Peresmian Tol Trans Jawa Merata dari Merak ke Pasuruan',
    source: 'Media Indonesia',
    provinceAffected: 'Jawa Tengah & Jawa Timur',
    impactDescription: 'Bukti fisik pembangunan infrastruktur memperkokoh kepuasan publik terhadap petahana (Jokowi) hingga mencapai rekor perolehan >77% di Jateng.',
    sentimentDirection: 'reinforced_incumbent'
  },
  {
    year: 2019,
    date: 'April 2019',
    headline: 'Gelombang Reuni 212 dan Seruan Ijtima Ulama Oposisi',
    source: 'Republika & Portal Berita Nasional',
    provinceAffected: 'Jawa Barat, Sumatera Barat, Banten',
    impactDescription: 'Konsolidasi politik identitas keagamaan menghasilkan kemenangan telak bagi Prabowo-Sandi hingga 85.9% di Sumbar dan 59.9% di Jabar.',
    sentimentDirection: 'swung_to_challenger'
  },
  {
    year: 2014,
    date: 'Juni 2014',
    headline: 'Isu JK Sebagai Tokoh Indonesia Timur vs Poros Koalisi Merah Putih',
    source: 'Fajar & Tribun Timur',
    provinceAffected: 'Sulawesi Selatan & Sulawesi Barat',
    impactDescription: 'Efek representasi putra daerah Jusuf Kalla membalikkan peta suara Sulsel secara mutlak memenangkan pasangan Jokowi-JK sebesar 71.4%.',
    sentimentDirection: 'swung_to_challenger'
  }
]

export function useElectoral() {
  const selectedYear = ref<ElectionYear>(2024)
  const selectedCategory = ref<'presidential' | 'legislative' | 'voter_profile'>('presidential')
  const selectedProvinceId = ref<string>('prov_32') // Default Jawa Barat
  const provinces = ref<ProvinceElectoralData[]>(PROVINCES_DATA)
  const newsRecords = ref<ElectionNewsRecord[]>(SEED_ELECTION_NEWS)

  const selectedProvince = computed(() => {
    return provinces.value.find(p => p.id === selectedProvinceId.value) || provinces.value[0]
  })

  /** Provinsi yang memiliki data untuk tahun terpilih (2014: 33, 2019: 34, 2024: 38) */
  const provincesInYear = computed(() => provinces.value.filter(p => p.presidential[selectedYear.value] || p.legislative[selectedYear.value]))

  const selectedSplitTicket = computed(() => detectSplitTicket(selectedProvince.value, selectedYear.value))

  // FR-2.2.2: matriks pemenang Pilpres vs Pileg per provinsi untuk tahun terpilih
  const splitTicketMatrix = computed(() => {
    return provincesInYear.value
      .map(p => ({ provinceId: p.id, provinceName: p.name, result: detectSplitTicket(p, selectedYear.value) }))
      .filter((r): r is { provinceId: string; provinceName: string; result: NonNullable<typeof r.result> } => r.result !== null)
  })

  const filteredNews = computed(() => {
    return newsRecords.value.filter(n => n.year === selectedYear.value)
  })

  const nationalSummary = computed(() => {
    const year = selectedYear.value
    let totalDPT = 0
    let weightedTurnout = 0
    let turnoutDpt = 0
    for (const p of provincesInYear.value) {
      const dpt = p.dpt[year] ?? 0
      totalDPT += dpt
      const turnout = p.turnoutPercentage[year]
      if (turnout !== undefined && dpt) {
        weightedTurnout += turnout * dpt
        turnoutDpt += dpt
      }
    }
    return {
      totalProvinces: provincesInYear.value.length,
      totalDPT,
      avgTurnout: turnoutDpt ? Math.round((weightedTurnout / turnoutDpt) * 10) / 10 : 0
    }
  })

  const classificationCounts = computed(() => {
    const counts: Record<VoterClassification, number> = {
      stronghold: 0,
      leaning_loyal: 0,
      battleground: 0,
      volatile: 0,
      insufficient: 0
    }
    provinces.value.forEach(p => {
      counts[p.voterProfile.classification]++
    })
    return counts
  })

  return {
    selectedYear,
    selectedCategory,
    selectedProvinceId,
    selectedProvince,
    provinces,
    provincesInYear,
    newsRecords,
    filteredNews,
    nationalSummary,
    classificationCounts,
    selectedSplitTicket,
    splitTicketMatrix,
    PARTY_COLORS
  }
}
