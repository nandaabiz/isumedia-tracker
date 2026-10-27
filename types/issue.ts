export type PlatformType = 'news' | 'threads' | 'x' | 'youtube' | 'tiktok' | 'forum'

export type SentimentType = 'positive' | 'neutral' | 'negative'

export interface MonitoredTopic {
  id: string
  title: string
  category: 'Ekonomi' | 'Politik' | 'Sosial & Hukum' | 'Lingkungan' | 'Kesejahteraan'
  keywords: string[]
  /** Kueri boolean opsional, mis. `"PPN 12%" AND (sembako OR ritel) NOT hoaks` */
  query?: string
  /** Filter entitas tokoh/organisasi yang wajib muncul di konten */
  entityFilter?: string[]
  isTrending: boolean
  trendVelocity: string // e.g. "+142% / jam"
  totalMentions: number
  originTimestamp: string
  activeMediaSources: PlatformType[]
  summary: string
  proArguments: string
  contraArguments: string
}

export interface OriginPost {
  id: string
  topicId: string
  platform: PlatformType
  authorHandle: string
  authorName: string
  authorRole: string
  avatar: string
  content: string
  publishedAt: string
  timeAgo: string
  reach: number
  engagement: number
  url: string
  isVerifiedOrigin: boolean
}

export interface AmplificationNode {
  id: string
  authorHandle: string
  authorName: string
  role: 'origin' | 'kol' | 'amplifier' | 'news_media' | 'bot_suspect'
  platform: PlatformType
  publishedAt: string
  delaySec: number // seconds after origin
  similarityScore: number // 0.0 - 1.0 (text duplication)
  reach: number
  sentiment: SentimentType
  contentSnippet: string
  /** Kedalaman dari origin: 0 = origin, 1 = penyebar pertama, 2+ = duplikasi lanjutan */
  depth?: number
  parentId?: string
  url?: string
}

export interface AmplificationEdge {
  source: string // source node ID
  target: string // target node ID
  type: 'retweet' | 'quote' | 'duplicate_copy' | 'news_coverage'
  similarity: number
}

export interface RegionalIssueStat {
  provinceCode: string
  provinceName: string
  mentionCount: number
  intensity: 'very_high' | 'high' | 'medium' | 'low'
  dominantSentiment: SentimentType
  localHeadline: string
  /** Daftar publikasi untuk drill-down provinsi (FR-1.3.3) */
  posts?: RegionalPostRef[]
}

export interface RegionalPostRef {
  id: string
  title: string
  url: string
  source: string
  platform: PlatformType
  publishedAt: string
  sentiment: SentimentType
}

export interface NarrativeQuote {
  text: string
  source: string
  url: string
  score: number
}

export interface IssueAnalysis {
  topicId: string
  generatedAt: string
  totalPosts: number
  uniqueSources: number
  origin: OriginPost | null
  nodes: AmplificationNode[]
  edges: AmplificationEdge[]
  regional: RegionalIssueStat[]
  /** Persentase 0..100 per kelas, averageScore -1..+1 */
  sentiment: { positive: number; neutral: number; negative: number; averageScore: number }
  keyPhrases: { phrase: string; count: number }[]
  entities: { entity: string; count: number }[]
  narrative: { summary: string; pro: NarrativeQuote[]; contra: NarrativeQuote[] }
  duplication: { index: number; copyPasteCount: number; averageSimilarity: number; fastestDelaySec: number | null }
  trend: { last24h: number; previous24h: number; velocityPct: number; isTrending: boolean }
  /** Volume publikasi harian (tanggal WIB) per kelas sentimen */
  timeline: { date: string; positive: number; neutral: number; negative: number }[]
}
