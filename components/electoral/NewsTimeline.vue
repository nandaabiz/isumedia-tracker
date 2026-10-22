<script setup lang="ts">
import { Newspaper, Calendar, ArrowUpRight, TrendingUp } from 'lucide-vue-next'
import type { ElectionNewsRecord } from '~/types/electoral'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  news: ElectionNewsRecord[]
  year: number
}

const props = defineProps<Props>()
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-5 shadow-parchment space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-parchment-200 dark:border-monastic-700">
      <div>
        <h3 
          class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2"
          title="Rekonstruksi kronologis peristiwa media, debat capres, dan disrupsi kebijakan penting yang mempengaruhi sentimen pemilih."
        >
          <Newspaper class="w-5 h-5 text-claret-700 dark:text-brass-400" />
          <span>Arsip Berita & Dinamika Isu Pemilu {{ year }}</span>
        </h3>
        <p 
          class="text-xs text-parchment-500 dark:text-parchment-400"
          title="Pemetaan korelasi langsung antara amplifikasi isu di pers nasional dan pergeseran suara elektoral di tingkat provinsi."
        >
          Korelasi peristiwa dan pemberitaan media penting terhadap migrasi suara pemilih
        </p>
      </div>
      <Badge 
        variant="brass"
        :title="`Tahun pemilu rujukan: ${year}`"
      >
        Pemilu {{ year }}
      </Badge>
    </div>

    <!-- Timeline list -->
    <div class="space-y-3">
      <div
        v-for="(item, idx) in news"
        :key="idx"
        class="p-4 rounded-lg border border-parchment-200 dark:border-monastic-700 bg-parchment-50/50 dark:bg-monastic-900/40 hover:bg-parchment-100/50 transition-colors space-y-2"
        :title="`Peristiwa media: ${item.headline} (${item.date}). Diterbitkan oleh ${item.source}. Dampak wilayah: ${item.provinceAffected}.`"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span 
            class="font-bold text-sm text-parchment-900 dark:text-parchment-100"
            :title="`Headline: ${item.headline}`"
          >
            {{ item.headline }}
          </span>
          <div 
            class="flex items-center gap-2 text-xs font-mono text-parchment-500"
            :title="`Tanggal publikasi atau momentum peristiwa: ${item.date}`"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ item.date }}</span>
          </div>
        </div>

        <p 
          class="text-xs text-parchment-700 dark:text-parchment-300 leading-relaxed"
          :title="`Uraian dampak analisis pergeseran suara pemilih dan polarisasi opini publik.`"
        >
          {{ item.impactDescription }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-parchment-200/60 dark:border-monastic-700/60 text-[11px]">
          <span class="text-parchment-500">
            Sumber: 
            <span 
              class="font-medium text-parchment-800 dark:text-parchment-200"
              :title="`Portal pers rujukan: ${item.source}`"
            >
              {{ item.source }}
            </span> 
            &bull; Wilayah Terdampak: 
            <span 
              class="font-medium text-claret-800 dark:text-brass-300"
              :title="`Provinsi atau kawasan yang mengalami resonansi elektoral terbesar: ${item.provinceAffected}`"
            >
              {{ item.provinceAffected }}
            </span>
          </span>

          <Badge 
            :variant="item.sentimentDirection === 'reinforced_incumbent' ? 'positive' : item.sentimentDirection === 'swung_to_challenger' ? 'brass' : 'outline'"
            :title="item.sentimentDirection === 'reinforced_incumbent' ? 'Pemberitaan ini mengonsolidasikan dan memperkuat basis dukungan kandidat petahana/keberlanjutan.' : 'Pemberitaan ini memicu migrasi suara pemilih mengambang (swing voters) ke arah kubu penantang/oposisi.'"
          >
            {{ item.sentimentDirection === 'reinforced_incumbent' ? 'Memperkuat Petahana' : 'Menggeser Suara Oposisi' }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
