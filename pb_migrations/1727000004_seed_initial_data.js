/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 4: Seed Data Awal
 * Mengisi akun demo (Admin & Analyst), katalog media sources,
 * master data provinsi elektoral, hasil pemilu, profil pemilih, serta sampel isu pemantauan.
 */
migrate((db) => {
  const dao = new Dao(db);

  // 1. Seed Demo Accounts
  const usersCol = dao.findCollectionByNameOrId("users");

  const accounts = [
    {
      username: "baskoro_lead",
      email: "admin@isumedia.id",
      password: "IsuMedia@2026",
      name: "Baskoro Adiwijaya",
      role: "admin"
    },
    {
      username: "klarisa_intel",
      email: "analyst@isumedia.id",
      password: "Analyst@2026",
      name: "Klarisa Utami",
      role: "analyst"
    }
  ];

  for (const acc of accounts) {
    try {
      // Cek apakah sudah ada berdasarkan email
      dao.findAuthRecordByEmail("users", acc.email);
    } catch (_) {
      const userRec = new Record(usersCol, {
        username: acc.username,
        email: acc.email,
        name: acc.name,
        role: acc.role,
        emailVisibility: true
      });
      userRec.setPassword(acc.password);
      dao.saveRecord(userRec);
    }
  }

  // 2. Seed Media Sources
  const mediaCol = dao.findCollectionByNameOrId("media_sources");
  const sources = [
    {
      name: "Portal Berita Arus Utama (RSS)",
      code: "news",
      is_active: true,
      description: "Agregasi media online terverifikasi Dewan Pers (Antara, Kompas, Detik, Tempo)",
      icon: "newspaper",
      config: { refresh_interval_min: 5, require_journalist_byline: true }
    },
    {
      name: "X / Twitter (Akun Publik)",
      code: "x",
      is_active: true,
      description: "Pemantauan cuitan publik, retweets, quotes, dan tagar trending nasional",
      icon: "twitter",
      config: { exclude_private: true, language: "id" }
    },
    {
      name: "YouTube (Video & Komentar Publik)",
      code: "youtube",
      is_active: true,
      description: "Transkrip video berita, podcast politik, dan sentimen komentar teratas",
      icon: "youtube",
      config: { min_views_threshold: 1000 }
    },
    {
      name: "TikTok (Video & Deskripsi Publik)",
      code: "tiktok",
      is_active: true,
      description: "Analisis narasi video pendek, suara latar (audio template), dan tagar viral",
      icon: "video",
      config: { geo_filter: "ID" }
    },
    {
      name: "Facebook Pages / Grup Publik",
      code: "facebook",
      is_active: true,
      description: "Diskusi komunitas politik terbuka dan halaman resmi partai/tokoh publik",
      icon: "facebook",
      config: { public_pages_only: true }
    },
    {
      name: "Forum Diskusi Publik",
      code: "forum",
      is_active: true,
      description: "Thread diskusi mendalam di Kaskus, Reddit ID, dan kanal terbuka lainnya",
      icon: "message-square",
      config: { rate_limit: 60 }
    }
  ];

  for (const s of sources) {
    try {
      dao.findFirstRecordByData("media_sources", "code", s.code);
    } catch (_) {
      const rec = new Record(mediaCol, s);
      dao.saveRecord(rec);
    }
  }

  // 3. Seed Master Data Electoral Regions (Sampel Provinsi Representatif)
  const regionsCol = dao.findCollectionByNameOrId("electoral_regions");
  const provinces = [
    {
      code: "31",
      name: "DKI Jakarta",
      island: "Jawa",
      level: "province",
      geojson_key: "ID-JK",
      coordinates: [-6.2088, 106.8456],
      dpt_2014: 7001520,
      dpt_2019: 7761598,
      dpt_2024: 8252897,
      turnout_2014: 78.4,
      turnout_2019: 82.5,
      turnout_2024: 83.1
    },
    {
      code: "32",
      name: "Jawa Barat",
      island: "Jawa",
      level: "province",
      geojson_key: "ID-JB",
      coordinates: [-6.9175, 107.6191],
      dpt_2014: 33020100,
      dpt_2019: 33276905,
      dpt_2024: 35714901,
      turnout_2014: 75.1,
      turnout_2019: 87.2,
      turnout_2024: 85.8
    },
    {
      code: "33",
      name: "Jawa Tengah",
      island: "Jawa",
      level: "province",
      geojson_key: "ID-JT",
      coordinates: [-7.150975, 110.140259],
      dpt_2014: 27385985,
      dpt_2019: 27892190,
      dpt_2024: 28289413,
      turnout_2014: 73.8,
      turnout_2019: 83.9,
      turnout_2024: 82.6
    },
    {
      code: "35",
      name: "Jawa Timur",
      island: "Jawa",
      level: "province",
      geojson_key: "ID-JI",
      coordinates: [-7.536064, 112.238402],
      dpt_2014: 30491035,
      dpt_2019: 30912994,
      dpt_2024: 31402838,
      turnout_2014: 74.2,
      turnout_2019: 82.4,
      turnout_2024: 84.1
    },
    {
      code: "12",
      name: "Sumatera Utara",
      island: "Sumatera",
      level: "province",
      geojson_key: "ID-SU",
      coordinates: [2.1154, 99.5451],
      dpt_2014: 9840200,
      dpt_2019: 9789594,
      dpt_2024: 10853940,
      turnout_2014: 70.3,
      turnout_2019: 79.1,
      turnout_2024: 77.8
    },
    {
      code: "13",
      name: "Sumatera Barat",
      island: "Sumatera",
      level: "province",
      geojson_key: "ID-SB",
      coordinates: [-0.7399, 100.8000],
      dpt_2014: 3620150,
      dpt_2019: 3718002,
      dpt_2024: 4088606,
      turnout_2014: 72.8,
      turnout_2019: 81.3,
      turnout_2024: 78.9
    },
    {
      code: "51",
      name: "Bali",
      island: "Bali-Nusa",
      level: "province",
      geojson_key: "ID-BA",
      coordinates: [-8.4095, 115.1889],
      dpt_2014: 2940100,
      dpt_2019: 3130288,
      dpt_2024: 3269516,
      turnout_2014: 76.5,
      turnout_2019: 82.2,
      turnout_2024: 83.4
    },
    {
      code: "73",
      name: "Sulawesi Selatan",
      island: "Sulawesi",
      level: "province",
      geojson_key: "ID-SN",
      coordinates: [-3.6687, 119.9740],
      dpt_2014: 6150200,
      dpt_2019: 6159375,
      dpt_2024: 6670582,
      turnout_2014: 73.1,
      turnout_2019: 81.8,
      turnout_2024: 80.5
    }
  ];

  const regionRecords = {};
  for (const prov of provinces) {
    let rec;
    try {
      rec = dao.findFirstRecordByData("electoral_regions", "code", prov.code);
    } catch (_) {
      rec = new Record(regionsCol, prov);
      dao.saveRecord(rec);
    }
    regionRecords[prov.code] = rec;
  }

  // 4. Seed Voter Profiles & Presidential Results untuk sampel provinsi
  const voterProfilesCol = dao.findCollectionByNameOrId("voter_profiles");
  const presCol = dao.findCollectionByNameOrId("election_presidential");
  const legCol = dao.findCollectionByNameOrId("election_legislative");

  // Jateng (Stronghold PDIP)
  if (regionRecords["33"]) {
    const jatengId = regionRecords["33"].id;
    try {
      dao.findFirstRecordByData("voter_profiles", "region_id", jatengId);
    } catch (_) {
      dao.saveRecord(new Record(voterProfilesCol, {
        region_id: jatengId,
        loyalty_party: "PDIP",
        loyalty_score: 0.92,
        swing_index: 6.4,
        classification: "stronghold",
        dominant_demography: "Agraris & Manufaktur Tradisional, Pemilih Tradisionalis 68%",
        demography: {
          urbanPercentage: 42,
          genZAndMillennialPercentage: 51,
          dominantEmployment: "Pertanian & Industri Pengolahan",
          keyIssue: "Harga Pupuk, Bansos, & Stabilitas Pangan"
        },
        key_influencing_factors: ["Afiliasi Kultural Sosio-Nasionalis", "Jaringan Kepala Desa & Program Sosial", "Tokoh Karismatik Lokal"],
        historical_narrative: "Jawa Tengah merupakan basis utama loyalis PDIP ('Kandang Banteng') dengan kemenangan berturut-turut di 3 periode pemilu."
      }));
    }

    // Presidential Jateng 2024
    try {
      dao.findFirstRecordByData("election_presidential", "region_id", jatengId);
    } catch (_) {
      dao.saveRecord(new Record(presCol, {
        region_id: jatengId,
        year: 2024,
        total_valid_votes: 22840000,
        candidates: [
          { name: "Anies - Muhaimin", parties: ["NasDem", "PKB", "PKS"], votes: 2866373, percentage: 12.5, colorHex: "#22c55e", isWinner: false },
          { name: "Prabowo - Gibran", parties: ["Gerindra", "Golkar", "Demokrat", "PAN"], votes: 12096454, percentage: 53.0, colorHex: "#0284c7", isWinner: true },
          { name: "Ganjar - Mahfud", parties: ["PDIP", "PPP", "Perindo", "Hanura"], votes: 7827335, percentage: 34.5, colorHex: "#dc2626", isWinner: false }
        ],
        winner_candidate: "Prabowo - Gibran"
      }));
    }
  }

  // Jabar (Battleground / High Swing)
  if (regionRecords["32"]) {
    const jabarId = regionRecords["32"].id;
    try {
      dao.findFirstRecordByData("voter_profiles", "region_id", jabarId);
    } catch (_) {
      dao.saveRecord(new Record(voterProfilesCol, {
        region_id: jabarId,
        loyalty_party: "GERINDRA",
        loyalty_score: 0.58,
        swing_index: 24.8,
        classification: "battleground",
        dominant_demography: "Urban Industri & Milenial 54%, Pemilih Kritis & Religius",
        demography: {
          urbanPercentage: 78,
          genZAndMillennialPercentage: 56,
          dominantEmployment: "Karyawan Swasta, Pabrik, & Sektor Jasa",
          keyIssue: "Peluang Kerja, Pajak/Biaya Hidup, dan Infrastruktur Transportasi"
        },
        key_influencing_factors: ["Dinamika Medsos & Narasi Digital", "Fatwa Tokoh Agama / Ormas Islam", "Isu Lapangan Kerja Kaum Muda"],
        historical_narrative: "Jawa Barat adalah lumbung suara terbesar nasional dengan volatilitas tinggi antar-pemilu (medan pertempuran penentu)."
      }));
    }

    // Presidential Jabar 2024
    try {
      dao.findFirstRecordByData("election_presidential", "region_id", jabarId);
    } catch (_) {
      dao.saveRecord(new Record(presCol, {
        region_id: jabarId,
        year: 2024,
        total_valid_votes: 29430000,
        candidates: [
          { name: "Anies - Muhaimin", parties: ["NasDem", "PKB", "PKS"], votes: 9188479, percentage: 31.2, colorHex: "#22c55e", isWinner: false },
          { name: "Prabowo - Gibran", parties: ["Gerindra", "Golkar", "Demokrat", "PAN"], votes: 16805854, percentage: 57.1, colorHex: "#0284c7", isWinner: true },
          { name: "Ganjar - Mahfud", parties: ["PDIP", "PPP"], votes: 3435885, percentage: 11.7, colorHex: "#dc2626", isWinner: false }
        ],
        winner_candidate: "Prabowo - Gibran"
      }));
    }
  }

  // 5. Seed Monitored Topics
  const topicsCol = dao.findCollectionByNameOrId("monitored_topics");
  const postsCol = dao.findCollectionByNameOrId("media_posts");
  const ampCol = dao.findCollectionByNameOrId("post_amplifications");

  const sampleTopics = [
    {
      title: "Wacana Kenaikan Tarif PPN 12% & Daya Beli",
      category: "Ekonomi",
      keywords: ["PPN 12%", "pajak naik", "daya beli", "#TolakPPN12", "kebutuhan pokok"],
      is_trending: true,
      trend_velocity: "+184% / 3 jam",
      total_mentions: 148200,
      status: "active",
      media_filter: ["news", "x", "youtube", "tiktok", "forum"],
      origin_timestamp: "2026-09-18 07:14:22 WIB",
      summary: "Diskusi publik melonjak tajam setelah beredarnya draf peraturan teknis penyesuaian PPN 12%. Masyarakat menyoroti efek berantai terhadap harga bahan pokok dan tarif sewa.",
      pro_arguments: "Pemerintah dan ekonom fiskal berargumen penyesuaian PPN adalah amanat UU HPP untuk menjaga keberlanjutan APBN dan memperluas jaring bantuan sosial.",
      contra_arguments: "Asosiasi ritel, buruh, dan warganet menilai momentum ekonomi belum pulih, memicu deflasi daya beli kelas menengah dan gelombang PHK."
    },
    {
      title: "Implementasi Program Makan Bergizi Gratis (MBG)",
      category: "Kesejahteraan",
      keywords: ["Makan Bergizi Gratis", "MBG", "dapur umum", "gizi anak", "distribusi pangan"],
      is_trending: true,
      trend_velocity: "+92% / 6 jam",
      total_mentions: 96450,
      status: "active",
      media_filter: ["news", "x", "youtube", "tiktok"],
      origin_timestamp: "2026-09-19 11:05:08 WIB",
      summary: "Pemantauan pengadaan dapur satuan pelayanan MBG di berbagai daerah. Diskusi terfokus pada keterlibatan UMKM lokal, higienitas menu, dan transparansi anggaran per porsi.",
      pro_arguments: "Peningkatan nutrisi anak sekolah di daerah 3T, penyerapan hasil panen petani dan peternak telur lokal secara masif.",
      contra_arguments: "Kekhawatiran monopoli katering besar, risiko keracunan makanan jika rantai dingin tidak higienis, serta beban fiskal daerah."
    },
    {
      title: "Dinamika Koalisi Pilkada Serentak & Putusan MK",
      category: "Politik",
      keywords: ["Pilkada Serentak", "Putusan MK", "Ambang Batas", "Kotak Kosong", "KPU Daerah"],
      is_trending: false,
      trend_velocity: "+45% / hari",
      total_mentions: 62800,
      status: "active",
      media_filter: ["news", "x", "youtube", "forum"],
      origin_timestamp: "2026-09-15 14:30:19 WIB",
      summary: "Persaingan sengit calon kepala daerah di provinsi strategis (DKI Jakarta, Jawa Barat, Jawa Tengah, Sumatera Utara) pasca relaksasi syarat pencalonan oleh MK.",
      pro_arguments: "Memberikan opsi kepemimpinan alternatif bagi warga dan mencegah dominasi tunggal koalisi gemuk melawan kotak kosong.",
      contra_arguments: "Potensi polarisasi horizontal dan penggunaan politik uang di masa kampanye terbuka."
    }
  ];

  for (const topic of sampleTopics) {
    let topicRec;
    try {
      topicRec = dao.findFirstRecordByData("monitored_topics", "title", topic.title);
    } catch (_) {
      topicRec = new Record(topicsCol, topic);
      dao.saveRecord(topicRec);

      // Buat Origin Post untuk topik PPN 12%
      if (topic.title.includes("PPN 12%")) {
        const originPost = new Record(postsCol, {
          topic_id: topicRec.id,
          platform: "x",
          author_handle: "@fiskal_rakyat",
          author_name: "Rangga P. Danubrata",
          author_role: "Peneliti Kebijakan Publik",
          content: "Simulasi internal kenaikan PPN jadi 12% per 1 Januari ini bukan cuma kena barang mewah, tapi merembes ke biaya logistik bahan pangan pokok. Efek inflasi riil bisa tembus 2.8% di Q1! #TolakPPN12",
          url: "https://x.com/fiskal_rakyat/status/1836291048192",
          published_at: "2026-09-18 07:14:22",
          is_origin: true,
          sentiment: "negative",
          sentiment_score: -0.84,
          reach: 342000,
          engagement: 18900
        });
        dao.saveRecord(originPost);

        // Child node 1 (KOL amplifier)
        const kolPost = new Record(postsCol, {
          topic_id: topicRec.id,
          platform: "x",
          author_handle: "@diana_analyst",
          author_name: "Diana Puspita, CFA",
          author_role: "Market Strategist",
          content: "Menyambung utas @fiskal_rakyat: Saham sektor consumer goods dan ritel langsung tertekan pagi ini. Indeks keyakinan konsumen berpotensi turun ke level pesimis jika tidak ada insentif kompensasi.",
          url: "https://x.com/diana_analyst/status/1836301290311",
          published_at: "2026-09-18 08:32:10",
          is_origin: false,
          sentiment: "negative",
          sentiment_score: -0.72,
          reach: 128000,
          engagement: 5400
        });
        dao.saveRecord(kolPost);

        // Amplification link: origin -> kol
        dao.saveRecord(new Record(ampCol, {
          origin_post_id: originPost.id,
          source_post_id: originPost.id,
          amplified_post_id: kolPost.id,
          propagation_time_sec: 4668,
          similarity_score: 0.68,
          amplification_type: "quote"
        }));
      }
    }
  }

  // 6. Seed Election News Archive
  const newsArchiveCol = dao.findCollectionByNameOrId("election_news_archive");
  const newsEvents = [
    {
      year: 2024,
      date: "2024-02-05",
      headline: "Debat Pamungkas Capres Soroti Isu Bansos & Lapangan Kerja",
      source: "Kompas.id",
      province_affected: "Nasional",
      impact_description: "Memicu lonjakan percakapan di Pulau Jawa terkait etika penyaluran bansos menjelang hari pencoblosan.",
      sentiment_direction: "split_vote"
    },
    {
      year: 2019,
      date: "2019-04-10",
      headline: "Kampanye Akbar GBK & Konser Putih Bersatu Tarik Ratusan Ribu Massa",
      source: "Detikcom",
      province_affected: "DKI Jakarta",
      impact_description: "Memperkuat soliditas basis pemilih perkotaan di Jabodetabek dan Jawa Barat.",
      sentiment_direction: "reinforced_incumbent"
    },
    {
      year: 2014,
      date: "2014-06-22",
      headline: "Debat Capres Bahas Penguatan Ketahanan Pangan & Reforma Agraria",
      source: "Antaranews",
      province_affected: "Jawa Tengah",
      impact_description: "Mengukuhkan basis dukungan petani pedesaan di kawasan lumbung padi Jawa.",
      sentiment_direction: "reinforced_incumbent"
    }
  ];

  for (const n of newsEvents) {
    try {
      dao.findFirstRecordByData("election_news_archive", "headline", n.headline);
    } catch (_) {
      dao.saveRecord(new Record(newsArchiveCol, n));
    }
  }
});
