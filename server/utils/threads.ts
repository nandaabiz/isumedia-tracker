import type { ThreadsMedia } from '~/lib/threads'
import { createTtlCache } from '~/server/utils/ttl-cache'

const THREADS_SEARCH_URL = 'https://graph.threads.net/v1.0/keyword_search'
const THREADS_FIELDS = 'id,text,media_type,permalink,timestamp,username,is_reply,is_quote_post'
// Batas Threads API: 2.200 kueri / 24 jam per pengguna; tiap kueri dihitung walau kata kuncinya sama
const CACHE_TTL_MS = 5 * 60 * 1000
const SEARCH_WINDOW_SEC = 7 * 24 * 3600

const cache = createTtlCache<ThreadsMedia[]>(CACHE_TTL_MS)

export function isThreadsConfigured(): boolean {
  return !!process.env.THREADS_ACCESS_TOKEN
}

export class ThreadsApiError extends Error {}

/** Pencarian post publik terbaru (7 hari) untuk satu kata kunci. Melempar ThreadsApiError bila API menolak. */
export async function searchThreads(term: string, timeoutMs: number): Promise<{ data: ThreadsMedia[]; cached: boolean }> {
  const token = process.env.THREADS_ACCESS_TOKEN
  if (!token) throw new ThreadsApiError('THREADS_ACCESS_TOKEN belum diatur')

  const key = term.toLowerCase()
  const hit = cache.get(key)
  if (hit) return { data: hit, cached: true }

  const params = new URLSearchParams({
    q: term,
    search_type: 'RECENT',
    fields: THREADS_FIELDS,
    since: String(Math.floor(Date.now() / 1000) - SEARCH_WINDOW_SEC),
    limit: '100',
    access_token: token
  })
  const res = await fetch(`${THREADS_SEARCH_URL}?${params}`, { signal: AbortSignal.timeout(timeoutMs) })
  const body: any = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(body?.data)) {
    // Pesan error Graph API tidak memuat token; URL request sengaja tidak pernah dicatat
    throw new ThreadsApiError(body?.error?.message || `HTTP ${res.status}`)
  }

  cache.set(key, body.data)
  return { data: body.data, cached: false }
}
