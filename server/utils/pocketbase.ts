import PocketBase from 'pocketbase'

let serverPbInstance: PocketBase | null = null
let authPromise: Promise<boolean> | null = null
let missingCredentialsWarned = false

/**
 * Instance PocketBase server-side yang login dengan akun servis dari env
 * (`PB_SERVICE_EMAIL` / `PB_SERVICE_PASSWORD`). Mengembalikan null bila PocketBase mati
 * atau kredensial belum dikonfigurasi, sehingga pemanggil berjalan dalam mode tanpa persistensi.
 */
export async function getAuthenticatedServerPb(): Promise<PocketBase | null> {
  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8290'
  const email = process.env.PB_SERVICE_EMAIL
  const password = process.env.PB_SERVICE_PASSWORD

  if (!email || !password) {
    if (!missingCredentialsWarned) {
      console.warn('[PocketBase] PB_SERVICE_EMAIL / PB_SERVICE_PASSWORD belum diset; persistensi server dinonaktifkan.')
      missingCredentialsWarned = true
    }
    return null
  }

  if (!serverPbInstance) {
    serverPbInstance = new PocketBase(pbUrl)
    serverPbInstance.autoCancellation(false)
  }

  try {
    const health = await fetch(`${pbUrl}/api/health`, { signal: AbortSignal.timeout(1200) })
    if (!health.ok) return null
  } catch {
    return null
  }

  if (serverPbInstance.authStore.isValid) {
    return serverPbInstance
  }

  authPromise ??= serverPbInstance.collection('users').authWithPassword(email, password)
    .then(() => true)
    .catch((err: any) => {
      console.warn('[Server PocketBase Auth Warning]:', err?.message || err)
      return false
    })
    .finally(() => {
      authPromise = null
    })

  await authPromise
  return serverPbInstance.authStore.isValid ? serverPbInstance : null
}
