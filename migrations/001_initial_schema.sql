-- =====================================================================
-- Migration 001: Initial Schema DDL (SQLite Compatible)
-- Project: IsuMedia Tracker & Electoral Intelligence Platform
-- References: docs/PRD.md (Section 4: Arsitektur Data PocketBase)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. users (PocketBase System / Auth Collection with Custom Role)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    emailVisibility INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    name TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    role TEXT CHECK (role IN ('admin', 'analyst', 'viewer')) DEFAULT 'viewer',
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);

-- 2. media_sources (Konfigurasi Sumber Media Pemantauan)
CREATE TABLE IF NOT EXISTS media_sources (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL CHECK (code IN ('news', 'x', 'youtube', 'tiktok', 'facebook', 'forum')),
    is_active INTEGER DEFAULT 1,
    description TEXT,
    icon TEXT,
    config TEXT, -- JSON config
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_sources_code ON media_sources (code);

-- 3. electoral_regions (Data 38 Provinsi & 514 Kabupaten/Kota)
CREATE TABLE IF NOT EXISTS electoral_regions (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Kode BPS/Kemendagri (e.g. '31', '32')
    name TEXT NOT NULL,
    island TEXT CHECK (island IN ('Jawa', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Bali-Nusa', 'Maluku-Papua')),
    level TEXT NOT NULL CHECK (level IN ('province', 'city_regency')),
    parent_id TEXT REFERENCES electoral_regions(id) ON DELETE SET NULL,
    geojson_key TEXT,
    coordinates TEXT, -- JSON [lat, lng]
    dpt_2014 INTEGER DEFAULT 0,
    dpt_2019 INTEGER DEFAULT 0,
    dpt_2024 INTEGER DEFAULT 0,
    turnout_2014 REAL DEFAULT 0.0,
    turnout_2019 REAL DEFAULT 0.0,
    turnout_2024 REAL DEFAULT 0.0,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_regions_code ON electoral_regions (code);
CREATE INDEX IF NOT EXISTS idx_regions_level ON electoral_regions (level);
CREATE INDEX IF NOT EXISTS idx_regions_island ON electoral_regions (island);

-- 4. election_presidential (Hasil Pilpres 2014, 2019, 2024)
CREATE TABLE IF NOT EXISTS election_presidential (
    id TEXT PRIMARY KEY NOT NULL,
    region_id TEXT NOT NULL REFERENCES electoral_regions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year IN (2014, 2019, 2024)),
    total_valid_votes INTEGER DEFAULT 0,
    candidates TEXT NOT NULL, -- JSON [{name, parties, votes, percentage, colorHex, isWinner}]
    winner_candidate TEXT,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_presidential_region_year ON election_presidential (region_id, year);

-- 5. election_legislative (Hasil Suara Per Parpol Pileg DPR RI 3 Periode)
CREATE TABLE IF NOT EXISTS election_legislative (
    id TEXT PRIMARY KEY NOT NULL,
    region_id TEXT NOT NULL REFERENCES electoral_regions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year IN (2014, 2019, 2024)),
    party_code TEXT NOT NULL,
    party_name TEXT,
    vote_count INTEGER DEFAULT 0,
    vote_percentage REAL DEFAULT 0.0,
    seats_won INTEGER DEFAULT 0,
    is_winner INTEGER DEFAULT 0,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_legislative_region_year ON election_legislative (region_id, year);
CREATE INDEX IF NOT EXISTS idx_legislative_party ON election_legislative (party_code);

-- 6. voter_profiles (Skor Loyalis, Pedersen Swing Index & Karakteristik Wilayah)
CREATE TABLE IF NOT EXISTS voter_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    region_id TEXT UNIQUE NOT NULL REFERENCES electoral_regions(id) ON DELETE CASCADE,
    loyalty_party TEXT,
    loyalty_score REAL DEFAULT 0.0,
    swing_index REAL DEFAULT 0.0, -- Pedersen Volatility Index
    classification TEXT NOT NULL CHECK (classification IN ('stronghold', 'battleground', 'leaning_loyal', 'unstable', 'volatile')),
    dominant_demography TEXT,
    demography TEXT, -- JSON {urbanPercentage, genZAndMillennialPercentage, ...}
    key_influencing_factors TEXT, -- JSON array
    historical_narrative TEXT,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voter_profiles_region ON voter_profiles (region_id);
CREATE INDEX IF NOT EXISTS idx_voter_profiles_class ON voter_profiles (classification);

-- 7. election_news_archive (Arsip Berita Penting Pemilu 3 Periode)
CREATE TABLE IF NOT EXISTS election_news_archive (
    id TEXT PRIMARY KEY NOT NULL,
    year INTEGER NOT NULL CHECK (year IN (2014, 2019, 2024)),
    date TEXT NOT NULL,
    headline TEXT NOT NULL,
    source TEXT NOT NULL,
    province_affected TEXT,
    region_id TEXT REFERENCES electoral_regions(id) ON DELETE SET NULL,
    impact_description TEXT,
    sentiment_direction TEXT NOT NULL CHECK (sentiment_direction IN ('swung_to_challenger', 'reinforced_incumbent', 'split_vote')),
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_news_archive_year ON election_news_archive (year);
CREATE INDEX IF NOT EXISTS idx_news_archive_sentiment ON election_news_archive (sentiment_direction);

-- 8. monitored_topics (Daftar Isu Yang Dipantau)
CREATE TABLE IF NOT EXISTS monitored_topics (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Ekonomi', 'Politik', 'Sosial & Hukum', 'Lingkungan', 'Kesejahteraan')),
    keywords TEXT NOT NULL, -- JSON array
    is_trending INTEGER DEFAULT 0,
    trend_velocity TEXT,
    total_mentions INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'archived')) DEFAULT 'active',
    media_filter TEXT, -- JSON array ['news', 'x', 'youtube']
    origin_timestamp TEXT,
    summary TEXT,
    pro_arguments TEXT,
    contra_arguments TEXT,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_topics_status ON monitored_topics (status);
CREATE INDEX IF NOT EXISTS idx_topics_trending ON monitored_topics (is_trending);
CREATE INDEX IF NOT EXISTS idx_topics_category ON monitored_topics (category);

-- 9. media_posts (Postingan Media Publik)
CREATE TABLE IF NOT EXISTS media_posts (
    id TEXT PRIMARY KEY NOT NULL,
    topic_id TEXT NOT NULL REFERENCES monitored_topics(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('news', 'x', 'youtube', 'tiktok', 'forum')),
    external_id TEXT,
    author_handle TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT,
    avatar TEXT,
    content TEXT NOT NULL,
    url TEXT,
    published_at TEXT,
    is_origin INTEGER DEFAULT 0,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score REAL DEFAULT 0.0,
    province_id TEXT REFERENCES electoral_regions(id) ON DELETE SET NULL,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON media_posts (topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON media_posts (platform);
CREATE INDEX IF NOT EXISTS idx_posts_origin ON media_posts (is_origin);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON media_posts (sentiment);

-- 10. post_amplifications (Relasi Graf Jaringan Duplikasi & Amplifikasi)
CREATE TABLE IF NOT EXISTS post_amplifications (
    id TEXT PRIMARY KEY NOT NULL,
    origin_post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    source_post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    amplified_post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    propagation_time_sec INTEGER DEFAULT 0,
    similarity_score REAL DEFAULT 0.0,
    amplification_type TEXT NOT NULL CHECK (amplification_type IN ('retweet', 'quote', 'repost_manual', 'news_coverage', 'duplicate_copy')),
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_amp_origin ON post_amplifications (origin_post_id);
CREATE INDEX IF NOT EXISTS idx_amp_source ON post_amplifications (source_post_id);
CREATE INDEX IF NOT EXISTS idx_amp_amplified ON post_amplifications (amplified_post_id);
