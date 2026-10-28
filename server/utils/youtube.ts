import type { YouTubeSearchItem, YouTubeVideoStatistics } from '~/lib/youtube'
import { createTtlCache } from '~/server/utils/ttl-cache'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'
// Kuota default 10.000 unit/hari: search.list = 100 unit, videos.list = 1 unit. Cache 30 menit ≈ 48 pencarian/hari per kueri
const CACHE_TTL_MS = 30 * 60 * 1000
const SEARCH_WINDOW_MS = 7 * 24 * 3600 * 1000

interface YouTubeSearchResult {
  items: YouTubeSearchItem[]
  statsById: Record<string, YouTubeVideoStatistics>
}

const cache = createTtlCache<YouTubeSearchResult>(CACHE_TTL_MS)

export function isYouTubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY
}

export class YouTubeApiError extends Error {}

async function getJson(path: string, params: URLSearchParams, timeoutMs: number): Promise<any> {
  const res = await fetch(`${YOUTUBE_API_URL}/${path}?${params}`, { signal: AbortSignal.timeout(timeoutMs) })
  const body: any = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(body?.items)) {
    // URL memuat API key sehingga tidak pernah dicatat; cukup pesan error dari Google
    throw new YouTubeApiError(body?.error?.message || `HTTP ${res.status}`)
  }
  return body
}

/** Video publik Indonesia 7 hari terakhir (terbaru dulu) beserta statistik tayangan/interaksi. */
export async function searchYouTube(query: string, timeoutMs: number): Promise<{ data: YouTubeSearchResult; cached: boolean }> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new YouTubeApiError('YOUTUBE_API_KEY belum diatur')

  const hit = cache.get(query)
  if (hit) return { data: hit, cached: true }

  const search = await getJson('search', new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'date',
    publishedAfter: new Date(Date.now() - SEARCH_WINDOW_MS).toISOString(),
    regionCode: 'ID',
    relevanceLanguage: 'id',
    maxResults: '50',
    key
  }), timeoutMs)
  const items: YouTubeSearchItem[] = search.items

  const ids = items.map(i => i.id?.videoId).filter((id): id is string => !!id)
  const statsById: Record<string, YouTubeVideoStatistics> = {}
  if (ids.length) {
    const videos = await getJson('videos', new URLSearchParams({ part: 'statistics', id: ids.join(','), key }), timeoutMs)
    for (const v of videos.items) if (v?.id && v.statistics) statsById[v.id] = v.statistics
  }

  const data = { items, statsById }
  cache.set(query, data)
  return { data, cached: false }
}
