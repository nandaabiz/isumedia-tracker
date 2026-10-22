<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquareQuote, Tags, Users, ExternalLink } from 'lucide-vue-next'
import type { IssueAnalysis } from '~/types/issue'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  analysis: IssueAnalysis | null
}

const props = defineProps<Props>()

const sentimentBars = computed(() => {
  if (!props.analysis) return []
  const s = props.analysis.sentiment
  return [
    // Palet divergen yang sama dengan grafik linimasa (tervalidasi untuk buta warna)
    { key: 'positive', label: 'Positif', value: s.positive, barClass: 'bg-[#2563EB] dark:bg-[#3B82F6]' },
    { key: 'neutral', label: 'Netral', value: s.neutral, barClass: 'bg-[#94A3B8] dark:bg-[#64748B]' },
    { key: 'negative', label: 'Negatif', value: s.negative, barClass: 'bg-[#EA580C]' }
  ]
})
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-5 shadow-parchment">
    <div class="pb-3 border-b border-parchment-200 dark:border-monastic-700">
      <h3 class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
        <MessageSquareQuote class="w-5 h-5 text-claret-700 dark:text-brass-400" />
        <span>Analisa Sentimen & Narasi</span>
      </h3>
      <p class="text-xs text-parchment-500 dark:text-parchment-400">
        Klasifikasi sentimen leksikon 3-kelas, frasa kunci, entitas tokoh/organisasi, dan ringkasan ekstraktif pro–kontra
      </p>
    </div>

    <div
      v-if="!analysis"
      class="mt-4 p-6 text-center text-xs text-parchment-500 rounded-lg border border-dashed border-parchment-300 dark:border-monastic-700"
    >
      Analisa sentimen & narasi tersedia setelah perayapan topik ini menghasilkan publikasi.
    </div>

    <div v-else class="mt-4 space-y-5">
      <!-- Distribusi sentimen (FR-1.4.1) -->
      <div>
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="font-semibold text-parchment-700 dark:text-parchment-300">Distribusi Sentimen</span>
          <span class="font-mono text-parchment-500" title="Rata-rata skor polaritas -1 (negatif) s/d +1 (positif)">
            Skor rata-rata {{ analysis.sentiment.averageScore > 0 ? '+' : '' }}{{ analysis.sentiment.averageScore }}
          </span>
        </div>
        <div class="flex gap-[2px] h-3 w-full rounded-full overflow-hidden bg-parchment-200 dark:bg-monastic-700" role="img" :aria-label="sentimentBars.map(b => `${b.label} ${b.value}%`).join(', ')">
          <div v-for="bar in sentimentBars" :key="bar.key" :class="bar.barClass" :style="{ width: `${bar.value}%` }" />
        </div>
        <div class="mt-1.5 flex flex-wrap gap-3 text-[11px] text-parchment-600 dark:text-parchment-300">
          <span v-for="bar in sentimentBars" :key="bar.key" class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full" :class="bar.barClass" />
            {{ bar.label }} {{ bar.value }}%
          </span>
        </div>
      </div>

      <!-- Frasa kunci & entitas (FR-1.4.2) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span class="text-xs font-semibold text-parchment-700 dark:text-parchment-300 flex items-center gap-1.5 mb-2">
            <Tags class="w-3.5 h-3.5" /> Frasa Kunci
          </span>
          <p v-if="!analysis.keyPhrases.length" class="text-[11px] text-parchment-500">Belum ada frasa berulang.</p>
          <div v-else class="flex flex-wrap gap-1.5">
            <Badge v-for="k in analysis.keyPhrases" :key="k.phrase" variant="outline" class="normal-case">
              {{ k.phrase }} <span class="font-mono text-parchment-500">×{{ k.count }}</span>
            </Badge>
          </div>
        </div>
        <div>
          <span class="text-xs font-semibold text-parchment-700 dark:text-parchment-300 flex items-center gap-1.5 mb-2">
            <Users class="w-3.5 h-3.5" /> Entitas Tokoh & Organisasi
          </span>
          <p v-if="!analysis.entities.length" class="text-[11px] text-parchment-500">Belum ada entitas berulang.</p>
          <div v-else class="flex flex-wrap gap-1.5">
            <Badge v-for="e in analysis.entities" :key="e.entity" variant="claret" class="normal-case">
              {{ e.entity }} <span class="font-mono opacity-70">×{{ e.count }}</span>
            </Badge>
          </div>
        </div>
      </div>

      <!-- Ringkasan narasi pro & kontra (FR-1.4.3) -->
      <div class="space-y-3">
        <p class="text-xs leading-relaxed text-parchment-700 dark:text-parchment-300">
          {{ analysis.narrative.summary }}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <span class="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px] block mb-2">Narasi Pendukung</span>
            <p v-if="!analysis.narrative.pro.length" class="text-emerald-900/70 dark:text-emerald-200/70">Belum ada publikasi bernada positif.</p>
            <ul v-else class="space-y-2">
              <li v-for="q in analysis.narrative.pro" :key="q.url">
                <a :href="q.url" target="_blank" rel="noopener noreferrer" class="text-emerald-900 dark:text-emerald-200 hover:underline">
                  “{{ q.text }}” <ExternalLink class="inline w-3 h-3" />
                </a>
                <span class="block text-[11px] text-emerald-800/70 dark:text-emerald-300/70">{{ q.source }}</span>
              </li>
            </ul>
          </div>
          <div class="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
            <span class="font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[10px] block mb-2">Narasi Pengkritik</span>
            <p v-if="!analysis.narrative.contra.length" class="text-rose-900/70 dark:text-rose-200/70">Belum ada publikasi bernada negatif.</p>
            <ul v-else class="space-y-2">
              <li v-for="q in analysis.narrative.contra" :key="q.url">
                <a :href="q.url" target="_blank" rel="noopener noreferrer" class="text-rose-900 dark:text-rose-200 hover:underline">
                  “{{ q.text }}” <ExternalLink class="inline w-3 h-3" />
                </a>
                <span class="block text-[11px] text-rose-800/70 dark:text-rose-300/70">{{ q.source }}</span>
              </li>
            </ul>
          </div>
        </div>
        <p class="text-[10px] text-parchment-500">
          Ringkasan bersifat ekstraktif (kutipan judul publikasi asli), bukan teks generatif, agar dapat diverifikasi ke sumbernya.
        </p>
      </div>
    </div>
  </div>
</template>
