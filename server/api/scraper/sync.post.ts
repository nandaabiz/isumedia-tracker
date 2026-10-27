import { defineEventHandler, readBody, createError } from 'h3'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'
import {
  analyzeIssue,
  analyzeSentiment,
  formatRelative,
  formatWib,
  keywordsToQuery,
  matchesQuery,
  normalizeText,
  parseBooleanQuery,
  toSearchEngineQuery,
  type AnalysisInputPost,
  type QueryNode
} from '~/lib/issue-analysis'
import { mapThreadsMedia, threadsSearchTerms } from '~/lib/threads'
import { isThreadsConfigured, searchThreads } from '~/server/utils/threads'

interface ScrapedPostItem extends AnalysisInputPost {
  timeAgo: string
  publishedAtLabel: string
  authorName: string
  authorRole: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
}

const PB_RECORD_ID = /^[a-z0-9]{15}$/
const MAX_PERSISTED_PER_SYNC = 20
const MAX_THREADS_TERMS = 3

function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function handleFromSource(sourceName: string, sourceUrl?: string): string {
  if (sourceUrl) {
    try {
      return '@' + new URL(sourceUrl).hostname.replace(/^www\./, '')
    } catch {}
  }
  return '@' + sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 24)
}

function parseRssXml(xml: string, defaultSource: string, now: number): ScrapedPostItem[] {
  const items: ScrapedPostItem[] = []
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || []

  // Google News mengembalikan maks. ±100 item; semuanya dipakai agar Timestamp Zero tidak terpotong
  for (const itemXml of itemMatches.slice(0, 100)) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i)
    if (!titleMatch) continue
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i)
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i)
    const sourceMatch = itemXml.match(/<source(?:\s+url="([^"]*)")?[^>]*>([\s\S]*?)<\/source>/i)

    const sourceName = sourceMatch ? cleanXmlText(sourceMatch[2]) : defaultSource
    // Google News menambahkan sufiks " - Nama Media" pada judul
    let title = cleanXmlText(titleMatch[1])
    if (sourceName && title.endsWith(` - ${sourceName}`)) title = title.slice(0, -(sourceName.length + 3))
    if (!title) continue

    const publishedDate = pubDateMatch ? new Date(cleanXmlText(pubDateMatch[1])) : null
    // Tanpa timestamp asli, item tidak dapat dipakai untuk rekonstruksi Timestamp Zero
    if (!publishedDate || isNaN(publishedDate.getTime())) continue
    const publishedAt = publishedDate.toISOString()

    const url = linkMatch ? cleanXmlText(linkMatch[1]) : ''
    let content = descMatch ? cleanXmlText(descMatch[1]) : title
    if (normalizeText(content).startsWith(normalizeText(title))) content = title
    const { sentiment, score } = analyzeSentiment(`${title}. ${content}`)

    items.push({
      id: 'rss_' + Buffer.from(url || title).toString('base64url').slice(-16),
      title,
      content: content.substring(0, 400),
      url,
      source: sourceName,
      authorHandle: handleFromSource(sourceName, sourceMatch?.[1]),
      authorName: sourceName,
      authorRole: 'Portal Berita Publik',
      platform: 'news',
      publishedAt,
      publishedAtLabel: formatWib(publishedAt),
      timeAgo: formatRelative(publishedAt, now),
      // RSS tidak menyediakan metrik jangkauan/interaksi; 0 = tidak tersedia
      reach: 0,
      engagement: 0,
      sentiment,
      sentimentScore: score
    })
  }

  return items
}

async function fetchFeed(url: string, timeoutMs: number): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IsuMediaTracker-ResearchBot/1.0' },
    signal: AbortSignal.timeout(timeoutMs)
  })
  return res.ok ? res.text() : null
}

