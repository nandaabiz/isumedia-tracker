/**
 * Konektor YouTube (YouTube Data API v3 `search.list` + `videos.list`): kueri dan normalisasi hasil.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/youtube.ts.
 */
import { keywordCoverTerms, type AnalysisInputPost, type QueryNode } from './issue-analysis.ts'

export interface YouTubeSearchItem {
  id?: { videoId?: string }
  snippet?: {
    publishedAt?: string
    channelId?: string
    channelTitle?: string
    title?: string
    description?: string
  }
}

export interface YouTubeVideoStatistics {
  viewCount?: string
  likeCount?: string
  commentCount?: string
}

/**
 * Parameter `q` hanya mendokumentasikan `|` (OR) dan `-` (NOT) tanpa tanda kurung, jadi kueri bersarang
 * tidak dapat diterjemahkan dengan aman. Server mencari gabungan OR kata kunci minimum lalu menyaring ulang
 * hasilnya dengan `matchesQuery`. String kosong = kueri tidak dapat dicari.
 */
export function buildYouTubeQuery(node: QueryNode | null): string {
  return keywordCoverTerms(node)
    .map(term => (/\s/.test(term) ? `"${term}"` : term))
    .join('|')
}

/** Judul & deskripsi dari search.list di-escape sebagai entitas HTML. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function mapYouTubeVideo(item: YouTubeSearchItem, stats?: YouTubeVideoStatistics): AnalysisInputPost | null {
  const videoId = item.id?.videoId
  const snippet = item.snippet
  const title = decodeHtmlEntities(snippet?.title || '').replace(/\s+/g, ' ').trim()
  const description = decodeHtmlEntities(snippet?.description || '').replace(/\s+/g, ' ').trim()
  const channel = (snippet?.channelTitle || '').trim()
  const publishedDate = snippet?.publishedAt ? new Date(snippet.publishedAt) : null
  if (!videoId || !title || !channel || !publishedDate || isNaN(publishedDate.getTime())) return null
  const content = description ? `${title}. ${description}` : title
  return {
    id: `youtube_${videoId}`,
    title: title.substring(0, 200),
    content: content.substring(0, 400),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: channel,
    // search.list tidak mengembalikan @handle kanal
    authorHandle: channel,
    platform: 'youtube',
    publishedAt: publishedDate.toISOString(),
    // Statistik dapat disembunyikan pemilik kanal (mis. jumlah like); 0 = tidak tersedia
    reach: Number(stats?.viewCount ?? 0) || 0,
    engagement: (Number(stats?.likeCount ?? 0) || 0) + (Number(stats?.commentCount ?? 0) || 0)
  }
}
