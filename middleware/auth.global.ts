import { hasStoredSession } from '~/composables/useAuth'

// Callback OAuth dibuka dari redirect penyedia, sering sebelum login; pengalihan ke /login akan membuang `?code=`
const PUBLIC_PATHS = ['/oauth/threads']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC_PATHS.includes(to.path)) return

  // Validitas token tetap diperiksa server pada setiap panggilan /api; di sini hanya gate navigasi
  if (to.path === '/login') {
    if (hasStoredSession()) return navigateTo('/')
    return
  }

  if (!hasStoredSession()) {
    return navigateTo('/login')
  }
})