function matchesEntities(item: ScrapedPostItem, entities: string[]): boolean {
  if (!entities.length) return true
  const text = ` ${normalizeText(`${item.title} ${item.content}`)} `
  return entities.every(e => text.includes(` ${normalizeText(e)} `))
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const topicTitle: string = String(body?.topicTitle || '').trim()
  const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords.map(String).filter(Boolean) : []
  const rawQuery: string = String(body?.query || '').trim()
  const entityFilter: string[] = Array.isArray(body?.entityFilter) ? body.entityFilter.map(String).filter(Boolean) : []
  const topicId: string = String(body?.topicId || 'active_topic')

  const queryText = rawQuery || keywordsToQuery(keywords.length ? keywords : [topicTitle])
  if (!queryText) {
    throw createError({ statusCode: 400, statusMessage: 'Kata kunci atau kueri pemantauan wajib diisi.' })
  }

  let ast: QueryNode | null
  try {
    ast = parseBooleanQuery(queryText)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: `Kueri boolean tidak valid: ${err.message}` })
  }

  const now = Date.now()
  const logs: string[] = []
  const stamp = () => new Date().toLocaleTimeString('id-ID')
  const scraped: ScrapedPostItem[] = []

  // 1. Google News RSS (pencarian 7 hari terakhir)
  try {
    const q = encodeURIComponent(`${toSearchEngineQuery(ast)} when:7d`)
    const xml = await fetchFeed(`https://news.google.com/rss/search?q=${q}&hl=id&gl=ID&ceid=ID:id`, 6000)
    if (xml) {
      const parsed = parseRssXml(xml, 'Google News Indonesia', now)
      scraped.push(...parsed)
      logs.push(`[${stamp()}] Google News RSS: ${parsed.length} artikel.`)
    }
  } catch (err: any) {
    logs.push(`[${stamp()}] Google News RSS gagal: ${err?.message || 'timeout'}`)
  }

  // 2. Antara News RSS (feed umum, disaring dengan kueri)
  try {
    const xml = await fetchFeed('https://www.antaranews.com/rss/terkini', 5000)
    if (xml) {
      const parsed = parseRssXml(xml, 'LKBN Antara', now).filter(item => matchesQuery(ast, `${item.title} ${item.content}`))
      scraped.push(...parsed)
      logs.push(`[${stamp()}] Antara RSS: ${parsed.length} artikel relevan.`)
    }
  } catch (err: any) {
    logs.push(`[${stamp()}] Antara RSS gagal: ${err?.message || 'timeout'}`)
  }

  // 3. Threads keyword search (post publik 7 hari terakhir), disaring ulang dengan kueri boolean
  if (isThreadsConfigured()) {
    const terms = threadsSearchTerms(ast)
    if (terms.length > MAX_THREADS_TERMS) {
      logs.push(`[${stamp()}] Threads: hanya ${MAX_THREADS_TERMS} dari ${terms.length} kata kunci yang dicari (batas kuota API).`)
    }
    for (const term of terms.slice(0, MAX_THREADS_TERMS)) {
      try {
        const { data, cached } = await searchThreads(term, 6000)
        const parsed = data
          .map(mapThreadsMedia)
          .filter((post): post is AnalysisInputPost => !!post && matchesQuery(ast, post.content))
          .map(post => {
            const { sentiment, score } = analyzeSentiment(post.content)
            return {
              ...post,
              authorName: post.source,
              authorRole: 'Akun Publik Threads',
              publishedAtLabel: formatWib(post.publishedAt),
              timeAgo: formatRelative(post.publishedAt, now),
              sentiment,
              sentimentScore: score
            }
          })
        scraped.push(...parsed)
        logs.push(`[${stamp()}] Threads "${term}": ${parsed.length} post relevan${cached ? ' (cache)' : ''}.`)
      } catch (err: any) {
        logs.push(`[${stamp()}] Threads "${term}" gagal: ${err?.message || 'timeout'}`)
      }
    }
  } else {
    logs.push(`[${stamp()}] Threads dilewati: THREADS_ACCESS_TOKEN belum diatur.`)
  }

  // Dedupe hanya berdasarkan URL; judul identik dari media berbeda justru bukti duplikasi narasi
  const unique = new Map<string, ScrapedPostItem>()
  for (const item of scraped) {
    if (!matchesEntities(item, entityFilter)) continue
    unique.set(item.url || item.id, item)
  }
  const items = [...unique.values()].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
  const analysis = analyzeIssue(topicId, items, now)

  // Persist ke PocketBase hanya untuk topik yang memang tersimpan di DB
  let pbSavedCount = 0
  if (PB_RECORD_ID.test(topicId)) {
    try {
      const pb = await getAuthenticatedServerPb()
      if (pb) {
        for (const post of items.slice(-MAX_PERSISTED_PER_SYNC)) {
          if (!post.url) continue
          try {
            await pb.collection('media_posts').getFirstListItem(pb.filter('external_id = {:url}', { url: post.url }))
            continue
          } catch {}
          try {
            await pb.collection('media_posts').create({
              topic_id: topicId,
              platform: post.platform,
              external_id: post.url,
              author_handle: post.authorHandle,
              author_name: post.authorName,
              author_role: post.authorRole,
              content: post.title,
              url: post.url,
              published_at: post.publishedAt,
              is_origin: analysis.origin?.id === post.id,
              sentiment: post.sentiment,
              sentiment_score: post.sentimentScore,
              reach: post.reach,
              engagement: post.engagement
            })
            pbSavedCount++
          } catch (err: any) {
            logs.push(`[${stamp()}] Gagal menyimpan post: ${err?.message}`)
          }
        }
        if (pbSavedCount > 0) logs.push(`[${stamp()}] ${pbSavedCount} record baru tersimpan di media_posts.`)
      }
    } catch (err: any) {
      logs.push(`[${stamp()}] PocketBase tidak tersedia: ${err?.message}`)
    }
  }

  return {
    success: true,
    topicId,
    query: queryText,
    ingestedCount: items.length,
    pbSavedCount,
    lastSync: new Date(now).toISOString(),
    logs,
    // Terbaru di atas untuk feed status bar
    items: [...items].reverse().map(item => ({ ...item, publishedAt: item.publishedAtLabel })),
    analysis
  }
})
