<script setup lang="ts">
import { Flame, Clock, Eye, ExternalLink, ShieldCheck, Share2 } from 'lucide-vue-next'
import type { OriginPost } from '~/types/issue'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  origin?: OriginPost | null
}

const props = defineProps<Props>()

function formatMetric(value: number): string {
  return value > 0 ? value.toLocaleString('id-ID') : 'N/A'
}
</script>

<template>
  <div v-if="origin" class="relative overflow-hidden rounded-xl border-2 border-brass-400 dark:border-brass-600 bg-gradient-to-br from-white via-parchment-50 to-brass-50/20 dark:from-monastic-800 dark:via-monastic-800/90 dark:to-monastic-900 shadow-brass p-5 sm:p-6">
    <!-- Liturgical Watermark / Origin Seal -->
    <div class="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-claret-900 dark:text-brass-400">
      <Flame class="w-48 h-48" />
    </div>

    <!-- Header & Origin Badge -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-monastic-700">
      <div class="flex items-center gap-2">
        <div 
          class="p-2 rounded-lg bg-claret-700 text-white shadow-sacramental"
          title="Simbol Pemantik Awal: Titik asal kemunculan narasi isu di media publik"
        >
          <Flame class="w-5 h-5 text-brass-300" aria-hidden="true" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span 
              class="font-serif font-bold text-base sm:text-lg text-claret-900 dark:text-parchment-50"
              title="Akun atau kanal pertama yang terdeteksi mengunggah narasi pemantik"
            >
              Pemantik Awal (Origin Account)
            </span>
            <Badge 
              variant="brass"
              title="Terverifikasi secara kronologis oleh algoritma Timestamp Zero sebagai publikasi paling awal sebelum terjadi duplikasi"
            >
              <ShieldCheck class="w-3 h-3 text-brass-700 dark:text-brass-300" aria-hidden="true" />
              Timestamp Zero
            </Badge>
          </div>
          <p class="text-xs text-parchment-500 dark:text-parchment-400">
            Publikasi paling awal yang terekam dalam jendela perayapan (7 hari terakhir) sebelum gelombang amplifikasi
          </p>
        </div>
      </div>

      <div 
        class="flex items-center gap-2 text-xs font-mono text-parchment-600 dark:text-parchment-300 bg-parchment-100 dark:bg-monastic-700/80 px-3 py-1.5 rounded-md border border-parchment-300 dark:border-monastic-600"
        title="Waktu penerbitan dokumen atau unggahan awal berdasarkan metadata asli"
      >
        <Clock class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" />
        <span>{{ origin.publishedAt }}</span>
      </div>
    </div>

    <!-- Content & Author Details -->
    <div class="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      <div class="md:col-span-8 space-y-3">
        <!-- Author Profile Bar -->
        <div 
          class="flex items-center gap-3"
          title="Profil pembuat konten pemantik dan kanal publikasi asal"
        >
          <div class="w-10 h-10 rounded-full bg-parchment-200 dark:bg-monastic-700 border border-parchment-300 dark:border-monastic-600 flex items-center justify-center font-bold text-claret-800 dark:text-brass-300 text-sm">
            {{ origin.authorName.charAt(0) }}
          </div>
          <div>
            <div class="font-semibold text-sm text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
              <span>{{ origin.authorName }}</span>
              <span class="text-xs font-normal font-mono text-parchment-500">{{ origin.authorHandle }}</span>
            </div>
            <p class="text-xs text-parchment-600 dark:text-parchment-400">
              {{ origin.authorRole }} &bull; Saluran: <span class="uppercase font-semibold text-claret-700 dark:text-brass-400">{{ origin.platform }}</span>
            </p>
          </div>
        </div>

        <!-- Raw Post Blockquote -->
        <blockquote class="relative pl-9 pr-4 py-3.5 rounded-lg bg-parchment-100/70 dark:bg-monastic-900/60 border border-parchment-200 dark:border-monastic-700 font-serif text-base sm:text-lg leading-snug text-parchment-900 dark:text-parchment-100">
          <span class="absolute left-3 top-1 font-serif text-4xl leading-none text-claret-700/40 dark:text-brass-400/50" aria-hidden="true">“</span>
          {{ origin.content }}
        </blockquote>
      </div>

      <!-- Quick Metrics & Link -->
      <div class="md:col-span-4 bg-white/70 dark:bg-monastic-700/40 p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 space-y-3">
        <div 
          class="text-xs font-semibold uppercase tracking-wider text-parchment-500"
          title="Metrik jangkauan dan interaksi publik langsung dari publikasi awal ini"
        >
          Metrik Penetrasi Awal
        </div>

        <div class="grid grid-cols-2 gap-2 text-center">
          <div 
            class="p-2 rounded bg-parchment-50 dark:bg-monastic-800/80 border border-parchment-200 dark:border-monastic-700"
            title="Estimasi jumlah impresi atau pasang mata yang terpapar konten awal ini secara organik"
          >
            <span class="block text-[11px] text-parchment-500">Jangkauan (Reach)</span>
            <span class="font-serif font-bold text-base text-claret-800 dark:text-brass-300">
              {{ formatMetric(origin.reach) }}
            </span>
          </div>

          <div 
            class="p-2 rounded bg-parchment-50 dark:bg-monastic-800/80 border border-parchment-200 dark:border-monastic-700"
            title="Total akumulasi respon publik (komentar, sebaran, kutipan narasi, dan reaksi)"
          >
            <span class="block text-[11px] text-parchment-500">Interaksi Publik</span>
            <span class="font-serif font-bold text-base text-parchment-900 dark:text-parchment-100">
              {{ formatMetric(origin.engagement) }}
            </span>
          </div>
        </div>

        <p v-if="origin.reach === 0 && origin.engagement === 0" class="text-[10px] text-parchment-500 leading-snug">
          N/A: sumber RSS tidak menyediakan metrik jangkauan dan interaksi.
        </p>

        <a
          :href="origin.url"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-parchment-200 hover:bg-parchment-300 dark:bg-monastic-700 dark:hover:bg-monastic-600 text-xs font-semibold text-parchment-900 dark:text-parchment-100 transition-colors cursor-pointer"
          title="Buka pranala resmi artikel atau unggahan asli di situs web penerbit publik"
        >
          <span>Buka Tautan Asli Publik</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </div>
  <div
    v-else
    class="rounded-xl border border-dashed border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-6 text-center space-y-1"
  >
    <Flame class="w-8 h-8 mx-auto text-parchment-400 opacity-60" />
    <p class="text-sm font-semibold text-parchment-800 dark:text-parchment-200">Pemantik awal belum ditemukan</p>
    <p class="text-xs text-parchment-500">
      Origin (Timestamp Zero) dihitung dari publikasi paling awal setelah perayapan pertama selesai.
    </p>
  </div>
</template>
