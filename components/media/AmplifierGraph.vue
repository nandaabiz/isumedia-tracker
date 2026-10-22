<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Network, 
  GitCommit, 
  Copy, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Info,
  CheckCircle2
} from 'lucide-vue-next'
import type { AmplificationNode, AmplificationEdge } from '~/types/issue'
import Badge from '~/components/ui/Badge.vue'

interface DuplicationSummary {
  totalNodes: number
  suspectedAmplifiers: number
  duplicationIndexPct: number
  averageSimilarityPct: number | null
  fastestAmplificationDelaySec: number | null
}

interface Props {
  nodes: AmplificationNode[]
  edges: AmplificationEdge[]
  summary?: DuplicationSummary
}

const props = defineProps<Props>()

const selectedNodeId = ref<string>('node_origin')

// Keep selectedNodeId in sync when nodes change
watch(() => props.nodes, (newNodes) => {
  if (newNodes && newNodes.length > 0) {
    if (!newNodes.some(n => n.id === selectedNodeId.value)) {
      selectedNodeId.value = newNodes[0].id
    }
  }
}, { immediate: true })

const selectedNode = computed<AmplificationNode | null>(() => {
  if (!props.nodes || props.nodes.length === 0) return null
  return props.nodes.find(n => n.id === selectedNodeId.value) || props.nodes[0] || null
})

const CENTER = { x: 280, y: 160 }

/**
 * Layout radial bertingkat untuk graf hasil analisa (node memiliki `depth`):
 * origin di tengah, penyebar level-1 di cincin pertama, duplikasi lanjutan di cincin luar dekat induknya.
 */
const tieredPositions = computed<Record<string, { x: number; y: number }> | null>(() => {
  if (!props.nodes.length || props.nodes.some(n => n.depth === undefined)) return null
  const ids = new Set(props.nodes.map(n => n.id))
  const children = new Map<string, AmplificationNode[]>()
  let root: AmplificationNode | undefined
  for (const n of props.nodes) {
    // Simpul yang induknya tersaring filter dianggap menempel ke origin
    const parentId = n.parentId && ids.has(n.parentId) ? n.parentId : undefined
    if (n.role === 'origin') root = n
    else {
      const key = parentId ?? '__root__'
      if (!children.has(key)) children.set(key, [])
      children.get(key)!.push(n)
    }
  }
  if (!root) return null
  const maxDepth = Math.max(1, ...props.nodes.map(n => n.depth ?? 0))
  // Cincin pertama tetap lebar agar penyebar level-1 tidak menumpuk di sekitar origin
  const ringScale = (level: number) => (maxDepth === 1 ? 1 : 0.4 + (0.6 * (level - 1)) / (maxDepth - 1))
  const positions: Record<string, { x: number; y: number }> = { [root.id]: { ...CENTER } }

  // Bobot sudut = jumlah daun di subtree agar cabang besar mendapat ruang lebih
  const leafCount = (id: string): number => {
    const kids = children.get(id) ?? []
    return kids.length ? kids.reduce((s, k) => s + leafCount(k.id), 0) : 1
  }

  const place = (parentId: string, kids: AmplificationNode[], start: number, end: number, level: number) => {
    const total = kids.reduce((s, k) => s + leafCount(k.id), 0)
    let cursor = start
    for (const kid of kids) {
      const span = ((end - start) * leafCount(kid.id)) / total
      const angle = cursor + span / 2
      positions[kid.id] = {
        x: Math.round(CENTER.x + 250 * ringScale(level) * Math.cos(angle)),
        y: Math.round(CENTER.y + 140 * ringScale(level) * Math.sin(angle))
      }
      place(kid.id, children.get(kid.id) ?? [], cursor, cursor + span, level + 1)
      cursor += span
    }
  }

  const firstLevel = [...(children.get(root.id) ?? []), ...(children.get('__root__') ?? [])]
  place(root.id, firstLevel, -Math.PI / 2, (3 * Math.PI) / 2, 1)
  return positions
})

const showAllLabels = computed(() => props.nodes.length <= 12)

