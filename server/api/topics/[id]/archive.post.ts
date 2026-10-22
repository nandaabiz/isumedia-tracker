import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'
import { requireSession } from '~/server/utils/session'

const PB_RECORD_ID = /^[a-z0-9]{15}$/

// Arsip (bukan hapus permanen) agar riwayat media_posts topik tetap utuh
export default defineEventHandler(async (event) => {
  requireSession(event, ['admin', 'analyst'])
  const id = getRouterParam(event, 'id') || ''
  if (!PB_RECORD_ID.test(id)) {
    throw createError({ statusCode: 422, statusMessage: 'ID topik tidak valid.' })
  }
  const pb = await getAuthenticatedServerPb()
  if (!pb) return { success: true, fallback: true }
  try {
    await pb.collection('monitored_topics').update(id, { status: 'archived' })
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: err?.status === 404 ? 404 : 500, statusMessage: 'Gagal mengarsipkan topik.' })
  }
})
