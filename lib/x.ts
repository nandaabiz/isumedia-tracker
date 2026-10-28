/**
 * Konektor X (X API v2 `tweets/search/recent`): penerjemahan kueri boolean dan normalisasi hasil.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/x.ts.
 */
import { keywordCoverTerms, type AnalysisInputPost, type QueryNode } from './issue-analysis.ts'

export interface XTweet {
  id: string
  text?: string
  author_id?: string
  created_at?: string
  public_metrics?: {
    retweet_count?: number
    reply_count?: number
    like_count?: number
    quote_count?: number
    impression_count?: number
  }
}

export interface XUser {
  id: string
  username: string
  name?: string
}

// Batas panjang kueri recent search untuk paket self-serve (Basic/Pro)
export const X_QUERY_MAX_LENGTH = 512
// Retweet hanya mengulang teks asli (terpotong "RT @...") sehingga merusak skor duplikasi; bahasa mengikuti config media_sources
const X_QUERY_SUFFIX = ' -is:retweet lang:id'

function xTerm(value: string): string {
  return /^[\p{L}\p{N}_#@$]+$/u.test(value) ? value : `"${value}"`
}

/** Sintaks X: spasi = AND, `OR`, `-` = negasi, tanda kurung untuk grup. */
export function toXQuery(node: QueryNode): string {
  switch (node.type) {
    case 'term': return xTerm(node.value)
    case 'and': return `${toXQuery(node.left)} ${toXQuery(node.right)}`
    case 'or': return `(${toXQuery(node.left)} OR ${toXQuery(node.right)})`
    case 'not': {
      const inner = toXQuery(node.operand)
      return node.operand.type === 'and' ? `-(${inner})` : `-${inner}`
    }
  }
}

/**
 * Kueri lengkap bila muat dalam batas panjang; bila tidak, gabungan OR kata kunci minimum (hasil disaring
 * ulang dengan `matchesQuery`). `null` bila kueri tidak punya kata kunci positif (X menolak kueri negasi saja).
 */
export function buildXQuery(node: QueryNode | null, maxLength = X_QUERY_MAX_LENGTH): string | null {
  const terms = keywordCoverTerms(node)
  if (!node || !terms.length) return null
  const full = toXQuery(node) + X_QUERY_SUFFIX
  if (full.length <= maxLength) return full
  const cover = `(${terms.map(xTerm).join(' OR ')})${X_QUERY_SUFFIX}`
  return cover.length <= maxLength ? cover : null
}

export function mapXTweet(tweet: XTweet, usersById: Map<string, XUser>): AnalysisInputPost | null {
  const text = (tweet.text || '').replace(/\s+/g, ' ').trim()
  const user = tweet.author_id ? usersById.get(tweet.author_id) : undefined
  const publishedDate = tweet.created_at ? new Date(tweet.created_at) : null
  if (!text || !user || !publishedDate || isNaN(publishedDate.getTime())) return null
  const handle = `@${user.username}`
  const m = tweet.public_metrics ?? {}
  return {
    id: `x_${tweet.id}`,
    title: text.substring(0, 200),
    content: text.substring(0, 400),
    url: `https://x.com/${user.username}/status/${tweet.id}`,
    source: handle,
    authorHandle: handle,
    platform: 'x',
    publishedAt: publishedDate.toISOString(),
    reach: m.impression_count ?? 0,
    engagement: (m.like_count ?? 0) + (m.retweet_count ?? 0) + (m.reply_count ?? 0) + (m.quote_count ?? 0)
  }
}
