import { defineEventHandler } from 'h3'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'
import { isThreadsConfigured } from '~/server/utils/threads'

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
      { name: 'Threads', type: 'Threads API keyword_search (post publik)', status: isThreadsConfigured() ? 'Token terpasang' : 'Belum dikonfigurasi' }
    ],
    schedule: 'Perayapan otomatis setiap 45 detik saat topik aktif dibuka'
  }
})
