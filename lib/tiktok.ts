/**
 * Konektor TikTok (TikTok Research API `research/video/query`): body kueri dan normalisasi hasil.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/tiktok.ts.
 */
import type { AnalysisInputPost } from './issue-analysis.ts'

export interface TikTokVideo {
  /** int64; dibaca sebagai string lewat `quoteVideoIds` agar tidak kehilangan presisi */
  id: string
  username?: string
  video_description?: string
  /** Unix epoch detik (UTC) */
  create_time?: number
  region_code?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

export const TIKTOK_VIDEO_FIELDS = 'id,username,video_description,create_time,region_code,view_count,like_count,comment_count,share_count'

function yyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

/**
 * Body kueri video publik wilayah Indonesia yang deskripsinya memuat salah satu kata kunci (operasi `IN` = OR).
 * Research API memakai tanggal UTC dengan rentang maks. 30 hari; kata kunci dari `keywordCoverTerms`.
 */
export function buildTikTokQueryBody(terms: string[], now: number, windowDays = 7, maxCount = 100) {
  return {
    query: {
      and: [
        { operation: 'IN', field_name: 'region_code', field_values: ['ID'] },
        { operation: 'IN', field_name: 'keyword', field_values: terms }
      ]
    },
    start_date: yyyymmdd(new Date(now - windowDays * 24 * 3600 * 1000)),
    end_date: yyyymmdd(new Date(now)),
    max_count: maxCount
  }
}

/** ID video TikTok (±7·10¹⁸) melebihi Number.MAX_SAFE_INTEGER; dikutip sebelum JSON.parse. */
export function quoteVideoIds(rawJson: string): string {
  return rawJson.replace(/"id"\s*:\s*(\d+)/g, '"id":"$1"')
}

export function mapTikTokVideo(video: TikTokVideo): AnalysisInputPost | null {
  const text = (video.video_description || '').replace(/\s+/g, ' ').trim()
  const publishedDate = typeof video.create_time === 'number' ? new Date(video.create_time * 1000) : null
  if (!text || !video.id || !video.username || !publishedDate || isNaN(publishedDate.getTime())) return null
  const handle = `@${video.username}`
  return {
    id: `tiktok_${video.id}`,
    title: text.substring(0, 200),
    content: text.substring(0, 400),
    url: `https://www.tiktok.com/${handle}/video/${video.id}`,
    source: handle,
    authorHandle: handle,
    platform: 'tiktok',
    publishedAt: publishedDate.toISOString(),
    reach: video.view_count ?? 0,
    engagement: (video.like_count ?? 0) + (video.comment_count ?? 0) + (video.share_count ?? 0)
  }
}
