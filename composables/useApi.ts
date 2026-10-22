export const SESSION_STORAGE_KEY = 'isumedia_session'

export function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw).token ?? null) : null
  } catch {
    return null
  }
}

/**
 * `$fetch` yang menyertakan token sesi; respons 401 membersihkan sesi dan mengarahkan ke /login.
 */
export const apiFetch = $fetch.create({
  onRequest({ options }) {
    const token = readStoredToken()
    if (!token) return
    const headers = new Headers(options.headers as HeadersInit | undefined)
    headers.set('Authorization', `Bearer ${token}`)
    options.headers = headers
  },
  onResponseError({ response }) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      if (window.location.pathname !== '/login') navigateTo('/login')
    }
  }
})
