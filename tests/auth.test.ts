import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signSession, verifySessionToken } from '../server/utils/session.ts'
import { clearFailures, lockoutRemainingMs, registerFailure, MAX_FAILED_ATTEMPTS } from '../server/utils/login-guard.ts'

const user = { id: 'u1', username: 'klarisa', name: 'Klarisa', email: 'k@isumedia.id', role: 'analyst' as const }

test('token sesi valid dapat diverifikasi', () => {
  const token = signSession(user)
  const payload = verifySessionToken(token)
  assert.equal(payload?.email, user.email)
  assert.equal(payload?.role, 'analyst')
})

test('token yang diubah (eskalasi role) ditolak', () => {
  const [data, signature] = signSession(user).split('.')
  const tampered = JSON.parse(Buffer.from(data, 'base64url').toString())
  tampered.role = 'admin'
  const forged = `${Buffer.from(JSON.stringify(tampered)).toString('base64url')}.${signature}`
  assert.equal(verifySessionToken(forged), null)
  assert.equal(verifySessionToken('bukan-token'), null)
})

test('lockout setelah 5 kegagalan berturut-turut, reset setelah sukses', () => {
  const ip = '10.0.0.1'
  for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
    assert.equal(registerFailure(ip, 'a@b.id').attemptsLeft, MAX_FAILED_ATTEMPTS - i)
  }
  assert.equal(lockoutRemainingMs(ip, 'a@b.id'), 0)
  registerFailure(ip, 'a@b.id')
  assert.ok(lockoutRemainingMs(ip, 'A@B.id') > 0)
  assert.equal(lockoutRemainingMs('10.0.0.2', 'a@b.id'), 0)
  clearFailures(ip, 'a@b.id')
  assert.equal(lockoutRemainingMs(ip, 'a@b.id'), 0)
})
