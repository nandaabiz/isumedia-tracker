import { ref } from 'vue'
import type { IssueAnalysis, PlatformType, SentimentType } from '~/types/issue'
import { apiFetch } from '~/composables/useApi'

export interface StreamedArticle {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  timeAgo: string
  platform: PlatformType
  authorHandle: string
  authorName: string
  authorRole: string
  content: string
  sentiment: SentimentType
  sentimentScore: number
  reach: number
  engagement: number
}

export interface SyncTopic {
  id: string
  title: string
  keywords: string[]
  query?: string
  entityFilter?: string[]
}

interface SyncResponse {
  items: StreamedArticle[]
  logs: string[]
  analysis: IssueAnalysis
  pbSavedCount: number
}

const SYNC_INTERVAL_MS = 45000
const MAX_LOGS = 8

const isCrawling = ref(false)
const lastSyncTime = ref<string>('Belum sinkron')
const totalIngested = ref<number>(0)
const currentStatusText = ref<string>('Engine perayap latar belakang siaga (Idle)')
const activeSourceLabel = ref<string>('RSS berita, Threads, X, YouTube, TikTok & forum Reddit')
const recentArticles = ref<StreamedArticle[]>([])
const syncLogs = ref<string[]>(['Sistem perayap latar belakang diinisiasi.'])
const analysisByTopic = ref<Record<string, IssueAnalysis>>({})
const syncError = ref<string | null>(null)

let timerId: ReturnType<typeof setInterval> | null = null
let pendingTopic: SyncTopic | null = null
let latestRequestedTopicId: string | null = null

function pushLogs(lines: string[]) {
  syncLogs.value = [...lines.slice().reverse(), ...syncLogs.value].slice(0, MAX_LOGS)
}

export function useScraperStream() {
  async function triggerScraperSync(topic: SyncTopic) {
    latestRequestedTopicId = topic.id
    // Topik yang dipilih saat perayapan berjalan diantrikan, bukan dibuang
    if (isCrawling.value) {
      pendingTopic = topic
      return
    }
    isCrawling.value = true
    syncError.value = null
    currentStatusText.value = `Sedang merayapi feed publik untuk "${topic.query || topic.keywords[0] || topic.title}"...`

    try {
      const data = await apiFetch<SyncResponse>('/api/scraper/sync', {
        method: 'POST',
        body: {
          topicTitle: topic.title,
          keywords: topic.keywords,
          query: topic.query,
          entityFilter: topic.entityFilter,
          topicId: topic.id
        }
      })

      analysisByTopic.value = { ...analysisByTopic.value, [topic.id]: data.analysis }
      if (topic.id === latestRequestedTopicId) {
        recentArticles.value = data.items
      }
      totalIngested.value += data.pbSavedCount
      pushLogs(data.logs)
      lastSyncTime.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      currentStatusText.value = `Sinkronisasi selesai • ${data.analysis.totalPosts} publikasi dianalisis dari ${data.analysis.uniqueSources} sumber`
    } catch (err: any) {
      const message = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Jaringan tidak tersedia'
      syncError.value = message
      currentStatusText.value = `Sinkronisasi gagal • ${message}`
      pushLogs([`[${new Date().toLocaleTimeString('id-ID')}] ${message}`])
    } finally {
      isCrawling.value = false
      if (pendingTopic) {
        const next = pendingTopic
        pendingTopic = null
        triggerScraperSync(next)
      }
    }
  }

  function startBackgroundWorker(getTopic: () => SyncTopic | null) {
    const current = getTopic()
    if (current) triggerScraperSync(current)

    if (!timerId && typeof window !== 'undefined') {
      timerId = setInterval(() => {
        const topic = getTopic()
        if (topic) triggerScraperSync(topic)
      }, SYNC_INTERVAL_MS)
    }
  }

  function stopBackgroundWorker() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  return {
    isCrawling,
    lastSyncTime,
    totalIngested,
    currentStatusText,
    activeSourceLabel,
    recentArticles,
    syncLogs,
    syncError,
    analysisByTopic,
    triggerScraperSync,
    startBackgroundWorker,
    stopBackgroundWorker
  }
}
