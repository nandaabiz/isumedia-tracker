/**
 * Konektor Threads (Meta Threads API `keyword_search`): normalisasi hasil. Kata kunci pencarian dari `keywordCoverTerms`.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/threads.ts.
 */
import type { AnalysisInputPost } from './issue-analysis.ts'

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
