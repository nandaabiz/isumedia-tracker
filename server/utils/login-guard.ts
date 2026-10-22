/**
 * FR-0.2.4: penguncian sementara setelah 5 kegagalan login berturut-turut.
 * Disimpan di memori proses: cukup untuk deployment satu instance; pakai Redis bila diskalakan horizontal.
 */
export const MAX_FAILED_ATTEMPTS = 5
export const LOCKOUT_MS = 5 * 60 * 1000

interface GuardState {
  failures: number
  lockedUntil: number
}

const guards = new Map<string, GuardState>()

function key(ip: string, identifier: string): string {
  return `${ip}|${identifier.trim().toLowerCase()}`
}

export function lockoutRemainingMs(ip: string, identifier: string, now = Date.now()): number {
  return Math.max(0, (guards.get(key(ip, identifier))?.lockedUntil ?? 0) - now)
}

/** Mencatat kegagalan; mengembalikan sisa percobaan dan waktu kunci (0 bila belum terkunci). */
export function registerFailure(ip: string, identifier: string, now = Date.now()): { attemptsLeft: number; lockedUntil: number } {
  const k = key(ip, identifier)
  const state = guards.get(k) ?? { failures: 0, lockedUntil: 0 }
  state.failures += 1
  if (state.failures >= MAX_FAILED_ATTEMPTS) {
    state.failures = 0
    state.lockedUntil = now + LOCKOUT_MS
  }
  guards.set(k, state)

  if (guards.size > 5000) {
    for (const [k2, s] of guards) if (s.lockedUntil < now && s.failures === 0) guards.delete(k2)
  }
  return { attemptsLeft: MAX_FAILED_ATTEMPTS - state.failures, lockedUntil: state.lockedUntil }
}

export function clearFailures(ip: string, identifier: string) {
  guards.delete(key(ip, identifier))
}
