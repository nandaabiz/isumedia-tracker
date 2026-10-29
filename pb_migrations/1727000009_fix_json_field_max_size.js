/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 9: Field JSON dari migrasi sebelumnya dibuat tanpa `maxSize`, sehingga PocketBase 0.22 menolak
 * semua isi ("maximum allowed JSON size is 0 bytes"). Set ke 2 MB, sama dengan default Admin UI.
 */
const JSON_MAX_SIZE = 2000000;
const COLLECTIONS = ["media_sources", "electoral_regions", "election_presidential", "voter_profiles", "monitored_topics"];

function setJsonMaxSize(db, size, onlyUnset) {
  const dao = new Dao(db);
  for (const name of COLLECTIONS) {
    let collection;
    try {
      collection = dao.findCollectionByNameOrId(name);
    } catch (_) {
      continue;
    }
    let changed = false;
    for (const field of collection.schema.fields()) {
      if (field.type !== "json") continue;
      if (onlyUnset && field.options.maxSize > 0) continue;
      field.options.maxSize = size;
      changed = true;
    }
    if (changed) dao.saveCollection(collection);
  }
}

migrate((db) => setJsonMaxSize(db, JSON_MAX_SIZE, true), (db) => setJsonMaxSize(db, 0, false));
