import { defineEventHandler } from 'h3'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'

export default defineEventHandler(async () => {
  try {
    const pb = await getAuthenticatedServerPb()
    if (!pb) {
      return {
        success: true,
        topics: [],
        online: false
      }
    }

    const records = await pb.collection('monitored_topics').getFullList({
      sort: '-created',
      filter: "status != 'archived'"
    })

    return {
      success: true,
      topics: records,
      online: true
    }
  } catch (err: any) {
    console.warn('[Topics List Error]:', err?.message)
    return {
      success: false,
      topics: [],
      error: err?.message
    }
  }
})
