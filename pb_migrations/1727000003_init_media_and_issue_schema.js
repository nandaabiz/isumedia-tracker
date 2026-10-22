/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 3: Inisialisasi Koleksi Media & Issue Tracker (Modul 1)
 * Sesuai Dokumen PRD:
 * - monitored_topics (Daftar topik / isu yang dipantau)
 * - media_posts (Postingan media publik, sentiment, author, origin)
 * - post_amplifications (Relasi graf penyebaran, duplikasi narasi & time propagation)
 */
migrate((db) => {
  const dao = new Dao(db);

  // Cari referensi electoral_regions jika sudah ada
  let electoralRegionsId = null;
  try {
    const electoralRegions = dao.findCollectionByNameOrId("electoral_regions");
    if (electoralRegions) electoralRegionsId = electoralRegions.id;
  } catch (_) {}

  // 1. Koleksi 'monitored_topics'
  const monitoredTopics = new Collection({
    name: "monitored_topics",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "title",
        type: "text",
        required: true,
        options: { min: 3, max: 200 }
      },
      {
        name: "category",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["Ekonomi", "Politik", "Sosial & Hukum", "Lingkungan", "Kesejahteraan"]
        }
      },
      {
        name: "keywords",
        type: "json",
        required: true
      },
      {
        name: "is_trending",
        type: "bool",
        required: false
      },
      {
        name: "trend_velocity",
        type: "text",
        required: false
      },
      {
        name: "total_mentions",
        type: "number",
        required: false
      },
      {
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["active", "paused", "archived"]
        }
      },
      {
        name: "media_filter",
        type: "json",
        required: false
      },
      {
        name: "origin_timestamp",
        type: "text",
        required: false
      },
      {
        name: "summary",
        type: "text",
        required: false
      },
      {
        name: "pro_arguments",
        type: "text",
        required: false
      },
      {
        name: "contra_arguments",
        type: "text",
        required: false
      }
    ],
    indexes: [
      "CREATE INDEX `idx_topics_status` ON `monitored_topics` (`status`)",
      "CREATE INDEX `idx_topics_trending` ON `monitored_topics` (`is_trending`)",
      "CREATE INDEX `idx_topics_category` ON `monitored_topics` (`category`)"
    ]
  });
  dao.saveCollection(monitoredTopics);

  // 2. Koleksi 'media_posts'
  const mediaPosts = new Collection({
    name: "media_posts",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "topic_id",
        type: "relation",
        required: true,
        options: {
          collectionId: monitoredTopics.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "platform",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["news", "x", "youtube", "tiktok", "forum"]
        }
      },
      {
        name: "external_id",
        type: "text",
        required: false
      },
      {
        name: "author_handle",
        type: "text",
        required: true
      },
      {
        name: "author_name",
        type: "text",
        required: true
      },
      {
        name: "author_role",
        type: "text",
        required: false
      },
      {
        name: "avatar",
        type: "text",
        required: false
      },
      {
        name: "content",
        type: "text",
        required: true
      },
      {
        name: "url",
        type: "text",
        required: false
      },
      {
        name: "published_at",
        type: "text",
        required: false
      },
      {
        name: "is_origin",
        type: "bool",
        required: false
      },
      {
        name: "sentiment",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["positive", "neutral", "negative"]
        }
      },
      {
        name: "sentiment_score",
        type: "number",
        required: false
      },
      {
        name: "reach",
        type: "number",
        required: false
      },
      {
        name: "engagement",
        type: "number",
        required: false
      }
    ],
    indexes: [
      "CREATE INDEX `idx_posts_topic` ON `media_posts` (`topic_id`)",
      "CREATE INDEX `idx_posts_platform` ON `media_posts` (`platform`)",
      "CREATE INDEX `idx_posts_is_origin` ON `media_posts` (`is_origin`)",
      "CREATE INDEX `idx_posts_sentiment` ON `media_posts` (`sentiment`)"
    ]
  });

  // Hubungkan ke electoral_regions jika tersedia
  if (electoralRegionsId) {
    mediaPosts.schema.addField(new SchemaField({
      name: "province_id",
      type: "relation",
      required: false,
      options: {
        collectionId: electoralRegionsId,
        cascadeDelete: false,
        maxSelect: 1
      }
    }));
  }

  dao.saveCollection(mediaPosts);

  // 3. Koleksi 'post_amplifications' (Graph & Rantai Duplikasi)
  const postAmplifications = new Collection({
    name: "post_amplifications",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "origin_post_id",
        type: "relation",
        required: true,
        options: {
          collectionId: mediaPosts.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "source_post_id",
        type: "relation",
        required: true,
        options: {
          collectionId: mediaPosts.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "amplified_post_id",
        type: "relation",
        required: true,
        options: {
          collectionId: mediaPosts.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "propagation_time_sec",
        type: "number",
        required: false
      },
      {
        name: "similarity_score",
        type: "number",
        required: false
      },
      {
        name: "amplification_type",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["retweet", "quote", "repost_manual", "news_coverage", "duplicate_copy"]
        }
      }
    ],
    indexes: [
      "CREATE INDEX `idx_amp_origin` ON `post_amplifications` (`origin_post_id`)",
      "CREATE INDEX `idx_amp_source` ON `post_amplifications` (`source_post_id`)",
      "CREATE INDEX `idx_amp_amplified` ON `post_amplifications` (`amplified_post_id`)"
    ]
  });
  dao.saveCollection(postAmplifications);
}, (db) => {
  const dao = new Dao(db);

  const collections = [
    "post_amplifications",
    "media_posts",
    "monitored_topics"
  ];

  for (const name of collections) {
    try {
      const col = dao.findCollectionByNameOrId(name);
      if (col) {
        dao.deleteCollection(col);
      }
    } catch (_) {}
  }
});
