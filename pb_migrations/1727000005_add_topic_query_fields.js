/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 5: Kueri boolean & filter entitas pada monitored_topics (PRD FR-1.1.2)
 */
migrate((db) => {
  const dao = new Dao(db);
  const topics = dao.findCollectionByNameOrId("monitored_topics");

  if (!topics.schema.getFieldByName("query")) {
    topics.schema.addField(new SchemaField({
      name: "query",
      type: "text",
      required: false,
      options: { max: 500 }
    }));
  }

  if (!topics.schema.getFieldByName("entity_filter")) {
    topics.schema.addField(new SchemaField({
      name: "entity_filter",
      type: "json",
      required: false
    }));
  }

  return dao.saveCollection(topics);
}, (db) => {
  const dao = new Dao(db);
  const topics = dao.findCollectionByNameOrId("monitored_topics");

  for (const name of ["query", "entity_filter"]) {
    const field = topics.schema.getFieldByName(name);
    if (field) topics.schema.removeField(field.id);
  }

  return dao.saveCollection(topics);
});
