import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keywordCoverTerms, matchesQuery, parseBooleanQuery } from '../lib/issue-analysis.ts'
import { mapThreadsMedia } from '../lib/threads.ts'

test('kata kunci minimum mencakup kueri boolean dengan jumlah minimum', () => {
  assert.deepEqual(keywordCoverTerms(parseBooleanQuery('"PPN 12%" OR sembako OR ppn')), ['ppn 12%', 'sembako', 'ppn'])
  // AND: cukup cari sisi dengan kata kunci paling sedikit, sisanya disaring matchesQuery
  assert.deepEqual(keywordCoverTerms(parseBooleanQuery('"makan bergizi" AND (sekolah OR siswa) NOT hoaks')), ['makan bergizi'])
  assert.deepEqual(keywordCoverTerms(parseBooleanQuery('(ppn OR pajak) AND (sembako OR beras OR minyak)')), ['ppn', 'pajak'])
  assert.deepEqual(keywordCoverTerms(parseBooleanQuery('MBG OR mbg')), ['mbg'])
  // Sisi OR yang hanya berisi NOT tidak dapat dicari lewat kata kunci
  assert.deepEqual(keywordCoverTerms(parseBooleanQuery('ppn OR -hoaks')), [])
  assert.deepEqual(keywordCoverTerms(null), [])
})

test('pemetaan media Threads ke post analisa', () => {
  const post = mapThreadsMedia({
    id: '1789',
    text: 'Tarif  PPN 12% bikin\nharga sembako naik',
    permalink: 'https://www.threads.com/@warga/post/abc',
    timestamp: '2026-10-20T03:15:00+0000',
    username: 'warga'
  })
  assert.ok(post)
  assert.equal(post.id, 'threads_1789')
  assert.equal(post.platform, 'threads')
  assert.equal(post.authorHandle, '@warga')
  assert.equal(post.source, '@warga')
  assert.equal(post.content, 'Tarif PPN 12% bikin harga sembako naik')
  assert.equal(post.publishedAt, '2026-10-20T03:15:00.000Z')
  assert.ok(matchesQuery(parseBooleanQuery('ppn AND sembako'), post.content))
})

test('media Threads tanpa teks, username, atau timestamp valid diabaikan', () => {
  const base = { id: '1', text: 'isi', username: 'u', timestamp: '2026-10-20T03:15:00+0000' }
  assert.equal(mapThreadsMedia({ ...base, text: '' }), null)
  assert.equal(mapThreadsMedia({ ...base, username: undefined }), null)
  assert.equal(mapThreadsMedia({ ...base, timestamp: 'bukan tanggal' }), null)
})
