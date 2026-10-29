/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 8: Kunci tema trend otomatis pada monitored_topics. Tema trend disimpan sebagai topik agar
 * post hasil perayapannya dapat direlasikan; `trend_key` kosong = topik kustom buatan pengguna.
 */
migrate((db) => {
  const dao = new Dao(db);
  const topics = dao.findCollectionByNameOrId("monitored_topics");

  if (!topics.schema.getFieldByName("trend_key")) {
    topics.schema.addField(new SchemaField({
      name: "trend_key",
      type: "text",
      required: false,
      options: { max: 200 }
    }));
  }

  return dao.saveCollection(topics);
}, (db) => {
  const dao = new Dao(db);
  const topics = dao.findCollectionByNameOrId("monitored_topics");

  const field = topics.schema.getFieldByName("trend_key");
  if (field) topics.schema.removeField(field.id);

  return dao.saveCollection(topics);
});
