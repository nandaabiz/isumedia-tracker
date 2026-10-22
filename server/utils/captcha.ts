/**
 * Procedural SVG Captcha Generator & Validator (server-side)
 * Independent of external third-party services, privacy-preserving, works offline/on-premise.
 * Kode jawaban hanya disimpan di memori server sehingga tidak bisa dibaca dari browser.
 */
import { randomInt, randomUUID } from 'node:crypto'

export interface CaptchaChallenge {
  id: string
  svg: string
  expiresAt: number
}

// In-memory store for active captcha tokens (cleaned up periodically)
const captchaStore = new Map<string, { code: string; expiresAt: number }>()

const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Removed easily confused characters: 0, 1, I, O

export function generateCaptcha(length = 5): CaptchaChallenge {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARACTERS.charAt(randomInt(CHARACTERS.length))
  }

  const id = randomUUID()
  const expiresAt = Date.now() + 3 * 60 * 1000 // 3 minutes expiration

  captchaStore.set(id, { code: code.toUpperCase(), expiresAt })

  // Clean old entries
  if (captchaStore.size > 200) {
    const now = Date.now()
    for (const [key, val] of captchaStore.entries()) {
      if (val.expiresAt < now) captchaStore.delete(key)
    }
  }

  const width = 160
  const height = 54

  // Noise lines
  let noiseLines = ''
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width
    const y1 = Math.random() * height
    const x2 = Math.random() * width
    const y2 = Math.random() * height
    const stroke = i % 2 === 0 ? '#C59B27' : '#7E2032'
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.2" opacity="0.4" />`
  }

  // Noise dots
  let noiseDots = ''
  for (let i = 0; i < 24; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const r = Math.random() * 1.8 + 0.8
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#9E2A40" opacity="0.35" />`
  }

  // Characters with rotation and slight vertical shift
  let textElements = ''
  const charSpacing = width / (length + 1)

  for (let i = 0; i < length; i++) {
    const char = code[i]
    const x = charSpacing * (i + 0.8) + (Math.random() * 4 - 2)
    const y = 35 + (Math.random() * 6 - 3)
    const rot = Math.random() * 24 - 12
    const color = i % 2 === 0 ? '#641927' : '#7E2032'

    textElements += `
      <text 
        x="${x}" 
        y="${y}" 
        fill="${color}" 
        font-family="monospace, serif" 
        font-size="28" 
        font-weight="bold" 
        transform="rotate(${rot} ${x} ${y})"
        letter-spacing="2"
      >${char}</text>
    `
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="rounded select-none border border-parchment-300 dark:border-monastic-700 bg-parchment-100 dark:bg-monastic-800">
      <rect width="100%" height="100%" fill="#FAF8F5"/>
      ${noiseLines}
      ${noiseDots}
      ${textElements}
    </svg>
  `.trim()

  return { id, svg, expiresAt }
}

export function verifyCaptcha(id: string, userInput: string): { valid: boolean; reason?: string } {
  if (!id || !userInput) {
    return { valid: false, reason: 'Kode captcha wajib diisi.' }
  }

  const record = captchaStore.get(id)
  if (!record) {
    return { valid: false, reason: 'Captcha telah kedaluwarsa. Silakan muat ulang.' }
  }

  captchaStore.delete(id) // One-time use

  if (Date.now() > record.expiresAt) {
    return { valid: false, reason: 'Captcha telah kedaluwarsa. Silakan muat ulang.' }
  }

  if (record.code.toUpperCase() !== userInput.trim().toUpperCase()) {
    return { valid: false, reason: 'Kode captcha tidak cocok.' }
  }

  return { valid: true }
}
