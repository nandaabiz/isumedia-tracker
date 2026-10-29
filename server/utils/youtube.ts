import { parseYouTubeChannels, parseYouTubeFeed, type YouTubeSearchItem, type YouTubeVideoStatistics } from '~/lib/youtube'
import { createTtlCache } from '~/server/utils/ttl-cache'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_FEED_URL = 'https://www.youtube.com/feeds/videos.xml'
// Kuota default 10.000 unit/hari: search.list = 100 unit, videos.list = 1 unit. Cache 30 menit ≈ 48 pencarian/hari per kueri
const CACHE_TTL_MS = 30 * 60 * 1000
const SEARCH_WINDOW_MS = 7 * 24 * 3600 * 1000
// Feed kanal hanya berubah saat kanal mengunggah video; tidak ada kuota resmi, cache menjaga beban tetap rendah
const FEED_CACHE_TTL_MS = 15 * 60 * 1000

interface YouTubeSearchResult {
  items: YouTubeSearchItem[]
  statsById: Record<string, YouTubeVideoStatistics>
}

const cache = createTtlCache<YouTubeSearchResult>(CACHE_TTL_MS)
const feedCache = createTtlCache<YouTubeSearchResult>(FEED_CACHE_TTL_MS)

export function isYouTubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY
}

export function youtubeChannels(): string[] {
  return parseYouTubeChannels(process.env.YOUTUBE_CHANNEL_IDS)
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

/**
 * Video 7 hari terakhir dari feed Atom resmi kanal pantauan (tanpa API key). Kanal yang gagal dilewati;
 * error hanya bila semua kanal gagal. Tidak ada pencarian kata kunci: hasil disaring dengan kueri oleh pemanggil.
 */
export async function fetchYouTubeChannelFeeds(timeoutMs: number): Promise<{ data: YouTubeSearchResult; cached: boolean; failed: number }> {
  const channels = youtubeChannels()
  const key = channels.join(',')
  const hit = feedCache.get(key)
  if (hit) return { data: hit, cached: true, failed: 0 }

  const results = await Promise.allSettled(channels.map(async (channelId) => {
    const res = await fetch(`${YOUTUBE_FEED_URL}?channel_id=${channelId}`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) throw new YouTubeApiError(`feed ${channelId}: HTTP ${res.status}`)
    return parseYouTubeFeed(await res.text())
  }))
  const feeds = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  if (!feeds.length) {
    const reason = results.find(r => r.status === 'rejected')?.reason
    throw new YouTubeApiError(reason?.message || 'semua feed kanal gagal')
  }

  const since = Date.now() - SEARCH_WINDOW_MS
  const data: YouTubeSearchResult = { items: [], statsById: {} }
  for (const feed of feeds) {
    data.items.push(...feed.items.filter(i => Date.parse(i.snippet?.publishedAt ?? '') >= since))
    Object.assign(data.statsById, feed.statsById)
  }
  feedCache.set(key, data)
  return { data, cached: false, failed: results.length - feeds.length }
}
