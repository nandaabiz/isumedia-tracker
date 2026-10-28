import { defineEventHandler } from 'h3'
import type { PlatformType } from '~/types/issue'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'
import { isRedditConfigured, redditSubreddits } from '~/server/utils/reddit'
import { isThreadsConfigured } from '~/server/utils/threads'
import { isTikTokConfigured } from '~/server/utils/tiktok'
import { isXConfigured } from '~/server/utils/x'
import { isYouTubeConfigured } from '~/server/utils/youtube'

const credentialStatus = (configured: boolean) => (configured ? 'Kredensial terpasang' : 'Belum dikonfigurasi')

export default defineEventHandler(async () => {
  let totalDbPosts = 0
  let totalDbTopics = 0

  const pb = await getAuthenticatedServerPb()
  if (pb) {
    try {
      totalDbPosts = (await pb.collection('media_posts').getList(1, 1)).totalItems
      totalDbTopics = (await pb.collection('monitored_topics').getList(1, 1)).totalItems
    } catch (err: any) {
      console.warn('[Scraper Status]:', err?.message)
    }
  }

  return {
    status: 'active',
    lastSync: new Date().toISOString(),
    database: {
      connected: !!pb,
      engine: 'PocketBase SQLite',
      totalPostsStored: totalDbPosts,
      totalTopicsStored: totalDbTopics
    },
    activeFeedSources: [
      { name: 'Google News Indonesia', type: 'Agregator Berita Nasional (RSS)', status: 'Online' },
      { name: 'LKBN Antara', type: 'RSS Kantor Berita Negara', status: 'Online' },
      { name: 'Threads', type: 'Threads API keyword_search (post publik)', status: credentialStatus(isThreadsConfigured()) },
      { name: 'X / Twitter', type: 'X API v2 recent search (post publik)', status: credentialStatus(isXConfigured()) },
      { name: 'YouTube', type: 'YouTube Data API v3 search (video publik)', status: credentialStatus(isYouTubeConfigured()) },
      { name: 'TikTok', type: 'TikTok Research API video query (video publik)', status: credentialStatus(isTikTokConfigured()) },
      {
        name: 'Forum Reddit',
        type: `Reddit API search (${redditSubreddits().map(s => `r/${s}`).join(', ')})`,
        status: credentialStatus(isRedditConfigured())
      }
    ],
    // Kanal yang benar-benar dirayapi pada sinkronisasi berikutnya (RSS berita tidak butuh kredensial)
    configuredPlatforms: ([
      ['news', true],
      ['threads', isThreadsConfigured()],
      ['x', isXConfigured()],
      ['youtube', isYouTubeConfigured()],
      ['tiktok', isTikTokConfigured()],
      ['forum', isRedditConfigured()]
    ] as [PlatformType, boolean][]).filter(([, configured]) => configured).map(([platform]) => platform),
    schedule: 'Perayapan otomatis setiap 45 detik saat topik aktif dibuka'
  }
})
