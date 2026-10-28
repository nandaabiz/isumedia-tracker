import type { XTweet, XUser } from '~/lib/x'
import { createTtlCache } from '~/server/utils/ttl-cache'

const X_SEARCH_URL = 'https://api.x.com/2/tweets/search/recent'
// Recent search dibatasi kuota baca post per bulan dan rate limit per 15 menit; satu kueri = satu request
const CACHE_TTL_MS = 15 * 60 * 1000
// start_time wajib berada dalam 7 hari terakhir; diberi jeda 1 menit agar tidak ditolak karena selisih jam
const SEARCH_WINDOW_MS = 7 * 24 * 3600 * 1000 - 60 * 1000

interface XSearchResult {
  tweets: XTweet[]
  users: XUser[]
}

const cache = createTtlCache<XSearchResult>(CACHE_TTL_MS)

export function isXConfigured(): boolean {
  return !!process.env.X_BEARER_TOKEN
}

export class XApiError extends Error {}

/** Pencarian post publik 7 hari terakhir dengan sintaks kueri X. Melempar XApiError bila API menolak. */
export async function searchX(query: string, timeoutMs: number): Promise<{ data: XSearchResult; cached: boolean }> {
  const token = process.env.X_BEARER_TOKEN
  if (!token) throw new XApiError('X_BEARER_TOKEN belum diatur')

  const hit = cache.get(query)
  if (hit) return { data: hit, cached: true }

  const params = new URLSearchParams({
    query,
    max_results: '100',
    start_time: new Date(Date.now() - SEARCH_WINDOW_MS).toISOString(),
    'tweet.fields': 'created_at,public_metrics,author_id',
    expansions: 'author_id',
    'user.fields': 'username,name'
  })
  const res = await fetch(`${X_SEARCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  })
  const body: any = await res.json().catch(() => null)
  // Error parsial (mis. satu akun ditangguhkan) tetap disertai `data`; hanya error tanpa data yang dianggap gagal
  if (!res.ok || !body || (body.errors?.length && !body.data && !body.meta)) {
    throw new XApiError(body?.detail || body?.errors?.[0]?.message || body?.title || `HTTP ${res.status}`)
  }

  // Tanpa hasil, X tidak menyertakan field `data` sama sekali (meta.result_count = 0)
  const data: XSearchResult = {
    tweets: Array.isArray(body.data) ? body.data : [],
    users: Array.isArray(body.includes?.users) ? body.includes.users : []
  }
  cache.set(query, data)
  return { data, cached: false }
}
