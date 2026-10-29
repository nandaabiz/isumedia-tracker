import type { MonitoredTopic } from '~/types/issue'
import { CATEGORY_QUERIES, categoryFeedUrl, parseNewsFeed, pickCategoryThemes, toThemeTopic } from '~/lib/latest-issues'
import { createTtlCache } from '~/server/utils/ttl-cache'

const FEED_TIMEOUT_MS = 6000
// Satu reload memicu 5 request feed; cache mencegah request ulang selama tema belum banyak berubah
const cache = createTtlCache<MonitoredTopic[]>(10 * 60 * 1000)

async function fetchCategoryTopics({ category, query }: (typeof CATEGORY_QUERIES)[number]): Promise<MonitoredTopic[]> {
  const res = await fetch(categoryFeedUrl(query), {
    headers: { 'User-Agent': 'IsuMediaTracker-ResearchBot/1.0' },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS)
  })
  if (!res.ok) throw new Error(`${category}: HTTP ${res.status}`)
  return pickCategoryThemes(category, parseNewsFeed(await res.text())).map(toThemeTopic)
}

/** Tema trend per kategori; kategori yang feed-nya gagal dilewati dan dicatat di `errors`. */
export async function getLatestTopics(): Promise<{ topics: MonitoredTopic[]; errors: string[]; cached: boolean }> {
  const cached = cache.get('latest')
  if (cached) return { topics: cached, errors: [], cached: true }

  const results = await Promise.allSettled(CATEGORY_QUERIES.map(fetchCategoryTopics))
  const errors = results.flatMap(r => (r.status === 'rejected' ? [r.reason?.message || 'timeout'] : []))
  if (errors.length) console.warn('[Latest Issues Error]:', errors.join('; '))

  const topics = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
  // Hasil parsial tidak di-cache agar kategori yang gagal dicoba lagi pada reload berikutnya
  if (topics.length && !errors.length) cache.set('latest', topics)
  return { topics, errors, cached: false }
}
