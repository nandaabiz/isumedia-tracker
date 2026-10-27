import { defineEventHandler, readBody, createError } from 'h3'
import { parseBooleanQuery } from '~/lib/issue-analysis'
import { getAuthenticatedServerPb } from '~/server/utils/pocketbase'
import { requireSession } from '~/server/utils/session'

const CATEGORIES = ['Ekonomi', 'Politik', 'Sosial & Hukum', 'Lingkungan', 'Kesejahteraan']

export default defineEventHandler(async (event) => {
  // RBAC FR-0.1.3: Viewer hanya membaca
  requireSession(event, ['admin', 'analyst'])
  const body = await readBody(event).catch(() => ({}))
  const title = String(body?.title || '').trim()
  const category = CATEGORIES.includes(body?.category) ? body.category : 'Ekonomi'
  const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords.map(String).filter(Boolean) : [title]
  const query = String(body?.query || '').trim()
  const entityFilter: string[] = Array.isArray(body?.entityFilter) ? body.entityFilter.map(String).filter(Boolean) : []

  if (title.length < 3) {
    throw createError({ statusCode: 422, statusMessage: 'Judul isu minimal 3 karakter.' })
  }
  if (query) {
    try {
      parseBooleanQuery(query)
    } catch (err: any) {
      throw createError({ statusCode: 422, statusMessage: `Kueri boolean tidak valid: ${err.message}` })
    }
  }

  const pb = await getAuthenticatedServerPb()
  if (!pb) {
    return {
      success: true,
      fallback: true,
      message: 'PocketBase belum tersambung, topik disimpan di cache lokal peramban.'
    }
  }

  try {
    const record = await pb.collection('monitored_topics').create({
      title,
      category,
      keywords,
      query,
      entity_filter: entityFilter,
      is_trending: false,
      trend_velocity: '',
      total_mentions: 0,
      status: 'active',
      media_filter: ['news', 'threads', 'x', 'youtube', 'tiktok', 'forum'],
      origin_timestamp: '',
      summary: String(body?.summary || `Pemantauan isu: ${title}`),
      pro_arguments: '',
      contra_arguments: ''
    })
    return { success: true, id: record.id, record }
  } catch (err: any) {
    console.error('[Topics Create Error]:', err?.message, err?.data)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan topik ke database.' })
  }
})
