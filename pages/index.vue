<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus, Calendar, Layers, CheckCircle2, AlertCircle, Archive } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { useIssueTracker } from '~/composables/useIssueTracker'
import { useElectoral } from '~/composables/useElectoral'
import { useScraperStream, type SyncTopic } from '~/composables/useScraperStream'
import { useReportExport, type DeliveryMode } from '~/composables/useReportExport'
import { apiFetch } from '~/composables/useApi'
import type { ElectionYear } from '~/types/electoral'
import type { PlatformType } from '~/types/issue'

import AppHeader from '~/components/AppHeader.vue'
import Badge from '~/components/ui/Badge.vue'
import SegmentedControl from '~/components/ui/SegmentedControl.vue'
import ReportActions from '~/components/report/ReportActions.vue'

import ScraperStatusBar from '~/components/media/ScraperStatusBar.vue'
import MediaFilterBar from '~/components/media/MediaFilterBar.vue'
import OriginCard from '~/components/media/OriginCard.vue'
import AmplifierGraph from '~/components/media/AmplifierGraph.vue'
import RegionalHeatmap from '~/components/media/RegionalHeatmap.vue'
import NewTopicModal from '~/components/media/NewTopicModal.vue'
import SentimentNarrativePanel from '~/components/media/SentimentNarrativePanel.vue'
import IssueTimelineChart from '~/components/media/IssueTimelineChart.vue'

import ElectoralMap from '~/components/electoral/ElectoralMap.vue'
import ProvinceDetailCard from '~/components/electoral/ProvinceDetailCard.vue'
import NewsTimeline from '~/components/electoral/NewsTimeline.vue'
import SplitTicketMatrix from '~/components/electoral/SplitTicketMatrix.vue'

const { initAuth, canManageTopics, currentUser } = useAuth()
const activeTab = ref<'media_tracker' | 'electoral_intel'>('media_tracker')
const showNewTopicModal = ref(false)

// Fitur 1: Media Tracker
const {
  topicCards,
  activeTopicId,
  activeTopic,
  activeAnalysis,
  dataSource,
  activeOrigin,
  activeNodes,
  activeEdges,
  regionalStats,
  duplicateClusterSummary,
  filterMediaSources,
  toggleMediaSource,
  createCustomTopic,
  archiveTopic,
  isCustomTopic
} = useIssueTracker()

function confirmArchive() {
  const topic = activeTopic.value
  if (window.confirm(`Arsipkan topik "${topic.title}"? Topik tidak lagi dipantau, riwayat publikasinya tetap tersimpan.`)) {
    archiveTopic(topic.id)
  }
}

const {
  isCrawling,
  lastSyncTime,
  totalIngested,
  currentStatusText,
  activeSourceLabel,
  recentArticles,
  syncLogs,
  triggerScraperSync,
  startBackgroundWorker,
  stopBackgroundWorker
} = useScraperStream()

// Fitur 2: Electoral Intel
const {
  selectedYear,
  selectedCategory,
  selectedProvinceId,
  selectedProvince,
  provinces,
  filteredNews,
  nationalSummary,
  classificationCounts,
  splitTicketMatrix,
  demographicCorrelations
} = useElectoral()

const { isExporting, exportMessage, canShareFiles, exportMediaReport, exportElectoralReport } = useReportExport()

const yearOptions: { value: ElectionYear; label: string }[] = [
  { value: 2014, label: '2014' },
  { value: 2019, label: '2019' },
  { value: 2024, label: '2024' }
]
const categoryOptions: { value: 'presidential' | 'legislative' | 'voter_profile'; label: string }[] = [
  { value: 'presidential', label: 'Pilpres' },
  { value: 'legislative', label: 'Pileg DPR' },
  { value: 'voter_profile', label: 'Loyalis vs Swing' }
]

const dataSourceBadge = computed(() => {
  switch (dataSource.value) {
    case 'live': return { variant: 'positive' as const, label: 'Data live', hint: 'Metrik dihitung dari publikasi riil hasil perayapan terakhir' }
    case 'seed': return { variant: 'outline' as const, label: 'Data contoh', hint: 'Data contoh bawaan; diganti hasil analisa setelah perayapan berhasil' }
    default: return { variant: 'outline' as const, label: 'Menunggu data', hint: 'Belum ada publikasi yang terekam untuk topik ini' }
  }
})

const generatedBy = computed(() => currentUser.value ? `${currentUser.value.name} (${currentUser.value.role})` : 'Pengguna')

