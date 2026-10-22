<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-vue-next'
import type { RegionalIssueStat } from '~/types/issue'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  stats: RegionalIssueStat[]
}

const props = defineProps<Props>()

const expandedCode = ref<string | null>(null)

watch(() => props.stats, () => {
  expandedCode.value = null
})

function toggleProvince(code: string) {
  expandedCode.value = expandedCode.value === code ? null : code
}

const maxCount = computed(() => {
  if (!props.stats || !props.stats.length) return 1
  return Math.max(...props.stats.map(s => s.mentionCount))
})
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-5 shadow-parchment">
    <div class="flex items-center justify-between pb-3 border-b border-parchment-200 dark:border-monastic-700">
      <div>
        <h3 
          class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2"
          title="Pemetaan agregasi wilayah perbincangan publik berdasarkan algoritma Named Entity Recognition (NER) yang mendeteksi toponimi dan nama daerah di Indonesia."
        >
          <MapPin class="w-5 h-5 text-claret-700 dark:text-brass-400" />
          <span>Sebaran Geografis Perbincangan Isu (Daerah Berkembang)</span>
        </h3>
        <p 
          class="text-xs text-parchment-500 dark:text-parchment-400"
          title="Data dihitung dari frekuensi kemunculan kata kunci wilayah di media massa nasional, lokal, dan media sosial resmi."
        >
          Intensitas pembicaraan isu berdasarkan ekstraksi entitas wilayah (NER) di 38 Provinsi
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!stats || stats.length === 0" class="mt-4 p-6 text-center text-xs text-parchment-500 rounded-lg border border-dashed border-parchment-300 dark:border-monastic-700" title="Belum ada data persebaran wilayah yang terindeks untuk topik ini.">
      Data sebaran wilayah untuk topik ini sedang dalam proses agregasi.
    </div>

    <!-- Regional Table & Intensity Bars -->
    <div v-else class="mt-4 space-y-3">
      <p class="text-[11px] text-parchment-500">
        {{ stats.length }} dari 38 provinsi terdeteksi. Klik provinsi untuk melihat publikasi yang menyebut wilayah tersebut.
      </p>
      <div
        v-for="item in stats"
        :key="item.provinceCode"
        class="rounded-lg border border-parchment-200 dark:border-monastic-700 bg-parchment-50/50 dark:bg-monastic-900/40 transition-colors"
      >
      <div
        role="button"
        tabindex="0"
        class="w-full text-left p-3.5 rounded-lg cursor-pointer hover:bg-parchment-100/60 dark:hover:bg-monastic-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400"
        :aria-expanded="expandedCode === item.provinceCode"
        :title="`Provinsi ${item.provinceName}: ${item.mentionCount.toLocaleString('id-ID')} sebutan perbincangan. Tingkat atensi: ${item.intensity}, Sentimen dominan: ${item.dominantSentiment}.`"
        @click="toggleProvince(item.provinceCode)"
        @keydown.enter.prevent="toggleProvince(item.provinceCode)"
        @keydown.space.prevent="toggleProvince(item.provinceCode)"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <span 
              class="font-bold text-sm text-parchment-900 dark:text-parchment-100"
              :title="`Kode Wilayah Administrasi BPS/Kemendagri: ${item.provinceCode}`"
            >
              {{ item.provinceName }}
            </span>
            <Badge 
              :variant="item.intensity === 'very_high' ? 'claret' : item.intensity === 'high' ? 'brass' : 'outline'"
              :title="`Kategori intensitas ${item.intensity === 'very_high' ? 'Sangat Tinggi (Pusat Perbincangan)' : item.intensity === 'high' ? 'Tinggi' : 'Sedang'} relatif terhadap provinsi lain`"
            >
              {{ item.intensity.replace('_', ' ') }}
            </Badge>
          </div>

          <div class="flex items-center gap-3">
            <Badge 
              :variant="item.dominantSentiment === 'negative' ? 'negative' : item.dominantSentiment === 'positive' ? 'positive' : 'neutral'"
              :title="`Kecenderungan emosi perbincangan masyarakat di provinsi ini: ${item.dominantSentiment.toUpperCase()}`"
            >
              Sentimen: {{ item.dominantSentiment }}
            </Badge>
            <span 
              class="font-mono text-xs font-bold text-parchment-900 dark:text-parchment-100"
              :title="`Total ${item.mentionCount.toLocaleString('id-ID')} artikel berita dan percakapan publik terverifikasi yang menyebut wilayah ini.`"
            >
              {{ item.mentionCount.toLocaleString('id-ID') }} sebutan
            </span>
            <component :is="expandedCode === item.provinceCode ? ChevronUp : ChevronDown" class="w-4 h-4 text-parchment-500" />
          </div>
        </div>

        <!-- Relative Progress Bar -->
        <div 
          class="w-full h-2 rounded-full bg-parchment-200 dark:bg-monastic-700 overflow-hidden mb-2"
          :title="`Persentase volume perbincangan: ${Math.round((item.mentionCount / maxCount) * 100)}% dari wilayah dengan volume tertinggi.`"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="item.intensity === 'very_high' ? 'bg-claret-700 dark:bg-brass-500' : 'bg-parchment-500 dark:bg-monastic-500'"
            :style="{ width: `${(item.mentionCount / maxCount) * 100}%` }"
          />
        </div>

        <!-- Local Headline / Context -->
        <p 
          class="text-xs text-parchment-600 dark:text-parchment-300 italic flex items-center gap-1.5"
          :title="`Kutipan berita riil atau perbincangan arus utama yang merepresentasikan dinamika isu di ${item.provinceName}.`"
        >
          <span class="text-parchment-400">&bull;</span>
          <span>Sorotan Lokal: "{{ item.localHeadline }}"</span>
        </p>
      </div>

      <!-- Drill-down publikasi per provinsi (FR-1.3.3) -->
      <div
        v-if="expandedCode === item.provinceCode"
        class="px-3.5 pb-3.5 border-t border-parchment-200 dark:border-monastic-700"
      >
        <p v-if="!item.posts?.length" class="pt-3 text-xs text-parchment-500">
          Daftar publikasi belum tersedia untuk data contoh. Jalankan sinkronisasi untuk memuat artikel riil.
        </p>
        <ul v-else class="pt-2 divide-y divide-parchment-200 dark:divide-monastic-700">
          <li v-for="post in item.posts" :key="post.id" class="py-2 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <a
                :href="post.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-semibold text-parchment-900 dark:text-parchment-100 hover:text-claret-700 dark:hover:text-brass-300 hover:underline inline-flex items-start gap-1"
              >
                <span>{{ post.title }}</span>
                <ExternalLink class="w-3 h-3 shrink-0 mt-0.5" />
              </a>
              <span class="block text-[11px] font-mono text-parchment-500">{{ post.source }} &bull; {{ post.publishedAt }}</span>
            </div>
            <Badge :variant="post.sentiment === 'negative' ? 'negative' : post.sentiment === 'positive' ? 'positive' : 'neutral'">
              {{ post.sentiment }}
            </Badge>
          </li>
        </ul>
      </div>
      </div>
    </div>
  </div>
</template>
