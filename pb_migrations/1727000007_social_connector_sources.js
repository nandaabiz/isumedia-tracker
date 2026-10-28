/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 7: Deskripsi & config media_sources X, YouTube, TikTok, dan forum mengikuti konektor API riil
 * (sebelumnya deskripsi rencana dari seed awal). Nilai platform sudah ada sejak migration 3.
 */
const SOURCES = {
  x: {
    name: "X / Twitter (Post Publik)",
    description: "Pencarian post publik 7 hari terakhir via X API v2 recent search (tanpa retweet, bahasa Indonesia)",
    config: { endpoint: "tweets/search/recent", window_days: 7, exclude_retweets: true, language: "id" }
  },
  youtube: {
    name: "YouTube (Video Publik)",
    description: "Pencarian video publik terbaru wilayah Indonesia via YouTube Data API v3, lengkap dengan statistik tayangan",
    config: { endpoint: "search.list", window_days: 7, region_code: "ID", language: "id" }
  },
  tiktok: {
    name: "TikTok (Video Publik)",
    description: "Kueri deskripsi video publik wilayah Indonesia via TikTok Research API",
    config: { endpoint: "research/video/query", window_days: 7, region_code: "ID" }
  },
  forum: {
    name: "Forum Publik (Reddit)",
    description: "Pencarian thread publik subreddit Indonesia via Reddit API (Kaskus tidak menyediakan API publik)",
    config: { endpoint: "search", window_days: 7, subreddits: ["indonesia"] }
  }
};

const PREVIOUS = {
  x: {
    name: "X / Twitter (Akun Publik)",
    description: "Pemantauan cuitan publik, retweets, quotes, dan tagar trending nasional",
    config: { exclude_private: true, language: "id" }
  },
  youtube: {
    name: "YouTube (Video & Komentar Publik)",
    description: "Transkrip video berita, podcast politik, dan sentimen komentar teratas",
    config: { min_views_threshold: 1000 }
  },
  tiktok: {
    name: "TikTok (Video & Deskripsi Publik)",
    description: "Analisis narasi video pendek, suara latar (audio template), dan tagar viral",
    config: { geo_filter: "ID" }
  },
  forum: {
    name: "Forum Diskusi Publik",
    description: "Thread diskusi mendalam di Kaskus, Reddit ID, dan kanal terbuka lainnya",
    config: { rate_limit: 60 }
  }
};

function applySources(db, values) {
  const dao = new Dao(db);
  for (const code of Object.keys(values)) {
    let rec;
    try {
      rec = dao.findFirstRecordByData("media_sources", "code", code);
    } catch (_) {
      continue;
    }
    rec.set("name", values[code].name);
    rec.set("description", values[code].description);
    rec.set("config", values[code].config);
    dao.saveRecord(rec);
  }
}

migrate((db) => applySources(db, SOURCES), (db) => applySources(db, PREVIOUS));
