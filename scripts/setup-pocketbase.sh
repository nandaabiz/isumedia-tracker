#!/usr/bin/env bash
set -e

# Setup script for PocketBase on macOS / Linux
echo "==> IsuMedia Tracker & Electoral Intelligence: PocketBase Setup"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PB_VERSION="0.22.20"
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$ARCH" = "x86_64" ]; then
  ARCH_NAME="amd64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
  ARCH_NAME="arm64"
else
  ARCH_NAME="amd64"
fi

PB_FILENAME="pocketbase_${PB_VERSION}_${OS}_${ARCH_NAME}.zip"
PB_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${PB_FILENAME}"

mkdir -p "$SCRIPT_DIR/bin"
mkdir -p "$SCRIPT_DIR/bin/pb_data"

if [ ! -f "$SCRIPT_DIR/bin/pocketbase" ]; then
  echo "==> Mengunduh PocketBase v${PB_VERSION} (${OS}_${ARCH_NAME})..."
  curl -L "$PB_URL" -o "$SCRIPT_DIR/bin/pocketbase.zip"
  unzip -o "$SCRIPT_DIR/bin/pocketbase.zip" -d "$SCRIPT_DIR/bin/"
  rm "$SCRIPT_DIR/bin/pocketbase.zip"
  chmod +x "$SCRIPT_DIR/bin/pocketbase"
  echo "==> PocketBase berhasil diinstal di $SCRIPT_DIR/bin/pocketbase"
else
  echo "==> PocketBase binary sudah tersedia di $SCRIPT_DIR/bin/pocketbase"
fi

# Link pb_migrations to ensure migrations are discovered
mkdir -p "$ROOT_DIR/pb_migrations"
ln -sfn "$ROOT_DIR/pb_migrations" "$SCRIPT_DIR/pb_migrations"
ln -sfn "$ROOT_DIR/pb_migrations" "$SCRIPT_DIR/bin/pb_migrations"

echo "==> Menjalankan migrasi database..."
"$SCRIPT_DIR/bin/pocketbase" migrate up --dir="$SCRIPT_DIR/bin/pb_data" --migrationsDir="$ROOT_DIR/pb_migrations"

echo ""
echo "Database siap! Untuk menjalankan PocketBase:"
echo "  npm run pb:serve"
echo "  atau: ./scripts/bin/pocketbase serve --http=127.0.0.1:8290"
echo ""
echo "Dashboard Admin akan tersedia di:"
echo "  http://127.0.0.1:8290/_/"
