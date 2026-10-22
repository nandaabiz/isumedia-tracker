import { defineEventHandler } from 'h3'
import { requireSession } from '~/server/utils/session'

export default defineEventHandler((event) => {
  const { exp, ...user } = requireSession(event)
  return { user, expiresAt: exp }
})
