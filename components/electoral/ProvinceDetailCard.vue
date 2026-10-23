<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Users, Vote, Activity, Compass, AlertCircle, Trophy, Info, ChevronDown, ChevronUp, Landmark } from 'lucide-vue-next'
import type { ProvinceElectoralData, ElectionYear, VoterClassification, DemographyIndicator, UrbanTypology } from '~/types/electoral'
import { PARTY_COLORS } from '~/lib/electoral-data'
import { detectSplitTicket, STRONGHOLD_MAX_SHARE_RANGE, VOLATILE_MIN_PEDERSEN } from '~/lib/electoral-metrics'
import { FACTOR_LABEL, type FactorCorrelation } from '~/lib/demography'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  province: ProvinceElectoralData
  year: ElectionYear
  /** Korelasi lintas provinsi untuk tahun terpilih (lib/demography) */
  correlations?: FactorCorrelation[]
}

const props = withDefaults(defineProps<Props>(), { correlations: () => [] })
const PARTY_PREVIEW = 8
const showAllParties = ref(false)

watch(() => [props.province.id, props.year], () => {
  showAllParties.value = false
})

const presResult = computed(() => props.province.presidential[props.year])
const legResult = computed(() => props.province.legislative[props.year])
const visibleParties = computed(() => {
  const parties = legResult.value?.parties ?? []
  return showAllParties.value ? parties : parties.slice(0, PARTY_PREVIEW)
})
const maxPartyShare = computed(() => {
  const leg = legResult.value
  if (!leg) return 1
  return leg.winnerBasis === 'votes'
    ? Math.max(1, ...leg.parties.map(p => p.votePercentage))
    : Math.max(1, ...leg.parties.map(p => p.seatsWon ?? 0))
})
const totalSeats = computed(() => legResult.value?.parties.reduce((s, p) => s + (p.seatsWon ?? 0), 0) ?? 0)

const metrics = computed(() => props.province.voterProfile.metrics)
const splitTicket = computed(() => detectSplitTicket(props.province, props.year))
const dpt = computed(() => props.province.dpt[props.year])
const turnout = computed(() => props.province.turnoutPercentage[props.year])

const CLASSIFICATION_META: Record<VoterClassification, { label: string; variant: 'claret' | 'brass' | 'default' | 'negative' | 'outline'; description: string }> = {
  stronghold: {
    label: 'Kandang loyalis kuat',
    variant: 'claret',
    description: `Partai yang sama menang 3 periode dengan variasi suara < ${STRONGHOLD_MAX_SHARE_RANGE} poin persen.`
  },
  leaning_loyal: {
    label: 'Condong loyalis',
    variant: 'default',
    description: 'Partai dominan menang mayoritas periode, namun porsi suaranya masih bergeser.'
  },
  battleground: {
    label: 'Medan pertempuran (swing)',
    variant: 'brass',
    description: 'Pemenang berganti antar-periode; pemilih terbuka terhadap perpindahan pilihan.'
  },
  volatile: {
    label: 'Anomali, sangat mengambang',
    variant: 'negative',
    description: `Rata-rata Indeks Pedersen ≥ ${VOLATILE_MIN_PEDERSEN}: perpindahan suara antar-partai sangat besar.`
  },
  insufficient: {
    label: 'Data belum cukup',
    variant: 'outline',
    description: 'Klasifikasi butuh data Pileg minimal dua pemilu.'
  }
}

const classificationMeta = computed(() => CLASSIFICATION_META[props.province.voterProfile.classification])
const partyLabel = (code: string) => PARTY_COLORS[code as keyof typeof PARTY_COLORS]?.name ?? code

// Eksekutif daerah (Pilgub terdekat) vs legislatif
const governor = computed(() => props.province.gubernatorial[props.year])
const governorAligned = computed(() => splitTicket.value?.governor?.alignedWithLegislative)

// FR-2.3.3: profil BPS dengan tahun acuan terdekat
const demography = computed(() => props.province.demography[props.year])
const topSectors = computed(() => demography.value?.employment?.sectors.slice(0, 3) ?? [])
const TYPOLOGY_LABEL: Record<UrbanTypology, string> = { urban: 'Urban', transition: 'Transisi', rural: 'Rural' }
const fmt = (n: number, digits = 1) => n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })

function versusNational(value: number, national: number | undefined, digits = 1): string {
  if (national === undefined) return ''
  const diff = value - national
  if (Math.abs(diff) < 10 ** -digits) return `setara nasional (${fmt(national, digits)})`
  return `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff), digits)} dari nasional (${fmt(national, digits)})`
}
const indicatorNote = (ind: DemographyIndicator, digits = 1) => versusNational(ind.value, ind.national, digits)

