import { defineEventHandler, setResponseHeader } from 'h3'
import { generateCaptcha } from '~/server/utils/captcha'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return generateCaptcha(5)
})
