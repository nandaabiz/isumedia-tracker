import { defineEventHandler } from 'h3'
import { getLatestTopics } from '~/server/utils/latest-issues'

export default defineEventHandler(async () => {
  const { topics, errors, cached } = await getLatestTopics()
  if (!topics.length) return { success: false, topics: [], error: errors.join('; ') || 'Tidak ada tema terdeteksi' }
  return { success: true, topics, cached }
})
