/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 2: Inisialisasi Koleksi Skema Elektoral (Modul 2)
 * Sesuai Dokumen PRD:
 * - electoral_regions (38 Provinsi & 514 Kab/Kota)
 * - election_presidential (Hasil Pilpres 2014, 2019, 2024)
 * - election_legislative (Hasil Suara Parpol Pileg DPR RI)
 * - voter_profiles (Pedersen Swing Index & Karakteristik Pemilih)
 * - election_news_archive (Linimasa Berita Pemilu 3 Periode)
 */
migrate((db) => {
  const dao = new Dao(db);

  // 1. Koleksi 'electoral_regions'
  const electoralRegions = new Collection({
    name: "electoral_regions",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "code",
        type: "text",
        required: true,
        options: { min: 2, max: 20 }
      },
      {
        name: "name",
        type: "text",
        required: true,
        options: { min: 2, max: 120 }
      },
      {
        name: "island",
        type: "select",
        required: false,
        options: {
          maxSelect: 1,
          values: ["Jawa", "Sumatera", "Kalimantan", "Sulawesi", "Bali-Nusa", "Maluku-Papua"]
        }
      },
      {
        name: "level",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["province", "city_regency"]
        }
      },
      {
        name: "geojson_key",
        type: "text",
        required: false
      },
      {
        name: "coordinates",
        type: "json",
        required: false
      },
      {
        name: "dpt_2014",
        type: "number",
        required: false
      },
      {
        name: "dpt_2019",
        type: "number",
        required: false
      },
      {
        name: "dpt_2024",
        type: "number",
        required: false
      },
      {
        name: "turnout_2014",
        type: "number",
        required: false
      },
      {
        name: "turnout_2019",
        type: "number",
        required: false
      },
      {
        name: "turnout_2024",
        type: "number",
        required: false
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_regions_code` ON `electoral_regions` (`code`)",
      "CREATE INDEX `idx_regions_level` ON `electoral_regions` (`level`)",
      "CREATE INDEX `idx_regions_island` ON `electoral_regions` (`island`)"
    ]
  });
  dao.saveCollection(electoralRegions);

  // Self-relation: parent_id untuk hubungan Kabupaten/Kota -> Provinsi
  electoralRegions.schema.addField(new SchemaField({
    name: "parent_id",
    type: "relation",
    required: false,
    options: {
      collectionId: electoralRegions.id,
      cascadeDelete: false,
      maxSelect: 1
    }
  }));
  dao.saveCollection(electoralRegions);

  // 2. Koleksi 'election_presidential'
  const electionPresidential = new Collection({
    name: "election_presidential",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "region_id",
        type: "relation",
        required: true,
        options: {
          collectionId: electoralRegions.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "year",
        type: "number",
        required: true,
        options: { min: 2014, max: 2029 }
      },
      {
        name: "total_valid_votes",
        type: "number",
        required: false
      },
      {
        name: "candidates",
        type: "json",
        required: true
      },
      {
        name: "winner_candidate",
        type: "text",
        required: false
      }
    ],
    indexes: [
      "CREATE INDEX `idx_presidential_region_year` ON `election_presidential` (`region_id`, `year`)"
    ]
  });
  dao.saveCollection(electionPresidential);

  // 3. Koleksi 'election_legislative'
  const electionLegislative = new Collection({
    name: "election_legislative",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "region_id",
        type: "relation",
        required: true,
        options: {
          collectionId: electoralRegions.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "year",
        type: "number",
        required: true,
        options: { min: 2014, max: 2029 }
      },
      {
        name: "party_code",
        type: "text",
        required: true,
        options: { min: 2, max: 20 }
      },
      {
        name: "party_name",
        type: "text",
        required: false
      },
      {
        name: "vote_count",
        type: "number",
        required: false
      },
      {
        name: "vote_percentage",
        type: "number",
        required: false
      },
      {
        name: "seats_won",
        type: "number",
        required: false
      },
      {
        name: "is_winner",
        type: "bool",
        required: false
      }
    ],
    indexes: [
      "CREATE INDEX `idx_legislative_region_year` ON `election_legislative` (`region_id`, `year`)",
      "CREATE INDEX `idx_legislative_party` ON `election_legislative` (`party_code`)"
    ]
  });
  dao.saveCollection(electionLegislative);

  // 4. Koleksi 'voter_profiles'
  const voterProfiles = new Collection({
    name: "voter_profiles",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "region_id",
        type: "relation",
        required: true,
        options: {
          collectionId: electoralRegions.id,
          cascadeDelete: true,
          maxSelect: 1
        }
      },
      {
        name: "loyalty_party",
        type: "text",
        required: false
      },
      {
        name: "loyalty_score",
        type: "number",
        required: false
      },
      {
        name: "swing_index",
        type: "number",
        required: false
      },
      {
        name: "classification",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["stronghold", "battleground", "leaning_loyal", "unstable", "volatile"]
        }
      },
      {
        name: "dominant_demography",
        type: "text",
        required: false
      },
      {
        name: "demography",
        type: "json",
        required: false
      },
      {
        name: "key_influencing_factors",
        type: "json",
        required: false
      },
      {
        name: "historical_narrative",
        type: "text",
        required: false
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_voter_profiles_region` ON `voter_profiles` (`region_id`)",
      "CREATE INDEX `idx_voter_profiles_classification` ON `voter_profiles` (`classification`)"
    ]
  });
  dao.saveCollection(voterProfiles);

  // 5. Koleksi 'election_news_archive'
  const electionNewsArchive = new Collection({
    name: "election_news_archive",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "year",
        type: "number",
        required: true,
        options: { min: 2014, max: 2029 }
      },
      {
        name: "date",
        type: "text",
        required: true
      },
      {
        name: "headline",
        type: "text",
        required: true,
        options: { min: 5, max: 300 }
      },
      {
        name: "source",
        type: "text",
        required: true
      },
      {
        name: "province_affected",
        type: "text",
        required: false
      },
      {
        name: "region_id",
        type: "relation",
        required: false,
        options: {
          collectionId: electoralRegions.id,
          cascadeDelete: false,
          maxSelect: 1
        }
      },
      {
        name: "impact_description",
        type: "text",
        required: false
      },
      {
        name: "sentiment_direction",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["swung_to_challenger", "reinforced_incumbent", "split_vote"]
        }
      }
    ],
    indexes: [
      "CREATE INDEX `idx_news_archive_year` ON `election_news_archive` (`year`)",
      "CREATE INDEX `idx_news_archive_sentiment` ON `election_news_archive` (`sentiment_direction`)"
    ]
  });
  dao.saveCollection(electionNewsArchive);
}, (db) => {
  const dao = new Dao(db);

  const collections = [
    "election_news_archive",
    "voter_profiles",
    "election_legislative",
    "election_presidential",
    "electoral_regions"
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
