import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createError, getHeader, type H3Event } from 'h3'

export type UserRole = 'admin' | 'analyst' | 'viewer'

export interface SessionUser {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
}

export interface SessionPayload extends SessionUser {
  exp: number
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000
let devSecret: string | null = null

function sessionSecret(): string {
  const configured = process.env.NUXT_SESSION_SECRET
  if (configured && configured.length >= 32) return configured
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_SECRET belum dikonfigurasi (minimal 32 karakter).' })
  }
  // Mode development: secret acak per proses, sesi otomatis tidak berlaku setelah server restart
  devSecret ??= randomBytes(32).toString('hex')
  return devSecret
}

function sign(data: string): string {
  return createHmac('sha256', sessionSecret()).update(data).digest('base64url')
}

export function signSession(user: SessionUser): string {
  const payload: SessionPayload = { ...user, exp: Date.now() + SESSION_TTL_MS }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${data}.${sign(data)}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [data, signature] = token.split('.')
  if (!data || !signature) return null
  const expected = Buffer.from(sign(data))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload
    return payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

export function readSession(event: H3Event): SessionPayload | null {
  const header = getHeader(event, 'authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token ? verifySessionToken(token) : null
}

export function requireSession(event: H3Event, roles?: UserRole[]): SessionPayload {
  const session = event.context.session as SessionPayload | undefined ?? readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Sesi tidak valid atau kedaluwarsa. Silakan login ulang.' })
  }
  if (roles && !roles.includes(session.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Peran Anda tidak diizinkan melakukan aksi ini.' })
  }
  return session
}