// Layout coordinates computation for interactive SVG graph (supports preset & dynamic nodes)
const nodeCoordinates = computed(() => {
  const coords: Record<string, { x: number; y: number; color: string; ringColor: string; radius: number }> = {}

  const presets: Record<string, { x: number; y: number }> = {
    node_origin: { x: 280, y: 160 },
    node_kol_1: { x: 170, y: 80 },
    node_tiktok_1: { x: 390, y: 80 },
    node_bot_cluster_1: { x: 110, y: 220 },
    node_news_1: { x: 250, y: 260 },
    node_youtube_1: { x: 420, y: 230 }
  }

  const roleStyles: Record<string, { color: string; ringColor: string; radius: number }> = {
    origin: { color: '#7E2032', ringColor: '#D4AF37', radius: 26 },
    kol: { color: '#B8860B', ringColor: '#E4CF9A', radius: 20 },
    bot_suspect: { color: '#DC2626', ringColor: '#FECACA', radius: 18 },
    news_media: { color: '#1E3A8A', ringColor: '#93C5FD', radius: 22 },
    amplifier: { color: '#892336', ringColor: '#DF9FA8', radius: 18 }
  }

  const defaultStyle = { color: '#64748B', ringColor: '#CBD5E1', radius: 18 }

  const nonOriginNodes = props.nodes.filter(n => n.role !== 'origin' && n.id !== 'node_origin')
  const totalOther = Math.max(nonOriginNodes.length, 1)
  const tiered = tieredPositions.value

  props.nodes.forEach((node, index) => {
    const style = { ...(roleStyles[node.role] || defaultStyle) }
    if (tiered) {
      const count = props.nodes.length
      style.radius = node.role === 'origin' ? 20 : count > 30 ? 7 : count > 15 ? 11 : style.radius
    }
    let pos = tiered?.[node.id] ?? presets[node.id]

    if (!pos) {
      if (node.role === 'origin' || node.id === 'node_origin') {
        pos = { x: 280, y: 160 }
      } else {
        const otherIdx = nonOriginNodes.findIndex(n => n.id === node.id)
        const angle = (otherIdx >= 0 ? otherIdx : index) * ((2 * Math.PI) / totalOther) - Math.PI / 2
        const rx = 170
        const ry = 95
        pos = {
          x: Math.round(280 + rx * Math.cos(angle)),
          y: Math.round(160 + ry * Math.sin(angle))
        }
      }
    }

    coords[node.id] = {
      x: pos.x,
      y: pos.y,
      color: style.color,
      ringColor: style.ringColor,
      radius: style.radius
    }
  })

  return coords
})

// Safe computed lists avoiding Vue 3 v-if/v-for priority conflict
const validEdges = computed(() => {
  return props.edges.filter(edge => 
    edge && 
    nodeCoordinates.value[edge.source] && 
    nodeCoordinates.value[edge.target]
  )
})

const validNodes = computed(() => {
  return props.nodes.filter(node => 
    node && 
    nodeCoordinates.value[node.id]
  )
})

