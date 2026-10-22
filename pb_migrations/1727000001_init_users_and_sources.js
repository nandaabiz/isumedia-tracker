/// <reference path="../scripts/bin/pb_data/types.d.ts" />

/**
 * Migration 1: Inisialisasi Koleksi Users (RBAC) & Media Sources
 * Sesuai Dokumen PRD: Modul 0 (Otentikasi & Akses) & Modul 1.1 (Media Sources)
 */
migrate((db) => {
  const dao = new Dao(db);

  // 1. Modifikasi koleksi bawaan 'users' dengan field 'role'
  const users = dao.findCollectionByNameOrId("users");
  
  // Periksa apakah field role sudah ada sebelumnya
  const existingRole = users.schema.getFieldByName("role");
  if (!existingRole) {
    users.schema.addField(new SchemaField({
      name: "role",
      type: "select",
      required: false,
      options: {
        maxSelect: 1,
        values: ["admin", "analyst", "viewer"]
      }
    }));
  }

  // Pengaturan Access Rule untuk RBAC
  users.listRule = "@request.auth.id != ''";
  users.viewRule = "@request.auth.id != ''";
  users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  users.deleteRule = "@request.auth.role = 'admin'";

  dao.saveCollection(users);

  // 2. Buat koleksi 'media_sources'
  const mediaSources = new Collection({
    name: "media_sources",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'analyst'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      {
        name: "name",
        type: "text",
        required: true,
        options: {
          min: 2,
          max: 100
        }
      },
      {
        name: "code",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["news", "x", "youtube", "tiktok", "facebook", "forum"]
        }
      },
      {
        name: "is_active",
        type: "bool",
        required: false
      },
      {
        name: "description",
        type: "text",
        required: false
      },
      {
        name: "icon",
        type: "text",
        required: false
      },
      {
        name: "config",
        type: "json",
        required: false
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_media_sources_code` ON `media_sources` (`code`)"
    ]
  });

  dao.saveCollection(mediaSources);
}, (db) => {
  const dao = new Dao(db);

  // Revert: Hapus media_sources
  try {
    const mediaSources = dao.findCollectionByNameOrId("media_sources");
    if (mediaSources) {
      dao.deleteCollection(mediaSources);
    }
  } catch (_) {}

  // Revert: Hapus field role dari users
  try {
    const users = dao.findCollectionByNameOrId("users");
    const roleField = users.schema.getFieldByName("role");
    if (roleField) {
      users.schema.removeField(roleField.id);
      dao.saveCollection(users);
    }
  } catch (_) {}
});
