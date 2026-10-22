import { ref, computed } from 'vue'
import { SESSION_STORAGE_KEY } from '~/composables/useApi'

export interface UserAccount {
  id: string
  username: string
  name: string
  email: string
  role: 'admin' | 'analyst' | 'viewer'
  avatar?: string
}

interface StoredSession {
  user: UserAccount
  token: string
}

export interface CaptchaChallenge {
  id: string
  svg: string
  expiresAt: number
}

const currentUser = ref<UserAccount | null>(null)
const isInitialized = ref(false)

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Format sesi lama (tanpa token) tidak lagi diterima
    return parsed?.token && parsed?.user ? parsed : null
  } catch {
    return null
  }
}

export function hasStoredSession(): boolean {
  return typeof window !== 'undefined' && readStoredSession() !== null
}

export function useAuth() {
  const router = useRouter()

  function initAuth() {
    if (import.meta.server || isInitialized.value) return
    const session = readStoredSession()
    if (session) currentUser.value = session.user
    else localStorage.removeItem(SESSION_STORAGE_KEY)
    isInitialized.value = true
  }

  const isAuthenticated = computed(() => !!currentUser.value)
  const canManageTopics = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'analyst')

  function fetchCaptcha(): Promise<CaptchaChallenge> {
    return $fetch<CaptchaChallenge>('/api/auth/captcha')
  }

  async function login(
    identifier: string,
    password: string,
    captchaId: string,
    captchaInput: string
  ): Promise<{ success: boolean; error?: string; retryAfterSec?: number }> {
    try {
      const res = await $fetch<StoredSession>('/api/auth/login', {
        method: 'POST',
        body: { identifier, password, captchaId, captchaInput }
      })
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(res))
      currentUser.value = res.user
      isInitialized.value = true
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err?.data?.statusMessage || err?.statusMessage || 'Autentikasi gagal. Periksa koneksi ke server.',
        retryAfterSec: err?.data?.data?.retryAfterSec
      }
    }
  }

  function logout() {
    currentUser.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
    router.push('/login')
  }

  return {
    currentUser,
    isAuthenticated,
    canManageTopics,
    initAuth,
    fetchCaptcha,
    login,
    logout
  }
}
