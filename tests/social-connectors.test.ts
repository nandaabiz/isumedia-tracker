import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesQuery, parseBooleanQuery } from '../lib/issue-analysis.ts'
import { buildXQuery, mapXTweet, toXQuery } from '../lib/x.ts'
import { decodeHtmlEntities } from '../lib/atom.ts'
import { buildYouTubeQuery, DEFAULT_YOUTUBE_CHANNELS, mapYouTubeVideo, parseYouTubeChannels, parseYouTubeFeed } from '../lib/youtube.ts'
import { buildTikTokQueryBody, mapTikTokVideo, quoteVideoIds } from '../lib/tiktok.ts'
import { buildRedditQuery, mapRedditPost, parseRedditFeed, parseSubreddits, toRedditQuery } from '../lib/reddit.ts'

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

// Potongan feed kanal asli (struktur feeds/videos.xml)
const YOUTUBE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>KOMPASTV</title>
 <author><name>KOMPASTV</name><uri>https://www.youtube.com/channel/UC5BMIWZe9isJXLZZWPWvBlg</uri></author>
 <entry>
  <id>yt:video:4WFhfZluSp0</id>
  <yt:videoId>4WFhfZluSp0</yt:videoId>
  <yt:channelId>UC5BMIWZe9isJXLZZWPWvBlg</yt:channelId>
  <title>PPN 12% &amp; Harga Sembako</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=4WFhfZluSp0"/>
  <author><name>KOMPAS &amp; TV</name><uri>https://www.youtube.com/channel/UC5BMIWZe9isJXLZZWPWvBlg</uri></author>
  <published>2026-10-29T07:09:34+00:00</published>
  <updated>2026-10-29T07:09:47+00:00</updated>
  <media:group>
   <media:title>PPN 12% &amp; Harga Sembako</media:title>
   <media:description>JAKARTA, KOMPAS.TV - Dampak kenaikan tarif.

#ppn</media:description>
   <media:community>
    <media:starRating count="120" average="5.00" min="1" max="5"/>
    <media:statistics views="8245"/>
   </media:community>
  </media:group>
 </entry>
 <entry><id>yt:video:tanpa-id</id><title>Rusak</title></entry>
</feed>`

test('feed kanal YouTube dipetakan sama seperti hasil search.list', () => {
  const { items, statsById } = parseYouTubeFeed(YOUTUBE_FEED)
  assert.equal(items.length, 1)
  const post = mapYouTubeVideo(items[0]!, statsById[items[0]!.id!.videoId!])
  assert.ok(post)
  assert.equal(post.url, 'https://www.youtube.com/watch?v=4WFhfZluSp0')
  assert.equal(post.title, 'PPN 12% & Harga Sembako')
  assert.equal(post.content, 'PPN 12% & Harga Sembako. JAKARTA, KOMPAS.TV - Dampak kenaikan tarif. #ppn')
  assert.equal(post.source, 'KOMPAS & TV')
  assert.equal(post.publishedAt, '2026-10-29T07:09:34.000Z')
  assert.equal(post.reach, 8245)
  assert.equal(post.engagement, 120)
})

test('daftar kanal YouTube dari env divalidasi', () => {
  assert.deepEqual(parseYouTubeChannels(undefined), DEFAULT_YOUTUBE_CHANNELS)
  assert.deepEqual(
    parseYouTubeChannels(' UCzl0OrB3-ehunyotIQvK77A, @metrotvnews, UCzl0OrB3-ehunyotIQvK77A,UC123'),
    ['UCzl0OrB3-ehunyotIQvK77A']
  )
  assert.deepEqual(parseYouTubeChannels('../etc'), DEFAULT_YOUTUBE_CHANNELS)
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

// Potongan feed search.rss asli: teks post berupa HTML ter-escape di antara penanda SC_OFF/SC_ON
const REDDIT_FEED = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><category term="indonesia" label="r/indonesia"/><title>indonesia: search results</title><entry><author><name>/u/warga_rdt</name><uri>https://www.reddit.com/user/warga_rdt</uri></author><category term="indonesia" label="r/indonesia"/><content type="html">&lt;table&gt; &lt;tr&gt;&lt;td&gt; &lt;!-- SC_OFF --&gt;&lt;div class=&quot;md&quot;&gt;&lt;p&gt;Harga sembako &amp;amp; beras&lt;/p&gt; &lt;p&gt;sudah naik&lt;/p&gt; &lt;/div&gt;&lt;!-- SC_ON --&gt; &amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/warga_rdt&quot;&gt; /u/warga_rdt &lt;/a&gt; &lt;/td&gt;&lt;/tr&gt;&lt;/table&gt;</content><id>t3_q1w2e3</id><link href="https://www.reddit.com/r/indonesia/comments/q1w2e3/pendapat_soal_ppn_12/" /><updated>2026-10-28T23:20:42+00:00</updated><published>2026-10-28T23:20:42+00:00</published><title>Pendapat soal PPN 12%&#39;?</title></entry><entry><author><name>/u/link_only</name></author><category term="indonesia" label="r/indonesia"/><content type="html">&lt;table&gt;&lt;/table&gt;</content><id>t3_a1b2c3</id><link href="https://www.reddit.com/r/indonesia/comments/a1b2c3/berita/" /><published>2026-10-28T20:00:00+00:00</published><title>Berita PPN</title></entry><entry><id>t3_evil</id><link href="https://evil.example/r/indonesia/comments/x/" /><published>2026-10-28T20:00:00+00:00</published><title>Bukan Reddit</title></entry></feed>`

test('feed search.rss Reddit dipetakan ke post analisa tanpa metrik', () => {
  const raw = parseRedditFeed(REDDIT_FEED)
  // Entry dengan link di luar www.reddit.com dibuang
  assert.equal(raw.length, 2)
  const post = mapRedditPost(raw[0]!)
  assert.ok(post)
  assert.equal(post.id, 'reddit_q1w2e3')
  assert.equal(post.url, 'https://www.reddit.com/r/indonesia/comments/q1w2e3/pendapat_soal_ppn_12/')
  assert.equal(post.authorHandle, 'u/warga_rdt')
  assert.equal(post.title, "Pendapat soal PPN 12%'?")
  assert.equal(post.content, "Pendapat soal PPN 12%'?. Harga sembako & beras sudah naik")
  assert.equal(post.publishedAt, '2026-10-28T23:20:42.000Z')
  assert.equal(post.engagement, 0)
  // Post tautan tanpa teks: konten = judul
  assert.equal(mapRedditPost(raw[1]!)!.content, 'Berita PPN')
})
