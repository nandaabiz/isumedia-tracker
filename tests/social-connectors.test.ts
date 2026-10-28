import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesQuery, parseBooleanQuery } from '../lib/issue-analysis.ts'
import { buildXQuery, mapXTweet, toXQuery } from '../lib/x.ts'
import { buildYouTubeQuery, decodeHtmlEntities, mapYouTubeVideo } from '../lib/youtube.ts'
import { buildTikTokQueryBody, mapTikTokVideo, quoteVideoIds } from '../lib/tiktok.ts'
import { buildRedditQuery, mapRedditPost, parseSubreddits, toRedditQuery } from '../lib/reddit.ts'

// --- X

test('kueri boolean diterjemahkan ke sintaks X', () => {
  assert.equal(
    toXQuery(parseBooleanQuery('"PPN 12%" AND (sembako OR ritel) NOT hoaks')!),
    '"ppn 12%" (sembako OR ritel) -hoaks'
  )
  assert.equal(toXQuery(parseBooleanQuery('#MBG OR @kemenkeuRI')!), '(#mbg OR @kemenkeuri)')
  assert.equal(toXQuery(parseBooleanQuery('ppn NOT (hoaks AND fitnah)')!), 'ppn -(hoaks fitnah)')
  assert.equal(buildXQuery(parseBooleanQuery('ppn OR pajak')), '(ppn OR pajak) -is:retweet lang:id')
})

test('kueri X terlalu panjang memakai kata kunci minimum; kueri negasi saja ditolak', () => {
  const query = parseBooleanQuery('ppn AND (sembako OR beras OR minyak OR gula OR telur OR daging) NOT hoaks')
  assert.equal(buildXQuery(query, 60), '(ppn) -is:retweet lang:id')
  assert.equal(buildXQuery(query, 10), null)
  assert.equal(buildXQuery(parseBooleanQuery('-hoaks')), null)
  assert.equal(buildXQuery(null), null)
})

test('pemetaan post X ke post analisa', () => {
  const users = new Map([['42', { id: '42', username: 'warga_id', name: 'Warga' }]])
  const post = mapXTweet({
    id: '1850000000000000001',
    text: 'PPN 12%  bikin\nsembako mahal',
    author_id: '42',
    created_at: '2026-10-20T03:15:00.000Z',
    public_metrics: { impression_count: 1200, like_count: 10, retweet_count: 4, reply_count: 2, quote_count: 1 }
  }, users)
  assert.ok(post)
  assert.equal(post.id, 'x_1850000000000000001')
  assert.equal(post.platform, 'x')
  assert.equal(post.url, 'https://x.com/warga_id/status/1850000000000000001')
  assert.equal(post.authorHandle, '@warga_id')
  assert.equal(post.content, 'PPN 12% bikin sembako mahal')
  assert.equal(post.reach, 1200)
  assert.equal(post.engagement, 17)
  // Penulis tidak ada di `includes.users` → tidak dapat diatribusikan
  assert.equal(mapXTweet({ id: '1', text: 'isi', author_id: '7', created_at: '2026-10-20T03:15:00Z' }, users), null)
})

// --- YouTube

test('kueri YouTube = gabungan kata kunci minimum dengan pemisah |', () => {
  assert.equal(buildYouTubeQuery(parseBooleanQuery('"makan bergizi" OR mbg')), '"makan bergizi"|mbg')
  assert.equal(buildYouTubeQuery(parseBooleanQuery('(ppn OR pajak) AND sembako NOT hoaks')), 'sembako')
  assert.equal(buildYouTubeQuery(parseBooleanQuery('-hoaks')), '')
})

test('pemetaan video YouTube beserta statistik dan entitas HTML', () => {
  assert.equal(decodeHtmlEntities('Rakyat &quot;menjerit&quot; &amp; PPN &#39;12%&#39;'), 'Rakyat "menjerit" & PPN \'12%\'')
  const post = mapYouTubeVideo(
    {
      id: { videoId: 'abc123' },
      snippet: {
        publishedAt: '2026-10-21T10:00:00Z',
        channelId: 'UC1',
        channelTitle: 'Kanal Ekonomi',
        title: 'PPN 12% &amp; harga sembako',
        description: 'Analisa dampak kenaikan tarif'
      }
    },
    { viewCount: '5400', likeCount: '120', commentCount: '30' }
  )
  assert.ok(post)
  assert.equal(post.id, 'youtube_abc123')
  assert.equal(post.platform, 'youtube')
  assert.equal(post.url, 'https://www.youtube.com/watch?v=abc123')
  assert.equal(post.title, 'PPN 12% & harga sembako')
  assert.equal(post.content, 'PPN 12% & harga sembako. Analisa dampak kenaikan tarif')
  assert.equal(post.source, 'Kanal Ekonomi')
  assert.equal(post.reach, 5400)
  assert.equal(post.engagement, 150)
  // Statistik like disembunyikan pemilik kanal → dihitung 0, bukan NaN
  assert.equal(mapYouTubeVideo({ id: { videoId: 'x' }, snippet: { publishedAt: '2026-10-21T10:00:00Z', channelTitle: 'K', title: 'T' } }, { viewCount: '9' })!.engagement, 0)
  assert.equal(mapYouTubeVideo({ id: {}, snippet: { publishedAt: '2026-10-21T10:00:00Z', channelTitle: 'K', title: 'T' } }), null)
})

