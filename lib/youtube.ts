/**
 * Konektor YouTube (YouTube Data API v3 `search.list` + `videos.list`): kueri dan normalisasi hasil.
 * Tanpa API key, server memakai feed Atom resmi per kanal (`feeds/videos.xml`) yang dipetakan ke bentuk yang sama.
 *
 * Pure functions agar dapat diuji langsung dengan `node --test`; HTTP client ada di server/utils/youtube.ts.
 */
import { atomEntries, decodeHtmlEntities, tagAttr, tagText } from './atom.ts'
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

/** Kanal berita nasional default untuk feed tanpa API key (ID kanal diverifikasi 2026-10-29). */
export const DEFAULT_YOUTUBE_CHANNELS = [
  'UC5BMIWZe9isJXLZZWPWvBlg', // KOMPASTV
  'UCzl0OrB3-ehunyotIQvK77A', // METRO TV
  'UCER4rvDnRBPr_ncYW4UCZjg', // tvOneNews
  'UCoSkllfpgmFHtbVK835QaQg' // Official iNews
]

/** Daftar ID kanal (`UC` + 22 karakter) dari env `YOUTUBE_CHANNEL_IDS` (dipisah koma); ID tidak valid dibuang. */
export function parseYouTubeChannels(value: string | undefined): string[] {
  const ids = (value || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => /^UC[A-Za-z0-9_-]{22}$/.test(s))
  return ids.length ? [...new Set(ids)] : DEFAULT_YOUTUBE_CHANNELS
}

/**
 * Feed kanal (15 video terbaru) ke bentuk hasil search.list + videos.list. Teks dibiarkan ter-escape karena
 * `mapYouTubeVideo` yang mendekode entitas. Jumlah rating = jumlah like sejak dislike disembunyikan; komentar tidak tersedia.
 */
export function parseYouTubeFeed(xml: string): { items: YouTubeSearchItem[]; statsById: Record<string, YouTubeVideoStatistics> } {
  const items: YouTubeSearchItem[] = []
  const statsById: Record<string, YouTubeVideoStatistics> = {}
  for (const entry of atomEntries(xml)) {
    const videoId = tagText(entry, 'yt:videoId')
    if (!videoId) continue
    items.push({
      id: { videoId },
      snippet: {
        publishedAt: tagText(entry, 'published'),
        channelId: tagText(entry, 'yt:channelId'),
        channelTitle: decodeHtmlEntities(tagText(tagText(entry, 'author'), 'name')),
        title: tagText(entry, 'title'),
        description: tagText(entry, 'media:description')
      }
    })
    statsById[videoId] = {
      viewCount: tagAttr(entry, 'media:statistics', 'views') || undefined,
      likeCount: tagAttr(entry, 'media:starRating', 'count') || undefined
    }
  }
  return { items, statsById }
}
