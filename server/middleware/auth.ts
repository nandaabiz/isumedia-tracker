import { defineEventHandler, getRequestURL } from 'h3'
import { requireSession } from '~/server/utils/session'

// Semua endpoint /api wajib sesi, kecuali endpoint autentikasi itu sendiri
const PUBLIC_API_PREFIXES = ['/api/auth/captcha', '/api/auth/login']

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return
  if (PUBLIC_API_PREFIXES.some(p => path.startsWith(p))) return
  event.context.session = requireSession(event)
})
