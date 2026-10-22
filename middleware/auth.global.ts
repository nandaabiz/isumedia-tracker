import { hasStoredSession } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Validitas token tetap diperiksa server pada setiap panggilan /api; di sini hanya gate navigasi
  if (to.path === '/login') {
    if (hasStoredSession()) return navigateTo('/')
    return
  }

  if (!hasStoredSession()) {
    return navigateTo('/login')
  }
})
