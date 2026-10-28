import { parseSubreddits, type RedditPost } from '~/lib/reddit'
import { createTtlCache } from '~/server/utils/ttl-cache'

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_API_URL = 'https://oauth.reddit.com'
// Reddit mewajibkan User-Agent unik berformat <platform>:<app id>:<versi>; UA generik di-throttle
const USER_AGENT = 'server:isumedia-tracker:1.0 (riset media publik)'
// Rate limit OAuth: 100 request/menit per client
const CACHE_TTL_MS = 5 * 60 * 1000

const cache = createTtlCache<RedditPost[]>(CACHE_TTL_MS)
let appToken: { value: string; expiresAt: number } | null = null

export function isRedditConfigured(): boolean {
  return !!process.env.REDDIT_CLIENT_ID && !!process.env.REDDIT_CLIENT_SECRET
}

export function redditSubreddits(): string[] {
  return parseSubreddits(process.env.REDDIT_SUBREDDITS)
}

export class RedditApiError extends Error {}

/** Token application-only (grant client_credentials, berlaku 24 jam) disimpan sampai 1 menit sebelum kedaluwarsa. */
async function getAppToken(timeoutMs: number): Promise<string> {
  if (appToken && appToken.expiresAt > Date.now()) return appToken.value
  const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    signal: AbortSignal.timeout(timeoutMs)
  })
  const body: any = await res.json().catch(() => null)
  if (!res.ok || !body?.access_token) {
    throw new RedditApiError(`token ditolak: ${body?.error || `HTTP ${res.status}`}`)
  }
  appToken = { value: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 86400) * 1000 - 60_000 }
  return appToken.value
}

/** Thread publik 7 hari terakhir (terbaru dulu) pada subreddit pantauan. */
export async function searchReddit(query: string, timeoutMs: number): Promise<{ data: RedditPost[]; cached: boolean }> {
  if (!isRedditConfigured()) throw new RedditApiError('REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET belum diatur')

  const subreddits = redditSubreddits().join('+')
  const key = `${subreddits}|${query}`
  const hit = cache.get(key)
  if (hit) return { data: hit, cached: true }

  const token = await getAppToken(timeoutMs)
  const params = new URLSearchParams({
    q: query,
    restrict_sr: '1',
    sort: 'new',
    t: 'week',
    type: 'link',
    limit: '100',
    // Tanpa raw_json, teks dikembalikan dengan entitas HTML (&amp;)
    raw_json: '1'
  })
  const res = await fetch(`${REDDIT_API_URL}/r/${subreddits}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs)
  })
  const body: any = await res.json().catch(() => null)
  if (res.status === 401) appToken = null
  if (!res.ok || !Array.isArray(body?.data?.children)) {
    throw new RedditApiError(body?.message || body?.error || `HTTP ${res.status}`)
  }

  const posts: RedditPost[] = body.data.children.filter((c: any) => c?.kind === 't3' && c.data).map((c: any) => c.data)
  cache.set(key, posts)
  return { data: posts, cached: false }
}
