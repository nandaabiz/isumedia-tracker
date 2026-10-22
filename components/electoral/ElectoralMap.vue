<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Map } from 'lucide-vue-next'
import type { ProvinceElectoralData, ElectionYear, VoterClassification } from '~/types/electoral'
import { PARTY_COLORS } from '~/lib/electoral-data'

interface Props {
  provinces: ProvinceElectoralData[]
  selectedProvinceId: string
  selectedYear: ElectionYear
  category: 'presidential' | 'legislative' | 'voter_profile'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'selectProvince', id: string): void
}>()

const NO_DATA_COLOR = '#B8AB96'
const CLASSIFICATION_STYLE: Record<VoterClassification, { color: string; label: string }> = {
  stronghold: { color: '#7E2032', label: 'Kandang loyalis' },
  leaning_loyal: { color: '#1E3A8A', label: 'Condong loyalis' },
  battleground: { color: '#C59B27', label: 'Medan pertempuran' },
  volatile: { color: '#475569', label: 'Anomali' },
  insufficient: { color: NO_DATA_COLOR, label: 'Data belum cukup' }
}

const mapContainer = ref<HTMLElement | null>(null)
let leafletMap: any = null
let markersGroup: any = null

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function markerInfo(prov: ProvinceElectoralData): { color: string; label: string } {
  const year = props.selectedYear
  if (props.category === 'presidential') {
    const winner = prov.presidential[year]?.candidates.find(c => c.isWinner)
    return winner ? { color: winner.colorHex, label: winner.name } : { color: NO_DATA_COLOR, label: 'Tidak ada data' }
  }
  if (props.category === 'legislative') {
    const winner = prov.legislative[year]?.winnerParty
    return winner ? { color: PARTY_COLORS[winner].hex, label: PARTY_COLORS[winner].name } : { color: NO_DATA_COLOR, label: 'Tidak ada data' }
  }
  return CLASSIFICATION_STYLE[prov.voterProfile.classification]
}

/** Legenda dibangun dari nilai yang benar-benar tampil di peta, diurutkan menurut jumlah provinsi */
const legend = computed(() => {
  const counts = new globalThis.Map<string, { color: string; label: string; count: number }>()
  for (const prov of props.provinces) {
    const info = markerInfo(prov)
    const entry = counts.get(info.label) ?? { ...info, count: 0 }
    entry.count++
    counts.set(info.label, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
})

async function initMap() {
  if (typeof window === 'undefined' || !mapContainer.value) return
  const L = (await import('leaflet')).default

  if (leafletMap) leafletMap.remove()

  leafletMap = L.map(mapContainer.value, {
    zoomSnap: 0.25,
    minZoom: 3,
    maxZoom: 9,
    scrollWheelZoom: false
  })
  // Seluruh Sabang–Merauke selalu terlihat, berapa pun lebar layar
  leafletMap.fitBounds([[6.2, 94.8], [-11.2, 141.2]], { padding: [6, 6] })

  // Esri Canvas abu-abu netral tanpa API key; varian gelap mengikuti tema
  const canvas = document.documentElement.classList.contains('dark') ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'
  L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${canvas}/MapServer/tile/{z}/{y}/{x}`, {
    attribution: 'Peta dasar &copy; Esri • Data: KPU 2014–2024',
    maxNativeZoom: 16
  }).addTo(leafletMap)

  markersGroup = L.layerGroup().addTo(leafletMap)
  renderMarkers(L)
}

async function renderMarkers(LInstance?: any) {
  if (!leafletMap || !markersGroup) return
  const L = LInstance || (await import('leaflet')).default
  markersGroup.clearLayers()

  for (const prov of props.provinces) {
    const { color, label } = markerInfo(prov)
    const isSelected = prov.id === props.selectedProvinceId
    const size = isSelected ? 24 : 16

    const icon = L.divIcon({
      html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSelected ? '3px solid #D4AF37' : '2px solid #FAF8F5'};box-shadow:0 2px 6px rgba(40,30,20,0.35);"></span>`,
      className: 'custom-prov-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    })

    const marker = L.marker(prov.coordinates, {
      icon,
      title: prov.name,
      keyboard: true,
      riseOnHover: true,
      zIndexOffset: isSelected ? 1000 : 0
    })
    marker.on('click', () => emit('selectProvince', prov.id))

    const dpt = prov.dpt[props.selectedYear]
    marker.bindTooltip(
      `<strong>${escapeHtml(prov.name)}</strong><br><span style="font-size:11px">${escapeHtml(label)}${dpt ? ` • DPT ${dpt.toLocaleString('id-ID')}` : ''}</span>`,
      { direction: 'top', offset: [0, -size / 2] }
    )
    markersGroup.addLayer(marker)
  }
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
})

watch(() => [props.selectedYear, props.category, props.selectedProvinceId, props.provinces], () => {
  renderMarkers()
})
</script>

<template>
  <section class="relative w-full rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-4 shadow-parchment overflow-hidden" aria-labelledby="map-heading">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-parchment-200 dark:border-monastic-700">
      <h3 id="map-heading" class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
        <Map class="w-5 h-5 text-claret-700 dark:text-brass-400" aria-hidden="true" />
        Peta pemilu {{ selectedYear }}
      </h3>
      <span class="text-xs text-parchment-600 dark:text-parchment-400">
        Warna: {{ category === 'presidential' ? 'capres pemenang' : category === 'legislative' ? 'partai pemenang Pileg DPR' : 'klasifikasi loyalis vs swing' }}
      </span>
    </div>

    <div
      ref="mapContainer"
      class="w-full h-[360px] sm:h-[440px] rounded-lg overflow-hidden border border-parchment-300 dark:border-monastic-700 z-0"
      role="region"
      aria-label="Peta interaktif 38 provinsi. Pilih provinsi melalui penanda atau tabel matriks di bawah."
    />

    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-parchment-700 dark:text-parchment-300" aria-label="Legenda peta">
      <li v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10" :style="{ backgroundColor: item.color }" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span class="font-mono tabular-nums text-parchment-500">{{ item.count }}</span>
      </li>
    </ul>
    <p class="text-[11px] text-parchment-500 mt-2">
      Ketuk penanda provinsi untuk membuka profil pemilih, Indeks Pedersen, dan pola split-ticket.
    </p>
  </section>
</template>