/** Faktor dengan korelasi terkuat per capres; hanya |r| ≥ 0,3 dari ≥ 10 provinsi yang ditampilkan */
const correlationHighlights = computed(() => {
  const byCandidate = new Map<string, FactorCorrelation>()
  for (const c of props.correlations) {
    if (c.n < 10 || Math.abs(c.r) < 0.3) continue
    const best = byCandidate.get(c.candidate)
    if (!best || Math.abs(c.r) > Math.abs(best.r)) byCandidate.set(c.candidate, c)
  }
  return [...byCandidate.values()]
})
</script>

<template>
  <article class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-4 sm:p-5 shadow-parchment space-y-5">
    <!-- Kepala provinsi -->
    <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-monastic-700">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-serif font-bold text-xl sm:text-2xl text-claret-900 dark:text-parchment-50">
            {{ province.name }}
          </h3>
          <Badge variant="outline">{{ province.island }}</Badge>
        </div>
        <p class="text-xs text-parchment-600 dark:text-parchment-400 mt-1">
          Ibu kota {{ province.capital }} • DPT {{ year }}:
          <span class="font-semibold tabular-nums text-parchment-800 dark:text-parchment-200">{{ dpt ? `${dpt.toLocaleString('id-ID')} pemilih` : 'N/A' }}</span>
          • Partisipasi:
          <span class="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{{ turnout !== undefined ? `${turnout}%` : 'N/A' }}</span>
        </p>
      </div>
      <div class="sm:text-right shrink-0">
        <Badge :variant="classificationMeta.variant" class="text-xs font-bold py-1 px-3" :title="classificationMeta.description">
          {{ classificationMeta.label }}
        </Badge>
        <span v-if="metrics?.pedersenByPeriod.length" class="block text-[11px] font-mono tabular-nums text-parchment-600 dark:text-parchment-400 mt-1">
          Pedersen rata-rata {{ province.voterProfile.pedersenSwingIndex }}
        </span>
      </div>
    </header>

    <ul v-if="province.dataNotes.length" class="space-y-1">
      <li v-for="note in province.dataNotes" :key="note" class="flex items-start gap-1.5 text-[11px] text-parchment-600 dark:text-parchment-400">
        <Info class="w-3.5 h-3.5 shrink-0 mt-px text-brass-600" aria-hidden="true" />
        <span>{{ note }}</span>
      </li>
    </ul>

    <!-- Pilpres & Pileg -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <section class="space-y-3" aria-labelledby="pres-heading">
        <h4 id="pres-heading" class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <Vote class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
          Pilpres {{ year }}
        </h4>
        <p v-if="!presResult" class="text-xs text-parchment-500">Data Pilpres {{ year }} tidak tersedia untuk wilayah ini.</p>
        <ul v-else class="space-y-3">
          <li v-for="cand in presResult.candidates" :key="cand.name" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="flex items-center gap-1.5 min-w-0" :class="cand.isWinner ? 'font-bold text-parchment-900 dark:text-parchment-50' : 'text-parchment-700 dark:text-parchment-300'">
                <Trophy v-if="cand.isWinner" class="w-3.5 h-3.5 shrink-0 text-brass-600" aria-label="Pemenang" />
                <span class="truncate">{{ cand.name }}</span>
              </span>
              <span class="font-mono tabular-nums font-bold shrink-0" :style="{ color: cand.colorHex }">{{ cand.percentage.toFixed(2) }}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-parchment-200 dark:bg-monastic-700 overflow-hidden">
              <div class="h-full rounded-full" :style="{ width: `${cand.percentage}%`, backgroundColor: cand.colorHex }" />
            </div>
            <p class="text-[11px] text-parchment-500 tabular-nums">
              {{ cand.votes.toLocaleString('id-ID') }} suara • {{ cand.parties.join(', ') }}
            </p>
          </li>
        </ul>
      </section>

      <section class="space-y-3" aria-labelledby="leg-heading">
        <h4 id="leg-heading" class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <Users class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
          Pileg DPR RI {{ year }}
          <span v-if="totalSeats" class="font-normal text-xs text-parchment-500">• {{ totalSeats }} kursi</span>
        </h4>
        <p v-if="!legResult" class="text-xs text-parchment-500">Data Pileg {{ year }} tidak tersedia untuk wilayah ini.</p>
        <template v-else>
          <p v-if="legResult.winnerBasis === 'seats'" class="text-[11px] text-parchment-500">
            Rekap suara per provinsi tidak tersedia; ditampilkan perolehan kursi.
          </p>
          <ul class="space-y-2">
            <li v-for="party in visibleParties" :key="party.partyCode">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="flex items-center gap-1.5 min-w-0 text-parchment-800 dark:text-parchment-200">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: party.colorHex }" aria-hidden="true" />
                  <span class="truncate" :class="party.partyCode === legResult.winnerParty ? 'font-bold' : ''">{{ party.partyName }}</span>
                </span>
                <span class="font-mono tabular-nums shrink-0 text-parchment-900 dark:text-parchment-100">
                  <template v-if="legResult.winnerBasis === 'votes'">{{ party.votePercentage.toFixed(2) }}%</template>
                  <span v-if="party.seatsWon !== undefined" class="text-parchment-500"> • {{ party.seatsWon }} kursi</span>
                </span>
              </div>
              <div class="mt-1 w-full h-1.5 rounded-full bg-parchment-200 dark:bg-monastic-700 overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${((legResult.winnerBasis === 'votes' ? party.votePercentage : (party.seatsWon ?? 0)) / maxPartyShare) * 100}%`,
                    backgroundColor: party.colorHex
                  }"
                />
              </div>
            </li>
          </ul>
          <button
            v-if="legResult.parties.length > PARTY_PREVIEW"
            type="button"
            class="inline-flex items-center gap-1 h-9 text-xs font-semibold text-claret-700 dark:text-brass-400 hover:underline"
            :aria-expanded="showAllParties"
            @click="showAllParties = !showAllParties"
          >
            <component :is="showAllParties ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" aria-hidden="true" />
            {{ showAllParties ? 'Tampilkan lebih sedikit' : `Tampilkan semua ${legResult.parties.length} partai` }}
          </button>
        </template>
      </section>
    </div>

    <!-- Loyalis vs Swing (FR-2.3) & split-ticket (FR-2.2.2) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <section class="p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 space-y-2.5">
        <h4 class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <Activity class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
          Volatilitas pemilih
        </h4>
        <p class="font-mono text-[11px] text-parchment-600 dark:text-parchment-400">
          Pedersen = ½ Σ |P<sub>i,t</sub> − P<sub>i,t−1</sub>| (suara Pileg DPR RI per partai)
        </p>
        <p v-if="!metrics?.pedersenByPeriod.length" class="text-parchment-500">
          Belum ada dua pemilu berurutan dengan rekap suara untuk dibandingkan.
        </p>
        <ul v-else class="space-y-1">
          <li v-for="period in metrics.pedersenByPeriod" :key="period.to" class="flex justify-between">
            <span class="text-parchment-600 dark:text-parchment-400">{{ period.from }} → {{ period.to }}</span>
            <span class="font-mono tabular-nums font-bold text-parchment-900 dark:text-parchment-100">{{ period.value }}</span>
          </li>
          <li class="flex justify-between pt-1 border-t border-parchment-200 dark:border-monastic-700">
            <span class="font-semibold text-parchment-700 dark:text-parchment-300">Rata-rata</span>
            <span class="font-mono tabular-nums font-bold text-claret-800 dark:text-brass-300">{{ metrics.pedersenSwingIndex }}</span>
          </li>
        </ul>
        <div v-if="metrics" class="flex flex-wrap gap-1.5 items-center">
          <span class="text-parchment-500">Pemenang Pileg:</span>
          <span
            v-for="(party, yr) in metrics.winnersByYear"
            :key="yr"
            class="px-1.5 py-0.5 rounded font-mono text-[11px] text-white"
            :style="{ backgroundColor: PARTY_COLORS[party!]?.hex || '#64748B' }"
          >
            {{ yr }}: {{ party }}
          </span>
        </div>
        <p v-if="metrics" class="text-parchment-600 dark:text-parchment-400">
          Indeks loyalitas <span class="font-mono tabular-nums font-bold">{{ metrics.loyaltyScore }}</span>
          <template v-if="metrics.loyaltyParty"> terhadap <strong>{{ partyLabel(metrics.loyaltyParty) }}</strong></template>
          • variasi suara partai dominan {{ metrics.modalWinnerShareRange }} poin.
        </p>
      </section>

      <section class="p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 space-y-2.5">
        <h4 class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <Compass class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
          Pilpres vs Pileg {{ year }}
        </h4>
        <template v-if="splitTicket">
          <p class="text-parchment-700 dark:text-parchment-300">
            Capres pemenang: <strong>{{ splitTicket.presidentialWinner }}</strong>
            <span class="block text-[11px] text-parchment-500">Koalisi: {{ splitTicket.coalition.join(', ') }}</span>
          </p>
          <p class="text-parchment-700 dark:text-parchment-300">
            Pemenang Pileg DPR RI: <strong>{{ partyLabel(splitTicket.legislativeWinner) }}</strong>
          </p>
          <Badge :variant="splitTicket.isSplitTicket ? 'brass' : 'positive'">
            {{ splitTicket.isSplitTicket ? 'Split-ticket voting' : 'Searah (straight-ticket)' }}
          </Badge>
          <p class="text-[11px] text-parchment-500">
            {{ splitTicket.isSplitTicket
              ? 'Partai pemenang legislatif bukan pengusung capres pemenang di wilayah ini.'
              : 'Partai pemenang legislatif termasuk koalisi pengusung capres pemenang.' }}
          </p>
        </template>
        <p v-else class="text-parchment-500">Data Pilpres/Pileg {{ year }} belum lengkap untuk wilayah ini.</p>

        <div class="pt-2.5 border-t border-parchment-200 dark:border-monastic-700 space-y-1.5">
          <p class="flex items-center gap-1.5 font-semibold text-parchment-900 dark:text-parchment-100">
            <Landmark class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" aria-hidden="true" />
            Eksekutif daerah
          </p>
          <template v-if="governor">
            <p class="text-parchment-700 dark:text-parchment-300">
              Gubernur terpilih Pilgub {{ governor.electionYear }}: <strong>{{ governor.winner }}</strong>
              <span v-if="governor.votePercentage !== undefined" class="tabular-nums"> ({{ fmt(governor.votePercentage, 2) }}%)</span>
              <span class="block text-[11px] text-parchment-500">
                {{ governor.independent ? 'Calon perseorangan (tanpa partai pengusung)' : governor.parties ? `Pengusung: ${governor.parties.join(', ')}` : 'Partai pengusung tidak terverifikasi di sumber' }}
              </span>
            </p>
            <Badge v-if="governorAligned !== undefined" :variant="governorAligned ? 'positive' : 'brass'">
              {{ governorAligned ? 'Searah dengan pemenang Pileg' : 'Beda dengan pemenang Pileg' }}
            </Badge>
            <p v-if="governor.note" class="text-[11px] text-parchment-500">{{ governor.note }}</p>
          </template>
          <p v-else class="text-parchment-500">Data Pilgub untuk periode {{ year }} tidak tersedia di wilayah ini.</p>
          <p class="flex items-start gap-1.5 text-[11px] text-parchment-500">
            <AlertCircle class="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />
            Pilgub terdekat dengan tanggal pemilu; pembanding legislatif masih DPR RI karena data kursi DPRD belum diimpor.
          </p>
        </div>
      </section>
    </div>

    <!-- Karakteristik masyarakat (FR-2.3.3) -->
    <section class="p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 bg-parchment-100/50 dark:bg-monastic-900/40 space-y-3">
      <h4 class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
        <Users class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
        Karakteristik masyarakat & faktor penentu
      </h4>
      <template v-if="demography">
        <dl class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div class="p-2.5 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700">
            <dt class="text-[11px] text-parchment-500 mb-0.5">Urban vs rural</dt>
            <dd v-if="demography.urbanPercentage" class="space-y-0.5">
              <span class="font-semibold text-parchment-900 dark:text-parchment-100 tabular-nums">{{ fmt(demography.urbanPercentage.value) }}% perkotaan</span>
              <Badge v-if="demography.urbanTypology" variant="outline" class="ml-1">{{ TYPOLOGY_LABEL[demography.urbanTypology] }}</Badge>
              <span class="block text-[11px] text-parchment-500">Proyeksi {{ demography.urbanPercentage.refYear }} • {{ indicatorNote(demography.urbanPercentage) }}</span>
            </dd>
            <dd v-else class="text-parchment-500">Tidak tersedia untuk batas wilayah ini</dd>
          </div>
          <div class="p-2.5 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700">
            <dt class="text-[11px] text-parchment-500 mb-0.5">Struktur generasi</dt>
            <dd v-if="demography.generations" class="space-y-0.5">
              <span class="font-semibold text-parchment-900 dark:text-parchment-100 tabular-nums">Gen Z + Milenial {{ fmt(demography.generations.genZAndMillennial) }}%</span>
              <span class="block text-[11px] text-parchment-500 tabular-nums">
                Gen Z {{ fmt(demography.generations.shares.genZ) }}% • Milenial {{ fmt(demography.generations.shares.millennial) }}% • Gen X {{ fmt(demography.generations.shares.genX) }}% • Boomer+ {{ fmt(demography.generations.shares.boomer + demography.generations.shares.preBoomer) }}%
              </span>
              <span class="block text-[11px] text-parchment-500">
                {{ demography.generations.refYear === 2020 ? 'SP2020' : `SUPAS ${demography.generations.refYear}` }}
                • {{ versusNational(demography.generations.genZAndMillennial, demography.generations.nationalGenZAndMillennial) }}
              </span>
            </dd>
            <dd v-else class="text-parchment-500">Tidak ada data dalam ±4 tahun dari pemilu</dd>
          </div>
          <div class="p-2.5 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700">
            <dt class="text-[11px] text-parchment-500 mb-0.5">Lapangan kerja dominan</dt>
            <dd v-if="demography.employment" class="space-y-0.5">
              <span v-for="(s, i) in topSectors" :key="s.sector" class="block tabular-nums" :class="i === 0 ? 'font-semibold text-parchment-900 dark:text-parchment-100' : 'text-parchment-700 dark:text-parchment-300'">
                {{ s.sector }} {{ fmt(s.percentage) }}%
              </span>
              <span class="block text-[11px] text-parchment-500">Sakernas Agustus {{ demography.employment.refYear }}</span>
            </dd>
            <dd v-else class="text-parchment-500">Tabel BPS per provinsi baru tersedia sejak 2021</dd>
          </div>
          <div class="p-2.5 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700">
            <dt class="text-[11px] text-parchment-500 mb-0.5">Pembangunan manusia & pendidikan</dt>
            <dd v-if="demography.hdi || demography.educationIndex" class="space-y-0.5">
              <span v-if="demography.hdi" class="block font-semibold text-parchment-900 dark:text-parchment-100 tabular-nums">
                IPM {{ fmt(demography.hdi.value, 2) }}
                <span class="font-normal text-[11px] text-parchment-500">({{ demography.hdi.refYear }}, {{ indicatorNote(demography.hdi, 2) }})</span>
              </span>
              <span v-if="demography.educationIndex" class="block text-parchment-700 dark:text-parchment-300 tabular-nums">
                Indeks pendidikan {{ fmt(demography.educationIndex.value, 2) }}
                <span class="text-[11px] text-parchment-500">• nasional {{ demography.educationIndex.national !== undefined ? fmt(demography.educationIndex.national, 2) : '-' }}</span>
              </span>
              <span v-if="demography.meanYearsSchooling && demography.expectedYearsSchooling" class="block text-[11px] text-parchment-500 tabular-nums">
                Rata-rata lama sekolah {{ fmt(demography.meanYearsSchooling.value, 2) }} th • harapan {{ fmt(demography.expectedYearsSchooling.value, 2) }} th
              </span>
            </dd>
            <dd v-else class="text-parchment-500">Tidak tersedia</dd>
          </div>
        </dl>

        <div v-if="correlationHighlights.length" class="space-y-1 text-xs">
          <p class="font-semibold text-parchment-800 dark:text-parchment-200">Pola lintas provinsi {{ year }}</p>
          <ul class="space-y-0.5 text-parchment-700 dark:text-parchment-300">
            <li v-for="c in correlationHighlights" :key="c.candidate">
              Suara <strong>{{ c.candidate }}</strong> {{ c.r > 0 ? 'lebih tinggi' : 'lebih rendah' }} di provinsi dengan {{ FACTOR_LABEL[c.factor] }} lebih tinggi
              <span class="font-mono tabular-nums text-[11px] text-parchment-500">(r = {{ fmt(c.r, 2) }}, {{ c.n }} provinsi)</span>
            </li>
          </ul>
          <p class="text-[11px] text-parchment-500">Korelasi antarwilayah, bukan sebab-akibat atau perilaku individu pemilih.</p>
        </div>

        <p class="text-[11px] text-parchment-500">
          Sumber: BPS (proyeksi penduduk, SP2020/SUPAS 2025, Sakernas, IPM metode baru); tahun acuan terdekat dengan Pemilu {{ year }}. Rincian di data/electoral/SOURCES-demography.md.
        </p>
      </template>
      <p v-else class="text-xs text-parchment-500">
        Profil BPS untuk {{ province.name }} pada periode {{ year }} belum tersedia (provinsi belum terbentuk atau tidak ada tabel dalam ±4 tahun).
      </p>
    </section>
  </article>
</template>
