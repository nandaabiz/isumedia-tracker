-- =====================================================================
-- Migration 002: Initial Seed Data (SQLite Compatible)
-- Project: IsuMedia Tracker & Electoral Intelligence Platform
-- =====================================================================

-- 1. Users (Admin & Analyst)
INSERT OR IGNORE INTO users (id, username, email, name, role) VALUES 
('usr_admin01', 'baskoro_lead', 'admin@isumedia.id', 'Baskoro Adiwijaya', 'admin'),
('usr_analyst01', 'klarisa_intel', 'analyst@isumedia.id', 'Klarisa Utami', 'analyst');

-- 2. Media Sources
INSERT OR IGNORE INTO media_sources (id, name, code, is_active, description, icon, config) VALUES
('src_news', 'Portal Berita Arus Utama (RSS)', 'news', 1, 'Agregasi media online terverifikasi Dewan Pers', 'newspaper', '{"refresh_interval_min": 5}'),
('src_x', 'X / Twitter (Akun Publik)', 'x', 1, 'Pemantauan cuitan publik & retweets', 'twitter', '{"exclude_private": true}'),
('src_yt', 'YouTube (Video & Komentar Publik)', 'youtube', 1, 'Transkrip video berita & podcast politik', 'youtube', '{"min_views": 1000}'),
('src_tt', 'TikTok (Video & Deskripsi Publik)', 'tiktok', 1, 'Analisis video pendek & tagar viral', 'video', '{"geo": "ID"}'),
('src_fb', 'Facebook Pages Publik', 'facebook', 1, 'Halaman resmi partai & tokoh publik', 'facebook', '{"public_pages_only": true}'),
('src_forum', 'Forum Publik (Kaskus, Reddit ID)', 'forum', 1, 'Diskusi komunitas & thread analitik', 'message-square', '{"rate_limit": 60}');

-- 3. Electoral Regions (Sampel Provinsi Utama)
INSERT OR IGNORE INTO electoral_regions (id, code, name, island, level, geojson_key, coordinates, dpt_2014, dpt_2019, dpt_2024, turnout_2014, turnout_2019, turnout_2024) VALUES
('reg_31', '31', 'DKI Jakarta', 'Jawa', 'province', 'ID-JK', '[-6.2088, 106.8456]', 7001520, 7761598, 8252897, 78.4, 82.5, 83.1),
('reg_32', '32', 'Jawa Barat', 'Jawa', 'province', 'ID-JB', '[-6.9175, 107.6191]', 33020100, 33276905, 35714901, 75.1, 87.2, 85.8),
('reg_33', '33', 'Jawa Tengah', 'Jawa', 'province', 'ID-JT', '[-7.1509, 110.1402]', 27385985, 27892190, 28289413, 73.8, 83.9, 82.6),
('reg_35', '35', 'Jawa Timur', 'Jawa', 'province', 'ID-JI', '[-7.5360, 112.2384]', 30491035, 30912994, 31402838, 74.2, 82.4, 84.1),
('reg_12', '12', 'Sumatera Utara', 'Sumatera', 'province', 'ID-SU', '[2.1154, 99.5451]', 9840200, 9789594, 10853940, 70.3, 79.1, 77.8),
('reg_51', '51', 'Bali', 'Bali-Nusa', 'province', 'ID-BA', '[-8.4095, 115.1889]', 2940100, 3130288, 3269516, 76.5, 82.2, 83.4);

-- 4. Voter Profiles
INSERT OR IGNORE INTO voter_profiles (id, region_id, loyalty_party, loyalty_score, swing_index, classification, dominant_demography, historical_narrative) VALUES
('vp_33', 'reg_33', 'PDIP', 0.92, 6.4, 'stronghold', 'Agraris & Manufaktur Tradisional, Pemilih Tradisionalis 68%', 'Basis utama PDIP dengan kemenangan konsisten 3 periode.'),
('vp_32', 'reg_32', 'GERINDRA', 0.58, 24.8, 'battleground', 'Urban Industri & Milenial 54%, Pemilih Kritis', 'Lumbung suara terbesar nasional dengan tingkat volatilitas tinggi.');

-- 5. Monitored Topics
INSERT OR IGNORE INTO monitored_topics (id, title, category, keywords, is_trending, trend_velocity, total_mentions, status, media_filter, origin_timestamp, summary, pro_arguments, contra_arguments) VALUES
('topic_ppn12', 'Wacana Kenaikan Tarif PPN 12% & Daya Beli', 'Ekonomi', '["PPN 12%", "pajak naik", "daya beli", "#TolakPPN12"]', 1, '+184% / 3 jam', 148200, 'active', '["news", "x", "youtube", "tiktok", "forum"]', '2026-09-18 07:14:22 WIB', 'Diskusi publik melonjak terkait efek kenaikan PPN terhadap bahan pokok.', 'Amanat UU HPP untuk keberlanjutan APBN dan belanja bansos.', 'Dikhawatirkan menekan daya beli kelas menengah dan ritel.'),
('topic_mbg', 'Implementasi Program Makan Bergizi Gratis (MBG)', 'Kesejahteraan', '["Makan Bergizi Gratis", "MBG", "dapur umum", "gizi anak"]', 1, '+92% / 6 jam', 96450, 'active', '["news", "x", "youtube", "tiktok"]', '2026-09-19 11:05:08 WIB', 'Pemantauan pengadaan dapur satuan pelayanan MBG di berbagai daerah.', 'Perbaikan gizi anak dan penyerapan hasil panen petani lokal.', 'Tantangan higienitas dan pencegahan monopoli katering besar.');