function formatSeconds(sec: number): string {
  if (sec === 0) return 'Titik Awal (0 dtk)'
  if (sec < 60) return `+${sec} detik`
  if (sec < 3600) {
    const rem = sec % 60
    return `+${Math.floor(sec / 60)} menit${rem > 0 ? ` ${rem} dtk` : ''}`
  }
  if (sec < 86400) {
    const min = Math.floor((sec % 3600) / 60)
    return `+${Math.floor(sec / 3600)} jam${min > 0 ? ` ${min} menit` : ''}`
  }
  const hours = Math.floor((sec % 86400) / 3600)
  return `+${Math.floor(sec / 86400)} hari${hours > 0 ? ` ${hours} jam` : ''}`
}
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-5 shadow-parchment">
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-monastic-700">
      <div>
        <h3 class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <Network class="w-5 h-5 text-claret-700 dark:text-brass-400" />
          <span>Graf Jaringan Pemantik & Duplikasi (Amplification Network)</span>
        </h3>
        <p class="text-xs text-parchment-500 dark:text-parchment-400">
          Visualisasi aliran penyebaran: dari akun pemantik (node emas) ke akun penduplikasi & media arus utama
        </p>
      </div>

      <!-- Quick Legend -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span 
          class="flex items-center gap-1 cursor-help"
          title="Simpul Pemantik (Origin): Akun atau kanal pertama yang memicu awal penyebaran narasi di ruang publik"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-claret-700 ring-2 ring-brass-400"></span>
          <span>Origin</span>
        </span>
        <span 
          class="flex items-center gap-1 cursor-help"
          title="Simpul Pengganda (KOL / Influencer): Tokoh berbobot pengikut besar yang mempercepat laju viralisasi"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>KOL / Multiplier</span>
        </span>
        <span 
          class="flex items-center gap-1 cursor-help"
          title="Klaster Akun Robot / Buzzer: Jaringan akun dengan pola unggahan serempak dan kemiripan teks tinggi (>85%)"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <span>Bot / Buzzer Ring</span>
        </span>
        <span 
          class="flex items-center gap-1 cursor-help"
          title="Media Berita Arus Utama: Portal berita nasional berbadan hukum pers yang meliput polemik isu"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
          <span>Media Berita</span>
        </span>
      </div>
    </div>

    <!-- Duplication Index (FR-1.2.3) -->
    <div v-if="summary" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <div class="p-2.5 rounded-lg bg-parchment-50 dark:bg-monastic-900/60 border border-parchment-200 dark:border-monastic-700">
        <span class="block text-[11px] text-parchment-500">Simpul Terpetakan</span>
        <span class="font-mono font-bold text-sm text-parchment-900 dark:text-parchment-100">{{ summary.totalNodes }}</span>
      </div>
      <div
        class="p-2.5 rounded-lg bg-parchment-50 dark:bg-monastic-900/60 border border-parchment-200 dark:border-monastic-700"
        title="Persentase publikasi turunan dengan kemiripan narasi ≥ 60% terhadap induknya"
      >
        <span class="block text-[11px] text-parchment-500">Duplication Index</span>
        <span class="font-mono font-bold text-sm text-claret-800 dark:text-brass-300">{{ summary.duplicationIndexPct }}%</span>
      </div>
      <div
        class="p-2.5 rounded-lg bg-parchment-50 dark:bg-monastic-900/60 border border-parchment-200 dark:border-monastic-700"
        title="Publikasi dengan kemiripan ≥ 85% (indikasi salin-tempel)"
      >
        <span class="block text-[11px] text-parchment-500">Salin-Tempel</span>
        <span class="font-mono font-bold text-sm text-red-600">{{ summary.suspectedAmplifiers }}</span>
      </div>
      <div class="p-2.5 rounded-lg bg-parchment-50 dark:bg-monastic-900/60 border border-parchment-200 dark:border-monastic-700">
        <span class="block text-[11px] text-parchment-500">Duplikasi Tercepat</span>
        <span class="font-mono font-bold text-sm text-parchment-900 dark:text-parchment-100">
          {{ summary.fastestAmplificationDelaySec !== null ? formatSeconds(summary.fastestAmplificationDelaySec) : '—' }}
        </span>
      </div>
    </div>

    <!-- Graph Canvas & Node Inspector Grid -->
    <div class="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Interactive SVG Network Canvas -->
      <div class="lg:col-span-8 bg-parchment-50 dark:bg-monastic-900/80 rounded-lg border border-parchment-200 dark:border-monastic-700/80 p-3 overflow-hidden">
        <div v-if="validNodes.length === 0" class="h-[280px] flex flex-col items-center justify-center text-center p-6 text-parchment-400">
          <Network class="w-10 h-10 mb-2 opacity-30 text-parchment-500" />
          <p class="text-xs font-semibold text-parchment-700 dark:text-parchment-300">
            Tidak ada simpul amplifikasi yang sesuai dengan filter sumber media saat ini.
          </p>
          <p class="text-[11px] text-parchment-500 mt-1">
            Aktifkan kembali sumber media pada bilah filter di atas untuk melihat alur penyebaran.
          </p>
        </div>

        <template v-else>
          <svg 
            viewBox="0 0 560 320" 
            class="w-full h-auto select-none"
          >
            <!-- Defs for arrows and gradients -->
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#B8AB96" />
              </marker>
            </defs>

            <!-- Edges (Relasi Garis Duplikasi) -->
            <g class="edges">
              <line 
                v-for="(edge, idx) in validEdges"
                :key="'edge_' + idx"
                :x1="nodeCoordinates[edge.source]?.x || 280"
                :y1="nodeCoordinates[edge.source]?.y || 160"
                :x2="nodeCoordinates[edge.target]?.x || 280"
                :y2="nodeCoordinates[edge.target]?.y || 160"
                stroke="#D5CCBD"
                stroke-width="2.5"
                stroke-dasharray="4 2"
                marker-end="url(#arrow)"
                class="transition-all"
              />
            </g>

            <!-- Nodes (Simpul Akun) -->
            <g class="nodes cursor-pointer">
              <g
                v-for="node in validNodes"
                :key="node.id"
                :transform="`translate(${nodeCoordinates[node.id]?.x || 280}, ${nodeCoordinates[node.id]?.y || 160})`"
                @click="selectedNodeId = node.id"
                :title="`Simpul: ${node.authorName} (${node.authorHandle}) • Peran: ${node.role} • Platform: ${node.platform} • Selisih Waktu: ${formatSeconds(node.delaySec)} • Klik untuk menginspeksi metrik lengkap.`"
                class="group"
              >
                <!-- Outer Glow / Halo on Selected -->
                <circle 
                  v-if="selectedNodeId === node.id"
                  :r="(nodeCoordinates[node.id]?.radius || 18) + 9"
                  fill="none"
                  :stroke="nodeCoordinates[node.id]?.ringColor || '#D4AF37'"
                  stroke-width="2.5"
                  stroke-dasharray="3 3"
                  class="animate-spin"
                  style="animation-duration: 8s"
                />

                <!-- Outer Ring -->
                <circle 
                  :r="(nodeCoordinates[node.id]?.radius || 18) + 3"
                  fill="none"
                  :stroke="nodeCoordinates[node.id]?.ringColor || '#CBD5E1'"
                  stroke-width="2"
                />

                <!-- Node Body -->
                <circle 
                  :r="nodeCoordinates[node.id]?.radius || 18"
                  :fill="nodeCoordinates[node.id]?.color || '#64748B'"
                  class="transition-transform group-hover:scale-110 shadow-lg"
                />

                <!-- Node Label Initial -->
                <text 
                  text-anchor="middle" 
                  dy=".35em" 
                  fill="#FFFFFF" 
                  :font-size="Math.max(7, Math.min(11, (nodeCoordinates[node.id]?.radius || 18) * 0.75))"
                  font-weight="bold" 
                  font-family="sans-serif"
                >
                  {{ node.role === 'origin' ? '★' : (node.authorName ? node.authorName.charAt(0) : 'A') }}
                </text>

                <!-- Node Text Label Underneath -->
                <text 
                  v-if="showAllLabels || node.role === 'origin' || selectedNodeId === node.id"
                  text-anchor="middle" 
                  :y="(nodeCoordinates[node.id]?.radius || 18) + 14" 
                  fill="#5E626E" 
                  class="dark:fill-parchment-300"
                  font-size="10" 
                  font-weight="600"
                >
                  {{ node.authorHandle }}
                </text>
              </g>
            </g>
          </svg>

          <p class="text-[11px] text-center text-parchment-500 mt-2">
            Ketuk simpul untuk memeriksa waktu tunda, kemiripan teks, dan sumbernya.
          </p>
        </template>
      </div>

      <!-- Node Inspector Panel -->
      <div v-if="selectedNode" class="lg:col-span-4 bg-parchment-50/70 dark:bg-monastic-900/60 p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-parchment-200 dark:border-monastic-700">
          <span 
            class="text-xs font-semibold uppercase tracking-wider text-parchment-600 dark:text-parchment-300"
            title="Panel inspeksi forensik mendalam untuk akun/simpul yang saat ini sedang dipilih"
          >
            Inspeksi Simpul Terpilih
          </span>
          <Badge 
            :variant="selectedNode.role === 'origin' ? 'brass' : selectedNode.role === 'bot_suspect' ? 'negative' : 'default'"
            :title="'Peran simpul dalam jejaring: ' + selectedNode.role"
          >
            {{ selectedNode.role }}
          </Badge>
        </div>

        <div>
          <h4 class="font-bold text-sm text-parchment-900 dark:text-parchment-50">
            {{ selectedNode.authorName }}
          </h4>
          <span class="text-xs font-mono text-parchment-500">
            {{ selectedNode.authorHandle }} &bull; Platform: {{ selectedNode.platform }}
          </span>
        </div>

        <!-- Metrics Comparison -->
        <div class="space-y-2 text-xs">
          <!-- Delay from origin -->
          <div 
            class="flex items-center justify-between p-2 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700"
            title="Waktu tunda kemunculan unggahan simpul ini dihitung dari timestamp pertama akun pemantik (origin)"
          >
            <span class="flex items-center gap-1 text-parchment-600 dark:text-parchment-400">
              <Clock class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" />
              Selisih Waktu (Delay)
            </span>
            <span class="font-mono font-bold text-claret-800 dark:text-brass-300">
              {{ formatSeconds(selectedNode.delaySec) }}
            </span>
          </div>

          <!-- Similarity Score -->
          <div 
            class="flex items-center justify-between p-2 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700"
            title="Skor kemiripan gabungan Jaccard (kata) dan Levenshtein (karakter) terhadap simpul induk. Skor di atas 85% menandakan indikasi kuat duplikasi/salin-tempel otomatis."
          >
            <span class="flex items-center gap-1 text-parchment-600 dark:text-parchment-400">
              <Copy class="w-3.5 h-3.5 text-amber-600" />
              Kemiripan Teks (Jaccard + Levenshtein)
            </span>
            <span class="font-mono font-bold" :class="selectedNode.similarityScore > 0.85 ? 'text-red-600' : 'text-emerald-600'">
              {{ Math.round(selectedNode.similarityScore * 100) }}%
            </span>
          </div>

          <!-- Estimated Reach -->
          <div 
            class="flex items-center justify-between p-2 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700"
            title="Estimasi total audiens (pengikut/pembaca) yang terjangkau oleh simpul ini"
          >
            <span class="text-parchment-600 dark:text-parchment-400">Jangkauan Amplifikasi</span>
            <span class="font-mono font-bold text-parchment-900 dark:text-parchment-100">
              {{ selectedNode.reach > 0 ? selectedNode.reach.toLocaleString('id-ID') : 'N/A' }}
            </span>
          </div>
        </div>

        <!-- Content snippet -->
        <div 
          class="p-3 rounded bg-white dark:bg-monastic-800 border border-parchment-200 dark:border-monastic-700"
          title="Penggalan isi narasi teks yang diunggah oleh simpul ini"
        >
          <span class="block text-[11px] font-semibold text-parchment-500 mb-1">Cuplikan Narasi:</span>
          <p class="text-xs text-parchment-700 dark:text-parchment-300 italic line-clamp-3">
            "{{ selectedNode.contentSnippet }}"
          </p>
          <a
            v-if="selectedNode.url"
            :href="selectedNode.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block mt-1.5 text-[11px] font-semibold text-claret-700 dark:text-brass-400 hover:underline"
          >
            Buka sumber asli
          </a>
        </div>

        <div 
          v-if="selectedNode.role === 'bot_suspect'" 
          class="flex items-start gap-2 p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-[11px]"
          title="Peringatan anomali: Aktivitas otomatis atau buzzer terkoordinasi terdeteksi"
        >
          <ShieldAlert class="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Terindikasi salin-tempel: kemiripan {{ Math.round(selectedNode.similarityScore * 100) }}% terhadap simpul induk,
            muncul {{ formatSeconds(selectedNode.delaySec) }} setelah pemantik.
          </span>
        </div>
      </div>

      <div v-else class="lg:col-span-4 bg-parchment-50/70 dark:bg-monastic-900/60 p-6 rounded-lg border border-dashed border-parchment-300 dark:border-monastic-700 flex flex-col items-center justify-center text-center space-y-2 text-parchment-500">
        <Info class="w-8 h-8 opacity-40 text-parchment-400" />
        <h4 class="font-bold text-xs text-parchment-800 dark:text-parchment-200">
          Tidak Ada Simpul Terpilih
        </h4>
        <p class="text-[11px] leading-relaxed">
          Aktifkan filter sumber atau pilih isu dengan jejaring amplifikasi aktif untuk menganalisis simpul.
        </p>
      </div>
    </div>
  </div>
</template>
