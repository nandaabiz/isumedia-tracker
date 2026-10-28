/**
 * Cache hasil API sosial di memori proses: cukup untuk satu instance (sama seperti login lockout).
 * Sinkronisasi klien berjalan tiap 45 detik, sementara kuota API pihak ketiga dihitung per request.
 */
export function createTtlCache<T>(ttlMs: number) {
  const store = new Map<string, { expiresAt: number; value: T }>()
  return {
    get(key: string): T | undefined {
      const hit = store.get(key)
      return hit && hit.expiresAt > Date.now() ? hit.value : undefined
    },
    set(key: string, value: T) {
      for (const [k, v] of store) if (v.expiresAt <= Date.now()) store.delete(k)
      store.set(key, { expiresAt: Date.now() + ttlMs, value })
    }
  }
}
