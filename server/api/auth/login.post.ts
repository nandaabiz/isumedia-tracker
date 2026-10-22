import { defineEventHandler, readBody, createError, getRequestIP } from 'h3'
import PocketBase, { ClientResponseError } from 'pocketbase'
import { verifyCaptcha } from '~/server/utils/captcha'
import { clearFailures, lockoutRemainingMs, registerFailure, LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from '~/server/utils/login-guard'
import { signSession, type SessionUser, type UserRole } from '~/server/utils/session'

// Akun demo hanya untuk mode offline (PocketBase mati) dan hanya aktif bila NUXT_DEMO_LOGIN mengizinkan.
// Kata sandi sama dengan seed migrasi PocketBase dan tidak pernah dikirim ke bundle client.
const DEMO_ACCOUNTS: { user: SessionUser; password: string; aliases: string[] }[] = [
  {
    user: { id: 'usr_admin01', username: 'baskoro_lead', name: 'Baskoro Adiwijaya', email: 'admin@isumedia.id', role: 'admin' },
    password: 'IsuMedia@2026',
    aliases: ['admin', 'baskoro_lead']
  },
  {
    user: { id: 'usr_analyst01', username: 'klarisa_intel', name: 'Klarisa Utami', email: 'analyst@isumedia.id', role: 'analyst' },
    password: 'Analyst@2026',
    aliases: ['analyst', 'klarisa_intel']
  }
]

const ROLES: UserRole[] = ['admin', 'analyst', 'viewer']

function demoLoginEnabled(): boolean {
  const flag = process.env.NUXT_DEMO_LOGIN
  if (flag !== undefined) return flag === 'true'
  return process.env.NODE_ENV !== 'production'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const identifier = String(body?.identifier || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  if (!identifier || !password) {
    throw createError({ statusCode: 422, statusMessage: 'Email/username dan kata sandi wajib diisi.' })
  }

  const locked = lockoutRemainingMs(ip, identifier)
  if (locked > 0) {
    throw createError({
      statusCode: 429,
      statusMessage: `Login dikunci sementara. Coba lagi dalam ${Math.ceil(locked / 1000)} detik.`,
      data: { retryAfterSec: Math.ceil(locked / 1000) }
    })
  }

  const fail = (reason: string): never => {
    const { attemptsLeft, lockedUntil } = registerFailure(ip, identifier)
    if (lockedUntil > Date.now()) {
      throw createError({
        statusCode: 429,
        statusMessage: `${reason} Login dikunci ${LOCKOUT_MS / 60000} menit karena ${MAX_FAILED_ATTEMPTS} kali gagal berturut-turut.`,
        data: { retryAfterSec: Math.ceil(LOCKOUT_MS / 1000) }
      })
    }
    throw createError({ statusCode: 401, statusMessage: `${reason} Sisa percobaan: ${attemptsLeft}.` })
  }

  const captcha = verifyCaptcha(String(body?.captchaId || ''), String(body?.captchaInput || ''))
  if (!captcha.valid) fail(captcha.reason || 'Kode captcha salah.')

  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8290'
  const pb = new PocketBase(pbUrl)
  pb.autoCancellation(false)

  let user: SessionUser | null = null
  try {
    const auth = await pb.collection('users').authWithPassword(identifier, password)
    const r = auth.record
    user = {
      id: r.id,
      username: r.username || r.email,
      name: r.name || r.username || r.email,
      email: r.email,
      role: ROLES.includes(r.role) ? r.role : 'viewer'
    }
  } catch (err) {
    const offline = err instanceof ClientResponseError && err.status === 0
    if (!offline) fail('Kombinasi email/username atau kata sandi salah.')

    if (!demoLoginEnabled()) {
      throw createError({ statusCode: 503, statusMessage: 'Layanan autentikasi (PocketBase) tidak tersedia.' })
    }
    const demo = DEMO_ACCOUNTS.find(a => a.user.email === identifier || a.aliases.includes(identifier))
    if (!demo || demo.password !== password) fail('Kombinasi email/username atau kata sandi salah.')
    user = demo!.user
  }

  clearFailures(ip, identifier)
  return { user, token: signSession(user!) }
})