function exportMedia(mode: DeliveryMode) {
  exportMediaReport({
    generatedBy: generatedBy.value,
    topic: activeTopic.value,
    analysis: activeAnalysis.value,
    dataSource: dataSource.value,
    origin: activeOrigin.value,
    nodes: activeNodes.value,
    regional: regionalStats.value
  }, mode)
}

function exportElectoral(mode: DeliveryMode) {
  exportElectoralReport({
    generatedBy: generatedBy.value,
    year: selectedYear.value,
    province: selectedProvince.value,
    provinces: provinces.value,
    splitRows: splitTicketMatrix.value,
    correlations: demographicCorrelations.value,
    nationalSummary: nationalSummary.value
  }, mode)
}

const configuredPlatforms = ref<PlatformType[] | null>(null)

onMounted(async () => {
  initAuth()
  startBackgroundWorker(activeSyncTopic)
  const status = await apiFetch<{ configuredPlatforms: PlatformType[] }>('/api/scraper/status').catch(() => null)
  configuredPlatforms.value = status?.configuredPlatforms ?? null
})

onUnmounted(() => {
  stopBackgroundWorker()
})

function activeSyncTopic(): SyncTopic | null {
  const t = activeTopic.value
  if (!t) return null
  return { id: t.id, title: t.title, keywords: t.keywords, query: t.query, entityFilter: t.entityFilter }
}

function syncActiveTopic() {
  const topic = activeSyncTopic()
  if (topic) triggerScraperSync(topic)
}

watch(activeTopicId, syncActiveTopic)
</script>