// --- TikTok

test('body kueri TikTok Research API memakai tanggal UTC dan operasi IN', () => {
  const body = buildTikTokQueryBody(['ppn', 'sembako'], Date.parse('2026-10-28T01:00:00Z'))
  assert.equal(body.start_date, '20261021')
  assert.equal(body.end_date, '20261028')
  assert.deepEqual(body.query.and[1], { operation: 'IN', field_name: 'keyword', field_values: ['ppn', 'sembako'] })
  assert.deepEqual(body.query.and[0].field_values, ['ID'])
})

test('ID video TikTok int64 dibaca sebagai string tanpa kehilangan presisi', () => {
  const raw = '{"data":{"videos":[{"id":7432156789012345678,"username":"warga","create_time":1729400000}]}}'
  assert.notEqual(String(JSON.parse(raw).data.videos[0].id), '7432156789012345678')
  const video = JSON.parse(quoteVideoIds(raw)).data.videos[0]
  assert.equal(video.id, '7432156789012345678')
  assert.equal(video.create_time, 1729400000)
})

test('pemetaan video TikTok ke post analisa', () => {
  const post = mapTikTokVideo({
    id: '7432156789012345678',
    username: 'warga',
    video_description: 'Harga sembako naik gara gara PPN 12% #ppn',
    create_time: 1729400000,
    view_count: 9000,
    like_count: 300,
    comment_count: 40,
    share_count: 60
  })
  assert.ok(post)
  assert.equal(post.platform, 'tiktok')
  assert.equal(post.url, 'https://www.tiktok.com/@warga/video/7432156789012345678')
  assert.equal(post.publishedAt, new Date(1729400000 * 1000).toISOString())
  assert.equal(post.reach, 9000)
  assert.equal(post.engagement, 400)
  assert.equal(mapTikTokVideo({ id: '1', username: 'u', create_time: 1729400000 }), null)
})

// --- Forum (Reddit)

test('kueri boolean diterjemahkan ke sintaks Lucene Reddit', () => {
  assert.equal(
    toRedditQuery(parseBooleanQuery('"PPN 12%" AND (sembako OR ritel) NOT hoaks')!),
    '(("ppn 12%" AND ("sembako" OR "ritel")) AND NOT "hoaks")'
  )
  assert.equal(buildRedditQuery(parseBooleanQuery('ppn AND (sembako OR beras)'), 20), '"ppn"')
  assert.equal(buildRedditQuery(parseBooleanQuery('NOT hoaks')), null)
})

test('daftar subreddit dari env divalidasi', () => {
  assert.deepEqual(parseSubreddits(undefined), ['indonesia'])
  assert.deepEqual(parseSubreddits(' r/indonesia, indonesian ,bad/name, indonesia'), ['indonesia', 'indonesian'])
  assert.deepEqual(parseSubreddits('../etc'), ['indonesia'])
})

test('pemetaan thread Reddit ke post analisa', () => {
  const base = {
    id: 'q1w2e3',
    title: 'Pendapat soal PPN 12%?',
    selftext: 'Harga sembako di pasar\nsudah naik',
    author: 'warga_rdt',
    subreddit: 'indonesia',
    permalink: '/r/indonesia/comments/q1w2e3/pendapat_soal_ppn_12/',
    created_utc: 1729400000,
    score: 25,
    num_comments: 14
  }
  const post = mapRedditPost(base)
  assert.ok(post)
  assert.equal(post.id, 'reddit_q1w2e3')
  assert.equal(post.platform, 'forum')
  assert.equal(post.url, 'https://www.reddit.com/r/indonesia/comments/q1w2e3/pendapat_soal_ppn_12/')
  assert.equal(post.authorHandle, 'u/warga_rdt')
  assert.equal(post.content, 'Pendapat soal PPN 12%?. Harga sembako di pasar sudah naik')
  assert.equal(post.engagement, 39)
  assert.ok(matchesQuery(parseBooleanQuery('ppn AND sembako'), `${post.title} ${post.content}`))
  assert.equal(mapRedditPost({ ...base, over_18: true }), null)
  assert.equal(mapRedditPost({ ...base, author: '[deleted]' }), null)
})
