import { buildTikTokQueryBody, quoteVideoIds, TIKTOK_VIDEO_FIELDS, type TikTokVideo } from '~/lib/tiktok'
import { createTtlCache } from '~/server/utils/ttl-cache'

const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_QUERY_URL = 'https://open.tiktokapis.com/v2/research/video/query/'
// Research API: 1.000 request/hari per aplikasi
const CACHE_TTL_MS = 15 * 60 * 1000

const cache = createTtlCache<TikTokVideo[]>(CACHE_TTL_MS)
let clientToken: { value: string; expiresAt: number } | null = null

export function isTikTokConfigured(): boolean {
  return !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET
}

export class TikTokApiError extends Error {}

/** Client access token (grant client_credentials, berlaku ±2 jam) disimpan sampai 1 menit sebelum kedaluwarsa. */
async function getClientToken(timeoutMs: number): Promise<string> {
  if (clientToken && clientToken.expiresAt > Date.now()) return clientToken.value
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      grant_type: 'client_credentials'
    }),
    signal: AbortSignal.timeout(timeoutMs)
  })
  const body: any = await res.json().catch(() => null)
  if (!res.ok || !body?.access_token) {
    throw new TikTokApiError(`token ditolak: ${body?.error_description || body?.error || `HTTP ${res.status}`}`)
  }
  clientToken = { value: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 7200) * 1000 - 60_000 }
  return clientToken.value
}

/** Video publik wilayah Indonesia 7 hari terakhir yang deskripsinya memuat salah satu kata kunci. */
export async function searchTikTok(terms: string[], timeoutMs: number): Promise<{ data: TikTokVideo[]; cached: boolean }> {
  if (!isTikTokConfigured()) throw new TikTokApiError('TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET belum diatur')

  const key = terms.map(t => t.toLowerCase()).sort().join('|')
  const hit = cache.get(key)
  if (hit) return { data: hit, cached: true }

  const token = await getClientToken(timeoutMs)
  const res = await fetch(`${TIKTOK_QUERY_URL}?fields=${TIKTOK_VIDEO_FIELDS}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTikTokQueryBody(terms, Date.now())),
    signal: AbortSignal.timeout(timeoutMs)
  })
  const raw = await res.text()
  let body: any = null
  try {
    body = JSON.parse(quoteVideoIds(raw))
  } catch {}
  if (res.status === 401) clientToken = null
  if (!res.ok || body?.error?.code !== 'ok' || !Array.isArray(body?.data?.videos)) {
    throw new TikTokApiError(body?.error?.message || `HTTP ${res.status}`)
  }

  cache.set(key, body.data.videos)
  return { data: body.data.videos, cached: false }
}