<template>
  <div class="min-h-screen bg-parchment-100 dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 flex flex-col font-sans transition-colors">
    <AppHeader
      :active-tab="activeTab"
      @update:active-tab="activeTab = $event"
    />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8 space-y-5 sm:space-y-6">
      <!-- Notifikasi hasil ekspor laporan -->
      <div
        v-if="exportMessage"
        role="status"
        :class="[
          'flex items-start gap-2 p-3 rounded-lg border text-sm',
          exportMessage.kind === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
        ]"
      >
        <CheckCircle2 v-if="exportMessage.kind === 'success'" class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <AlertCircle v-else class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{{ exportMessage.text }}</span>
      </div>

      <!-- ===================================================================== -->
      <!-- MODUL 1: MEDIA & ISSUE TRACKER -->
      <!-- ===================================================================== -->
      <section v-if="activeTab === 'media_tracker'" aria-labelledby="media-heading" class="space-y-5 sm:space-y-6">
        <h2 id="media-heading" class="sr-only">Pemantau Isu Media Publik</h2>

        <ScraperStatusBar
          :is-crawling="isCrawling"
          :last-sync-time="lastSyncTime"
          :total-ingested="totalIngested"
          :status-text="currentStatusText"
          :source-label="activeSourceLabel"
          :recent-articles="recentArticles"
          :logs="syncLogs"
          @sync="syncActiveTopic"
        />

        <!-- Papan isu: pilih topik atau buat pemantauan baru -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-serif font-bold text-lg text-parchment-900 dark:text-parchment-50">Isu Pantauan</h3>
              <p class="text-xs text-parchment-600 dark:text-parchment-400">
                Pilih isu untuk dianalisis, atau buat kueri pemantauan sendiri
              </p>
            </div>
            <button
              v-if="canManageTopics"
              type="button"
              class="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md bg-claret-700 hover:bg-claret-800 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-claret-700"
              @click="showNewTopicModal = true"
            >
              <Plus class="w-4 h-4" aria-hidden="true" />
              <span>Pantau isu baru</span>
            </button>
            <span v-else class="text-xs text-parchment-500 italic">Peran Viewer: hanya dapat melihat</span>
          </div>

          <div class="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 scroll-px-4" role="list">
            <button
              v-for="t in topicCards"
              :key="t.id"
              type="button"
              role="listitem"
              :aria-pressed="activeTopicId === t.id"
              :class="[
                'snap-start shrink-0 w-[78%] sm:w-72 text-left p-3 rounded-lg border transition-colors cursor-pointer select-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400',
                activeTopicId === t.id
                  ? 'bg-white dark:bg-monastic-800 border-claret-700 dark:border-brass-400 shadow-md'
                  : 'bg-parchment-50 dark:bg-monastic-900/60 border-parchment-300 dark:border-monastic-700 hover:border-parchment-500'
              ]"
              @click="activeTopicId = t.id"
            >
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <Badge :variant="t.isTrending ? 'brass' : 'outline'">{{ t.category }}</Badge>
                <span class="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                  {{ t.trendVelocity }}
                </span>
              </div>
              <span class="block font-semibold text-sm leading-snug text-parchment-900 dark:text-parchment-100 line-clamp-2 min-h-[2.5rem]">
                {{ t.title }}
              </span>
              <span class="text-[11px] font-mono tabular-nums text-parchment-600 dark:text-parchment-400 mt-1 block">
                {{ t.totalMentions.toLocaleString('id-ID') }} publikasi
              </span>
            </button>
          </div>
        </div>

        <!-- Ringkasan isu aktif -->
        <article class="p-4 sm:p-5 rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-parchment space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="claret">{{ activeTopic.category }}</Badge>
                <Badge :variant="dataSourceBadge.variant" :title="dataSourceBadge.hint">{{ dataSourceBadge.label }}</Badge>
                <button
                  v-if="canManageTopics && isCustomTopic(activeTopic.id)"
                  type="button"
                  class="ml-auto inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs text-parchment-600 hover:text-red-700 hover:bg-parchment-100 dark:text-parchment-400 dark:hover:bg-monastic-700 dark:hover:text-red-400"
                  @click="confirmArchive"
                >
                  <Archive class="w-3.5 h-3.5" aria-hidden="true" />
                  Arsipkan
                </button>
              </div>
              <p v-if="activeTopic.query" class="text-xs font-mono text-parchment-600 dark:text-parchment-400 break-words">
                Kueri: {{ activeTopic.query }}
              </p>
              <h3 class="font-serif font-bold text-xl sm:text-2xl leading-tight text-claret-900 dark:text-parchment-50 text-balance">
                {{ activeTopic.title }}
              </h3>
              <p class="text-sm text-parchment-700 dark:text-parchment-300 leading-relaxed max-w-prose">
                {{ activeTopic.summary }}
              </p>
            </div>

            <div class="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
              <div class="lg:text-right">
                <span class="text-[11px] font-semibold text-parchment-500 uppercase tracking-wider block">Total publikasi</span>
                <span class="font-serif font-bold text-3xl tabular-nums text-claret-800 dark:text-brass-300">
                  {{ activeTopic.totalMentions.toLocaleString('id-ID') }}
                </span>
              </div>
              <ReportActions
                :busy="isExporting"
                :can-share="canShareFiles"
                @download="exportMedia('download')"
                @share="exportMedia('share')"
              />
            </div>
          </div>

          <!-- Argumen pro/kontra data contoh; versi live tampil di panel narasi -->
          <div v-if="!activeAnalysis" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
              <span class="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] block">Narasi pendukung</span>
              <p class="text-emerald-900 dark:text-emerald-200 leading-relaxed">{{ activeTopic.proArguments }}</p>
            </div>
            <div class="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-1">
              <span class="font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[11px] block">Narasi pengkritik</span>
              <p class="text-rose-900 dark:text-rose-200 leading-relaxed">{{ activeTopic.contraArguments }}</p>
            </div>
          </div>
        </article>

        <MediaFilterBar
          :active-sources="filterMediaSources"
          :configured-sources="configuredPlatforms"
          @toggle="toggleMediaSource"
        />

        <OriginCard :origin="activeOrigin" />

        <IssueTimelineChart :timeline="activeAnalysis?.timeline ?? []" />

        <AmplifierGraph
          :nodes="activeNodes"
          :edges="activeEdges"
          :summary="duplicateClusterSummary"
        />

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
          <RegionalHeatmap :stats="regionalStats" />
          <SentimentNarrativePanel :analysis="activeAnalysis" />
        </div>
      </section>

      <!-- ===================================================================== -->
      <!-- MODUL 2: ELECTORAL & VOTER INTELLIGENCE -->
      <!-- ===================================================================== -->
      <section v-else aria-labelledby="electoral-heading" class="space-y-5 sm:space-y-6">
        <h2 id="electoral-heading" class="sr-only">Analitik Pemilu 3 Periode</h2>

        <div class="p-4 rounded-xl bg-white dark:bg-monastic-800 border border-parchment-300 dark:border-monastic-700 shadow-parchment flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-parchment-600 dark:text-parchment-400 flex items-center gap-1.5">
                <Calendar class="w-4 h-4 text-claret-700 dark:text-brass-400" aria-hidden="true" />
                Periode
              </span>
              <SegmentedControl v-model="selectedYear" :options="yearOptions" label="Periode pemilu" />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-parchment-600 dark:text-parchment-400 flex items-center gap-1.5">
                <Layers class="w-4 h-4 text-brass-600 dark:text-brass-400" aria-hidden="true" />
                Sudut analisis
              </span>
              <SegmentedControl v-model="selectedCategory" :options="categoryOptions" label="Sudut analisis" />
            </div>
          </div>
          <ReportActions
            :busy="isExporting"
            :can-share="canShareFiles"
            @download="exportElectoral('download')"
            @share="exportElectoral('share')"
          />
        </div>

        <!-- Ringkasan nasional -->
        <dl class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="p-3.5 sm:p-4 rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-parchment">
            <dt class="text-[11px] font-semibold text-parchment-500 uppercase tracking-wider">DPT {{ selectedYear }}</dt>
            <dd class="font-serif font-bold text-xl sm:text-2xl tabular-nums text-parchment-900 dark:text-parchment-50">
              {{ nationalSummary.totalDPT ? nationalSummary.totalDPT.toLocaleString('id-ID') : 'N/A' }}
            </dd>
            <dd class="text-[11px] text-parchment-500">{{ nationalSummary.totalProvinces }} provinsi tercatat</dd>
          </div>
          <div class="p-3.5 sm:p-4 rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-parchment">
            <dt class="text-[11px] font-semibold text-parchment-500 uppercase tracking-wider">Partisipasi</dt>
            <dd class="font-serif font-bold text-xl sm:text-2xl tabular-nums text-emerald-700 dark:text-emerald-400">
              {{ nationalSummary.avgTurnout ? `${nationalSummary.avgTurnout}%` : 'N/A' }}
            </dd>
            <dd class="text-[11px] text-parchment-500">
              {{ nationalSummary.avgTurnout ? `Golput ${(100 - nationalSummary.avgTurnout).toFixed(1)}%` : 'Data partisipasi belum tersedia' }}
            </dd>
          </div>
          <div class="p-3.5 sm:p-4 rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-parchment">
            <dt class="text-[11px] font-semibold text-parchment-500 uppercase tracking-wider">Kandang loyalis</dt>
            <dd class="font-serif font-bold text-xl sm:text-2xl tabular-nums text-claret-800 dark:text-brass-300">
              {{ classificationCounts.stronghold + classificationCounts.leaning_loyal }} provinsi
            </dd>
            <dd class="text-[11px] text-parchment-500">{{ classificationCounts.stronghold }} kuat • {{ classificationCounts.leaning_loyal }} condong</dd>
          </div>
          <div class="p-3.5 sm:p-4 rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-parchment">
            <dt class="text-[11px] font-semibold text-parchment-500 uppercase tracking-wider">Medan swing</dt>
            <dd class="font-serif font-bold text-xl sm:text-2xl tabular-nums text-amber-700 dark:text-amber-400">
              {{ classificationCounts.battleground + classificationCounts.volatile }} provinsi
            </dd>
            <dd class="text-[11px] text-parchment-500">{{ classificationCounts.volatile }} anomali (Pedersen ≥ 20)</dd>
          </div>
        </dl>

        <ClientOnly>
          <ElectoralMap
            :provinces="provinces"
            :selected-province-id="selectedProvinceId"
            :selected-year="selectedYear"
            :category="selectedCategory"
            @select-province="selectedProvinceId = $event"
          />
          <template #fallback>
            <div class="w-full h-[380px] rounded-xl border border-parchment-300 dark:border-monastic-700 bg-parchment-50 dark:bg-monastic-800 animate-pulse" aria-label="Memuat peta" />
          </template>
        </ClientOnly>

        <ProvinceDetailCard
          :province="selectedProvince"
          :year="selectedYear"
          :correlations="demographicCorrelations"
        />

        <SplitTicketMatrix
          :rows="splitTicketMatrix"
          :year="selectedYear"
          :selected-province-id="selectedProvinceId"
          @select-province="selectedProvinceId = $event"
        />

        <NewsTimeline
          :news="filteredNews"
          :year="selectedYear"
        />
      </section>
    </main>

    <NewTopicModal
      v-if="showNewTopicModal"
      @close="showNewTopicModal = false"
      @created="createCustomTopic"
    />

    <footer class="hidden md:block mt-auto border-t border-parchment-300 dark:border-monastic-700/80 bg-white dark:bg-monastic-900 py-5 text-xs text-parchment-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
        <span><span class="font-serif font-bold text-claret-800 dark:text-brass-400">IsuMedia Tracker</span> • Intelijen media publik & analitik pemilu</span>
        <span>Hanya memantau sumber publik • Kepatuhan UU PDP No. 27/2022</span>
      </div>
    </footer>
  </div>
</template>
