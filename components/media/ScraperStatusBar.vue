<script setup lang="ts">
import { ref } from 'vue'
import { 
  Radio, 
  RefreshCw, 
  Database, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Globe2, 
  Clock, 
  ShieldCheck,
  TrendingUp
} from 'lucide-vue-next'
import Badge from '~/components/ui/Badge.vue'
import Button from '~/components/ui/Button.vue'
import type { StreamedArticle } from '~/composables/useScraperStream'
import { toCsv } from '~/lib/csv'

interface Props {
  isCrawling: boolean
  lastSyncTime: string
  totalIngested: number
  statusText: string
  sourceLabel: string
  recentArticles: StreamedArticle[]
  logs: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'sync'): void
}>()

const showFeedDrawer = ref(false)

function downloadCsv() {
  const csv = toCsv(
    ['waktu_terbit', 'sumber', 'judul', 'sentimen', 'skor_sentimen', 'url'],
    props.recentArticles.map(a => [a.publishedAt, a.source, a.title, a.sentiment, a.sentimentScore, a.url])
  )
  // BOM agar Excel membaca UTF-8 dengan benar
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `publikasi-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-sm overflow-hidden transition-all">
    <!-- Main Status Bar Banner -->
    <div class="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-parchment-50/80 via-white to-parchment-50/80 dark:from-monastic-900/80 dark:via-monastic-800 dark:to-monastic-900/80">
      
      <!-- Left: Engine Pulse & Current Activity Status -->
      <div class="flex items-center gap-3">
        <div 
          class="relative flex items-center justify-center w-8 h-8 rounded-lg border transition-colors"
          :class="isCrawling ? 'bg-amber-500/10 border-amber-500/40 text-amber-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'"
          :title="isCrawling ? 'Engine perayap sedang aktif mengunduh artikel baru' : 'Layanan latar belakang aktif dan tersambung ke database'"
        >
          <Radio class="w-4 h-4" :class="isCrawling ? 'animate-spin' : ''" aria-hidden="true" />
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-parchment-900 dark:text-parchment-100 flex flex-wrap items-center gap-x-1.5">
              <span>Perayap RSS publik</span>
              <span
                class="text-xs font-semibold"
                :class="isCrawling ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'"
                role="status"
              >
                {{ isCrawling ? 'Merayapi…' : 'Aktif' }}
              </span>
            </span>
            <Badge 
              variant="outline" 
              class="hidden sm:inline-flex text-[10px] py-0 px-1.5"
              title="Data dikumpulkan langsung dari feed berita terverifikasi publik dan disaring tanpa memuat akun privat warganet"
            >
              Data Riil Publik
            </Badge>
          </div>
          <p 
            class="text-[11px] text-parchment-600 dark:text-parchment-400 mt-0.5 line-clamp-1 max-w-xl"
            :title="statusText"
          >
            {{ statusText }}
          </p>
        </div>
      </div>

      <!-- Right: Database Count, Sources & Actions -->
      <div class="flex items-center flex-wrap gap-2 text-xs w-full sm:w-auto">
        <!-- DB Ingested Counter -->
        <div 
          class="flex items-center gap-1.5 px-2.5 h-10 sm:h-9 rounded-md bg-parchment-100 dark:bg-monastic-900/90 border border-parchment-300 dark:border-monastic-700"
          title="Jumlah publikasi baru yang tersimpan ke tabel media_posts PocketBase selama sesi ini"
        >
          <Database class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" />
          <span class="text-parchment-500 dark:text-parchment-400 text-[11px]">Tersimpan sesi ini:</span>
          <span class="font-mono tabular-nums font-bold text-parchment-900 dark:text-parchment-100">
            {{ totalIngested.toLocaleString('id-ID') }} entri
          </span>
        </div>

        <!-- Sync Time -->
        <div 
          class="hidden md:flex items-center gap-1.5 px-2.5 h-9 rounded-md bg-parchment-100 dark:bg-monastic-900/90 border border-parchment-300 dark:border-monastic-700 text-parchment-600 dark:text-parchment-300"
          title="Waktu sinkronisasi data publik terakhir dari feed nasional"
        >
          <Clock class="w-3.5 h-3.5 text-parchment-400" />
          <span class="text-[11px] font-mono">{{ lastSyncTime }}</span>
        </div>

        <!-- Toggle Live Articles Drawer -->
        <button
          type="button"
          :aria-expanded="showFeedDrawer"
          @click="showFeedDrawer = !showFeedDrawer"
          class="flex items-center gap-1.5 px-3 h-10 sm:h-9 rounded-md border border-parchment-300 dark:border-monastic-700 text-[11px] text-parchment-700 dark:text-parchment-300 hover:bg-parchment-100 dark:hover:bg-monastic-700 transition-colors cursor-pointer"
          :title="showFeedDrawer ? 'Tutup daftar artikel hasil scraping terkini' : 'Buka daftar artikel hasil scraping media riil terkini'"
        >
          <Globe2 class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" />
          <span>Feed Riil ({{ recentArticles.length }})</span>
          <ChevronUp v-if="showFeedDrawer" class="w-3 h-3" />
          <ChevronDown v-else class="w-3 h-3" />
        </button>

        <!-- Force Sync Button -->
        <Button
          variant="outline"
          size="sm"
          :disabled="isCrawling"
          @click="emit('sync')"
          class="gap-1.5 text-xs h-10 sm:h-9 px-3"
          title="Memicu perayapan media publik sekarang"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="isCrawling ? 'animate-spin' : ''" aria-hidden="true" />
          <span>Sinkronkan</span>
        </Button>
      </div>
    </div>

    <!-- Collapsible Feed Drawer (Recent Scraped Articles) -->
    <div 
      v-if="showFeedDrawer"
      class="border-t border-parchment-200 dark:border-monastic-700 p-4 bg-parchment-50/60 dark:bg-monastic-900/60 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-parchment-200 dark:border-monastic-700/80">
        <div>
          <h4 class="font-bold text-xs text-parchment-900 dark:text-parchment-100 flex items-center gap-1.5">
            <Globe2 class="w-4 h-4 text-claret-700 dark:text-brass-400" />
            <span>Publikasi hasil perayapan terakhir</span>
          </h4>
          <p class="text-[11px] text-parchment-500 dark:text-parchment-400">
            Sumber resmi: LKBN Antara, Google News Indonesia, dan jaringan portal pers terakreditasi
          </p>
        </div>
        <span class="text-[11px] font-mono text-parchment-500">
          {{ recentArticles.length }} artikel
        </span>
        <button
          v-if="recentArticles.length"
          type="button"
          class="h-9 px-3 rounded-md border border-parchment-300 dark:border-monastic-700 text-xs font-medium text-parchment-800 dark:text-parchment-200 hover:bg-parchment-100 dark:hover:bg-monastic-700"
          @click="downloadCsv"
        >
          Unduh CSV
        </button>
      </div>

      <!-- Feed items grid -->
      <div v-if="recentArticles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="art in recentArticles"
          :key="art.id"
          class="p-3 rounded-lg border border-parchment-200 dark:border-monastic-700 bg-white dark:bg-monastic-800 flex flex-col justify-between hover:border-claret-300 dark:hover:border-brass-600 transition-colors shadow-xs"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span 
                class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-parchment-100 dark:bg-monastic-700 text-parchment-700 dark:text-parchment-300 line-clamp-1"
                :title="'Sumber portal berita: ' + art.source"
              >
                {{ art.source }}
              </span>
              <Badge 
                :variant="art.sentiment === 'positive' ? 'positive' : art.sentiment === 'negative' ? 'negative' : 'neutral'"
                class="text-[9px] py-0 px-1"
                :title="'Klasifikasi sentimen otomatis berbasis analisis teks: ' + art.sentiment"
              >
                {{ art.sentiment }}
              </Badge>
            </div>

            <h5 class="text-xs font-bold text-parchment-900 dark:text-parchment-100 leading-snug line-clamp-2">
              {{ art.title }}
            </h5>

            <p class="text-[11px] text-parchment-600 dark:text-parchment-400 mt-1 line-clamp-2 leading-relaxed italic">
              "{{ art.content }}"
            </p>
          </div>

          <div class="mt-2.5 pt-2 border-t border-parchment-100 dark:border-monastic-700/80 flex items-center justify-between text-[10px] text-parchment-500">
            <span :title="'Waktu publikasi berita oleh redaksi: ' + art.publishedAt">{{ art.publishedAt }}</span>
            <a 
              :href="art.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-claret-700 hover:text-claret-800 dark:text-brass-400 font-semibold hover:underline cursor-pointer"
              title="Buka artikel asli langsung di situs web penerbit"
            >
              <span>Baca Sumber</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6 text-xs text-parchment-500">
        Belum ada feed yang dirayapi untuk topik ini. Klik "Sinkronkan Sekarang" untuk memulai perayapan instan.
      </div>
    </div>
  </div>
</template>
