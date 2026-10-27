/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 6: Kanal Threads pada media_posts.platform & media_sources.code
 */
const PLATFORM_FIELDS = [
  ["media_posts", "platform"],
  ["media_sources", "code"]
];

migrate((db) => {
  const dao = new Dao(db);

  for (const [collection, fieldName] of PLATFORM_FIELDS) {
    const col = dao.findCollectionByNameOrId(collection);
    const field = col.schema.getFieldByName(fieldName);
    const values = Array.from(field.options.values);
    if (!values.includes("threads")) {
      field.options.values = [...values, "threads"];
      dao.saveCollection(col);
    }
  }

  try {
    dao.findFirstRecordByData("media_sources", "code", "threads");
  } catch (_) {
    const sources = dao.findCollectionByNameOrId("media_sources");
    dao.saveRecord(new Record(sources, {
      name: "Threads (Post Publik)",
      code: "threads",
      is_active: true,
      description: "Pencarian kata kunci post publik via Threads API keyword_search",
      icon: "at-sign",
      config: { search_type: "RECENT", window_days: 7 }
    }));
  }
}, (db) => {
  const dao = new Dao(db);

  try {
    dao.deleteRecord(dao.findFirstRecordByData("media_sources", "code", "threads"));
  } catch (_) {}

  for (const [collection, fieldName] of PLATFORM_FIELDS) {
    const col = dao.findCollectionByNameOrId(collection);
    const field = col.schema.getFieldByName(fieldName);
    field.options.values = Array.from(field.options.values).filter((v) => v !== "threads");
    dao.saveCollection(col);
  }
});
