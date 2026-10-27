/**
 * Konektor Threads (Meta Threads API `keyword_search`): pemetaan kueri boolean dan normalisasi hasil.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/threads.ts.
 */
import type { AnalysisInputPost, QueryNode } from './issue-analysis.ts'

export interface ThreadsMedia {
  id: string
  text?: string
  media_type?: string
  permalink?: string
  timestamp?: string
  username?: string
  is_reply?: boolean
  is_quote_post?: boolean
}

/**
 * Threads keyword search tidak mendukung operator boolean. Fungsi ini memilih himpunan kata kunci
 * minimum yang menjamin setiap post yang cocok dengan kueri pasti mengandung salah satunya:
 * OR = gabungan kedua sisi, AND = sisi dengan kata kunci paling sedikit, NOT = tidak dapat dicari.
 * Hasil pencarian kemudian disaring ulang dengan `matchesQuery` di server.
 */
export function threadsSearchTerms(node: QueryNode | null): string[] {
  const collect = (n: QueryNode): string[] | null => {
    switch (n.type) {
      case 'term': return [n.value]
      case 'not': return null
      case 'or': {
        const left = collect(n.left)
        const right = collect(n.right)
        // Satu sisi OR tanpa kata kunci positif berarti kueri tidak dapat dicakup secara lengkap
        return left && right ? [...left, ...right] : null
      }
      case 'and': {
        const left = collect(n.left)
        const right = collect(n.right)
        if (!left) return right
        if (!right) return left
        return left.length <= right.length ? left : right
      }
    }
  }
  if (!node) return []
  const seen = new Set<string>()
  return (collect(node) ?? []).filter(term => {
    const key = term.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mapThreadsMedia(media: ThreadsMedia): AnalysisInputPost | null {
  const text = (media.text || '').replace(/\s+/g, ' ').trim()
  const publishedDate = media.timestamp ? new Date(media.timestamp) : null
  // Post tanpa teks (gambar/video saja) tidak dapat dianalisis; tanpa timestamp tidak dapat dipakai untuk Timestamp Zero
  if (!text || !media.username || !publishedDate || isNaN(publishedDate.getTime())) return null
  const handle = `@${media.username}`
  return {
    id: `threads_${media.id}`,
    title: text.substring(0, 200),
    content: text.substring(0, 400),
    url: media.permalink || '',
    source: handle,
    authorHandle: handle,
    platform: 'threads',
    publishedAt: publishedDate.toISOString(),
    // keyword_search tidak mengembalikan metrik views/likes untuk post milik akun lain
    reach: 0,
    engagement: 0
  }
}
