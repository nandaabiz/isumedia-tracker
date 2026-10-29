/**
 * Konektor forum publik (Reddit API `search` pada subreddit Indonesia): penerjemahan kueri dan normalisasi hasil.
 * Tanpa kredensial OAuth, server memakai feed Atom resmi `search.rss` yang dipetakan ke bentuk yang sama.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/reddit.ts.
 */
import { atomEntries, decodeHtmlEntities, tagAttr, tagText } from './atom.ts'
import { keywordCoverTerms, type AnalysisInputPost, type QueryNode } from './issue-analysis.ts'

export interface RedditPost {
  id: string
  title?: string
  selftext?: string
  author?: string
  subreddit?: string
  permalink?: string
  created_utc?: number
  score?: number
  num_comments?: number
  over_18?: boolean
}

export const REDDIT_QUERY_MAX_LENGTH = 512
export const DEFAULT_SUBREDDITS = ['indonesia']

/**
 * Sintaks pencarian Reddit (Lucene): `AND`, `OR`, `NOT`, "frasa". Setiap grup dikurung karena presedensi
 * campuran AND/OR pada Lucene tidak dapat diandalkan; kata kunci selalu dikutip agar tidak terbaca sebagai operator.
 */
export function toRedditQuery(node: QueryNode): string {
  switch (node.type) {
    case 'term': return `"${node.value}"`
    case 'and': return `(${toRedditQuery(node.left)} AND ${toRedditQuery(node.right)})`
    case 'or': return `(${toRedditQuery(node.left)} OR ${toRedditQuery(node.right)})`
    case 'not': return `NOT ${toRedditQuery(node.operand)}`
  }
}

/** Kueri lengkap bila muat; bila tidak, gabungan OR kata kunci minimum. `null` bila tidak ada kata kunci positif. */
export function buildRedditQuery(node: QueryNode | null, maxLength = REDDIT_QUERY_MAX_LENGTH): string | null {
  const terms = keywordCoverTerms(node)
  if (!node || !terms.length) return null
  const full = toRedditQuery(node)
  if (full.length <= maxLength) return full
  const cover = terms.map(t => `"${t}"`).join(' OR ')
  return cover.length <= maxLength ? cover : null
}

/** Daftar subreddit dari env `REDDIT_SUBREDDITS` (dipisah koma); nama tidak valid dibuang. */
export function parseSubreddits(value: string | undefined): string[] {
  const names = (value || '')
    .split(',')
    .map(s => s.trim().replace(/^r\//i, ''))
    .filter(s => /^[A-Za-z0-9_]{2,21}$/.test(s))
  return names.length ? [...new Set(names)] : DEFAULT_SUBREDDITS
}

export function mapRedditPost(post: RedditPost): AnalysisInputPost | null {
  const title = (post.title || '').replace(/\s+/g, ' ').trim()
  const body = (post.selftext || '').replace(/\s+/g, ' ').trim()
  const publishedDate = typeof post.created_utc === 'number' ? new Date(post.created_utc * 1000) : null
  // Konten NSFW dan akun terhapus ("[deleted]") tidak dianalisis
  if (post.over_18 || !title || !post.author || post.author === '[deleted]' || !post.permalink || !post.subreddit) return null
  if (!publishedDate || isNaN(publishedDate.getTime())) return null
  const content = body ? `${title}. ${body}` : title
  const handle = `u/${post.author}`
  return {
    id: `reddit_${post.id}`,
    title: title.substring(0, 200),
    content: content.substring(0, 400),
    url: `https://www.reddit.com${post.permalink}`,
    source: handle,
    authorHandle: handle,
    platform: 'forum',
    publishedAt: publishedDate.toISOString(),
    // Reddit tidak membuka jumlah tayangan; interaksi = skor vote + komentar
    reach: 0,
    engagement: Math.max(0, post.score ?? 0) + (post.num_comments ?? 0)
  }
}

/**
 * Feed `search.rss` ke bentuk post API. Feed tidak memuat skor, jumlah komentar, maupun flag NSFW; NSFW disaring
 * lewat parameter `include_over_18=off`. Teks post ada di dalam HTML ter-escape di antara penanda SC_OFF/SC_ON.
 */
export function parseRedditFeed(xml: string): RedditPost[] {
  const posts: RedditPost[] = []
  for (const entry of atomEntries(xml)) {
    const id = tagText(entry, 'id').replace(/^t3_/, '')
    const link = decodeHtmlEntities(tagAttr(entry, 'link', 'href'))
    let permalink = ''
    try {
      const url = new URL(link)
      if (url.hostname === 'www.reddit.com') permalink = url.pathname
    } catch {}
    const html = decodeHtmlEntities(tagText(entry, 'content'))
    const body = html.match(/<!-- SC_OFF -->([\s\S]*?)<!-- SC_ON -->/)?.[1] ?? ''
    const published = Date.parse(tagText(entry, 'published'))
    if (!id || !permalink || isNaN(published)) continue
    posts.push({
      id,
      title: decodeHtmlEntities(tagText(entry, 'title')),
      selftext: decodeHtmlEntities(body.replace(/<[^>]+>/g, ' ')),
      author: decodeHtmlEntities(tagText(tagText(entry, 'author'), 'name')).replace(/^\/u\//, ''),
      subreddit: tagAttr(entry, 'category', 'term'),
      permalink,
      created_utc: Math.floor(published / 1000)
    })
  }
  return posts
}
