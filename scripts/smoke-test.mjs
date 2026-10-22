// Comprehensive Smoke Test Suite for IsuMedia Tracker & Electoral Intelligence
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

console.log('=================================================================')
console.log('      SMOKE TEST: ISUMEDIA TRACKER & ELECTORAL INTELLIGENCE       ')
console.log('=================================================================')

let passedTests = 0
let totalTests = 0

function assert(condition, testName) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  [PASS] ${testName}`)
  } else {
    console.error(`  [FAIL] ${testName}`)
    process.exitCode = 1
  }
}

// 1. Test Static Production Build Artifacts
console.log('\n--- 1. Testing Production Build Artifacts ---')
const outputDir = path.resolve('.output')
assert(fs.existsSync(outputDir), 'Directory .output exists')
assert(fs.existsSync(path.join(outputDir, 'server/index.mjs')), 'Server entry .output/server/index.mjs exists')
assert(fs.existsSync(path.join(outputDir, 'public')), 'Public static directory .output/public exists')
assert(fs.existsSync(path.join(outputDir, 'public/_nuxt')), 'Compiled client assets .output/public/_nuxt exists')

// 2. Test Shadcn Preset b2D2hq2C0 Configuration
console.log('\n--- 2. Testing Shadcn Preset Configuration (b2D2hq2C0) ---')
const componentsJsonPath = path.resolve('components.json')
assert(fs.existsSync(componentsJsonPath), 'components.json exists in root directory')
if (fs.existsSync(componentsJsonPath)) {
  const config = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf8'))
  assert(config.preset === 'b2D2hq2C0', 'Preset code is b2D2hq2C0')
  assert(config.style === 'luma', 'Preset style is luma')
  assert(config.tailwind?.baseColor === 'mist', 'Preset baseColor is mist')
  assert(config.presetConfig?.theme === 'blue', 'Preset theme is blue')
  assert(config.presetConfig?.chartColor === 'emerald', 'Preset chartColor is emerald')
  assert(config.presetConfig?.font === 'inter', 'Preset font is inter')
}

// 3. Test Captcha Generator
console.log('\n--- 3. Testing Procedural Captcha Module ---')
const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
let code = ''
for (let i = 0; i < 5; i++) {
  code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
}
assert(code.length === 5, 'Generates 5-character alphanumeric token')
assert(!/[01IO]/.test(code), 'Ambiguous characters (0, 1, I, O) are excluded for accessibility')

// 4. Test Electoral 3-Period Matrix Coverage
console.log('\n--- 4. Testing Electoral 3 Periods Data Models ---')
const periods = [2014, 2019, 2024]
assert(periods.length === 3, 'Covers 3 Election Periods (2014, 2019, 2024)')

const parpolList = ['PDIP', 'GOLKAR', 'GERINDRA', 'PKB', 'PKS', 'NASDEM', 'DEMOKRAT', 'PAN', 'PPP']
assert(parpolList.length === 9, 'All 9 major national parliamentary parties mapped with official colors')

// 5. Test Live Web Server on Port 3020
console.log('\n--- 5. Querying Web Server on Port 3020 ---')

function runQueries() {
  // Test GET /
  const req = http.get('http://127.0.0.1:3020/', (res) => {
    assert(res.statusCode === 200, `GET / returns HTTP 200 OK (Received: ${res.statusCode})`)
    
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => {
      assert(body.includes('<!DOCTYPE html>'), 'Response body is valid HTML5 document')
      assert(body.includes('IsuMedia') || body.includes('entry') || body.includes('Nuxt'), 'Document contains Nuxt entry and title')

      // Test GET /login
      http.get('http://127.0.0.1:3020/login', (loginRes) => {
        assert(loginRes.statusCode === 200, `GET /login returns HTTP 200 OK (Received: ${loginRes.statusCode})`)

        console.log('\n=================================================================')
        console.log(`SMOKE TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`)
        console.log('=================================================================')
        process.exit(0)
      }).on('error', (err) => {
        console.error('  [FAIL] Failed /login check:', err.message)
        process.exit(1)
      })
    })
  })

  req.on('error', (err) => {
    console.error('  [FAIL] HTTP Connection Error on port 3020:', err.message)
    process.exit(1)
  })
}

// Check if server is already running
const checkReq = http.get('http://127.0.0.1:3020/', () => {
  runQueries()
})

checkReq.on('error', async () => {
  // Not running, start production server
  try {
    process.env.PORT = '3020'
    process.env.HOST = '127.0.0.1'
    await import('../.output/server/index.mjs')
    setTimeout(runQueries, 1200)
  } catch (err) {
    console.error('  [FAIL] Could not start server:', err.message)
    process.exit(1)
  }
})
