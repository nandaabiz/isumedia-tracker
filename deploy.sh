#!/usr/bin/env bash
# Deploy IsuMedia Tracker: pull, install, test, build, migrasi PocketBase, (re)start PM2, health check.
#
#   ./deploy.sh                      jalankan di server (di dalam folder repo)
#   ./deploy.sh --remote             jalankan di server lewat SSH (butuh DEPLOY_HOST & DEPLOY_PATH)
#
# Opsi: --branch <nama> (default: main), --skip-pull, --skip-tests, -h|--help
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${DEPLOY_BRANCH:-main}"
PB_PORT=8290
REMOTE=0
SKIP_PULL=0
SKIP_TESTS=0
FORWARD_ARGS=()

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWARN:\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }
trap 'fail "Deploy berhenti di baris $LINENO."' ERR

usage() {
  sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote) REMOTE=1 ;;
    --branch) BRANCH="${2:?--branch butuh nama branch}"; FORWARD_ARGS+=("--branch" "$2"); shift ;;
    --skip-pull) SKIP_PULL=1; FORWARD_ARGS+=("$1") ;;
    --skip-tests) SKIP_TESTS=1; FORWARD_ARGS+=("$1") ;;
    -h|--help) usage ;;
    *) fail "Opsi tidak dikenal: $1 (lihat --help)" ;;
  esac
  shift
done

if [[ $REMOTE -eq 1 ]]; then
  : "${DEPLOY_HOST:?Set DEPLOY_HOST, mis. DEPLOY_HOST=deploy@server}"
  : "${DEPLOY_PATH:?Set DEPLOY_PATH, mis. DEPLOY_PATH=/srv/isumedia-tracker}"
  log "Deploy jarak jauh ke ${DEPLOY_HOST}:${DEPLOY_PATH} (branch ${BRANCH})"
  ssh "$DEPLOY_HOST" "cd $(printf '%q' "$DEPLOY_PATH") && ./deploy.sh ${FORWARD_ARGS[*]:-}"
  exit $?
fi

cd "$APP_DIR"

# --- Prasyarat -------------------------------------------------------------
for cmd in node npm git curl unzip; do
  command -v "$cmd" >/dev/null 2>&1 || fail "'$cmd' belum terpasang."
done
command -v pm2 >/dev/null 2>&1 || fail "PM2 belum terpasang. Pasang dengan: npm install -g pm2"

# node --test membaca file .ts langsung (type stripping) sejak Node 22.18
NODE_VERSION="$(node -p 'process.versions.node')"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)' \
  || fail "Butuh Node >= 22.18 (terpasang ${NODE_VERSION})."

[[ -f .env ]] || fail ".env belum ada. Salin .env.example ke .env lalu isi nilainya."
env_value() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2- || true; }
SECRET="$(env_value NUXT_SESSION_SECRET)"
[[ ${#SECRET} -ge 32 ]] || fail "NUXT_SESSION_SECRET di .env minimal 32 karakter (buat: openssl rand -hex 32)."
[[ -n "$(env_value PB_SERVICE_EMAIL)" && -n "$(env_value PB_SERVICE_PASSWORD)" ]] \
  || warn "PB_SERVICE_EMAIL/PB_SERVICE_PASSWORD kosong: topik & publikasi tidak akan tersimpan ke PocketBase."
[[ "$(env_value NUXT_DEMO_LOGIN)" == "true" ]] && warn "NUXT_DEMO_LOGIN=true: login akun demo saat PocketBase mati masih aktif."
PORT="$(env_value PORT)"; PORT="${PORT:-3020}"

# --- Kode ------------------------------------------------------------------
if [[ $SKIP_PULL -eq 0 ]]; then
  git diff --quiet && git diff --cached --quiet || fail "Ada perubahan lokal yang belum dikomit di server; batalkan atau komit dulu."
  log "Mengambil branch ${BRANCH}"
  git fetch --prune origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi
log "Versi: $(git rev-parse --short HEAD 2>/dev/null || echo 'tanpa git')"

# --- Build -----------------------------------------------------------------
log "Memasang dependency (npm ci)"
npm ci --no-audit --no-fund

if [[ $SKIP_TESTS -eq 0 ]]; then
  log "Menjalankan unit test"
  npm test
fi

log "Build Nuxt"
npm run build

# --- PocketBase -------------------------------------------------------------
log "Menyiapkan PocketBase & menjalankan migrasi"
bash scripts/setup-pocketbase.sh

# --- Proses ----------------------------------------------------------------
log "Menjalankan ulang proses lewat PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save >/dev/null

# --- Health check -----------------------------------------------------------
log "Health check"
healthy=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/login" \
    && curl -fsS -o /dev/null "http://127.0.0.1:${PB_PORT}/api/health"; then
    healthy=1
    break
  fi
  sleep 2
done
[[ $healthy -eq 1 ]] || fail "Aplikasi tidak merespons di port ${PORT} atau PocketBase di ${PB_PORT}. Cek: pm2 logs"

log "Deploy selesai: http://127.0.0.1:${PORT} (PocketBase admin: http://127.0.0.1:${PB_PORT}/_/ via tunnel SSH)"
warn "Pastikan kata sandi akun seed (admin@isumedia.id, analyst@isumedia.id) sudah diganti."
