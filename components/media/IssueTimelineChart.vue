<script setup lang="ts">
import { ref, computed } from 'vue'
import { BarChart3 } from 'lucide-vue-next'
import type { IssueAnalysis } from '~/types/issue'

interface Props {
  timeline: IssueAnalysis['timeline']
}

const props = defineProps<Props>()

// Palet divergen tervalidasi (skill dataviz): biru = positif, abu = netral (titik tengah), oranye = negatif
const SERIES = [
  { key: 'negative', label: 'Negatif', className: 'bg-[#EA580C]' },
  { key: 'neutral', label: 'Netral', className: 'bg-[#94A3B8] dark:bg-[#64748B]' },
  { key: 'positive', label: 'Positif', className: 'bg-[#2563EB] dark:bg-[#3B82F6]' }
] as const

const activeIndex = ref<number | null>(null)

const days = computed(() => props.timeline.map(d => ({ ...d, total: d.positive + d.neutral + d.negative })))
const maxTotal = computed(() => Math.max(1, ...days.value.map(d => d.total)))
const ticks = computed(() => {
  const step = Math.max(1, Math.ceil(maxTotal.value / 3))
  return [0, step, step * 2, step * 3].filter(t => t <= Math.max(maxTotal.value, step))
})
const scaleMax = computed(() => ticks.value[ticks.value.length - 1] || 1)
const labelEvery = computed(() => Math.ceil(days.value.length / 7))

const formatDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })
</script>

<template>
  <section class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-4 sm:p-5 shadow-parchment" aria-labelledby="timeline-heading">
    <div class="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-parchment-200 dark:border-monastic-700">
      <div>
        <h3 id="timeline-heading" class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-claret-700 dark:text-brass-400" aria-hidden="true" />
          Volume publikasi harian
        </h3>
        <p class="text-xs text-parchment-600 dark:text-parchment-400">Jumlah publikasi per hari (WIB) menurut sentimen</p>
      </div>
      <ul class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-parchment-700 dark:text-parchment-300" aria-label="Legenda">
        <li v-for="s in [...SERIES].reverse()" :key="s.key" class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-sm" :class="s.className" aria-hidden="true" />
          {{ s.label }}
        </li>
      </ul>
    </div>

    <p v-if="!days.length" class="mt-4 p-6 text-center text-xs text-parchment-500 rounded-lg border border-dashed border-parchment-300 dark:border-monastic-700">
      Linimasa muncul setelah perayapan topik ini menghasilkan publikasi.
    </p>

    <template v-else>
      <div class="mt-4 flex gap-2">
        <!-- Sumbu Y -->
        <div class="relative w-6 h-44 shrink-0 text-[10px] font-mono tabular-nums text-parchment-500" aria-hidden="true">
          <span
            v-for="t in ticks"
            :key="t"
            class="absolute right-0"
            :style="{ bottom: `${(t / scaleMax) * 100}%`, transform: 'translateY(50%)' }"
          >{{ t }}</span>
        </div>

        <div class="relative flex-1 min-w-0">
          <!-- Garis grid samar -->
          <div class="absolute inset-x-0 top-0 h-44 pointer-events-none" aria-hidden="true">
            <div
              v-for="t in ticks"
              :key="t"
              class="absolute inset-x-0 border-t"
              :class="t === 0 ? 'border-parchment-400 dark:border-monastic-600' : 'border-parchment-200 dark:border-monastic-700/70'"
              :style="{ bottom: `${(t / scaleMax) * 100}%` }"
            />
          </div>

          <div class="relative h-44 flex items-end gap-1 sm:gap-1.5" role="list" aria-label="Volume publikasi per hari">
            <div
              v-for="(d, i) in days"
              :key="d.date"
              role="listitem"
              tabindex="0"
              class="relative flex-1 h-full flex items-end justify-center focus:outline-none group"
              :aria-label="`${formatDay(d.date)}: ${d.total} publikasi, positif ${d.positive}, netral ${d.neutral}, negatif ${d.negative}`"
              @mouseenter="activeIndex = i"
              @mouseleave="activeIndex = null"
              @focus="activeIndex = i"
              @blur="activeIndex = null"
            >
              <div
                class="w-full max-w-[28px] flex flex-col-reverse gap-[2px] rounded-t-[4px] overflow-hidden transition-opacity"
                :class="activeIndex !== null && activeIndex !== i ? 'opacity-50' : ''"
                :style="{ height: `${(d.total / scaleMax) * 100}%` }"
              >
                <div
                  v-for="s in SERIES"
                  v-show="d[s.key] > 0"
                  :key="s.key"
                  :class="s.className"
                  :style="{ flexGrow: d[s.key], flexBasis: 0 }"
                />
              </div>

              <div
                v-if="activeIndex === i"
                class="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 p-2.5 rounded-lg border border-parchment-300 dark:border-monastic-600 bg-white dark:bg-monastic-900 shadow-parchment-lg text-[11px] pointer-events-none"
                role="tooltip"
              >
                <span class="block font-semibold text-parchment-900 dark:text-parchment-100">{{ formatDay(d.date) }}</span>
                <span class="block font-mono tabular-nums text-parchment-600 dark:text-parchment-400 mb-1">{{ d.total }} publikasi</span>
                <span v-for="s in [...SERIES].reverse()" :key="s.key" class="flex items-center justify-between gap-2 text-parchment-700 dark:text-parchment-300">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm" :class="s.className" />{{ s.label }}</span>
                  <span class="font-mono tabular-nums">{{ d[s.key] }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="mt-1.5 flex gap-1 sm:gap-1.5 text-[10px] text-parchment-500" aria-hidden="true">
            <span v-for="(d, i) in days" :key="d.date" class="flex-1 text-center truncate">
              {{ i % labelEvery === 0 ? formatDay(d.date) : '' }}
            </span>
          </div>
        </div>
      </div>

      <details class="mt-3 text-xs">
        <summary class="cursor-pointer select-none h-9 inline-flex items-center font-semibold text-claret-700 dark:text-brass-400">Lihat sebagai tabel</summary>
        <div class="overflow-x-auto">
          <table class="w-full mt-1 text-left">
            <thead class="text-[11px] uppercase tracking-wider text-parchment-500">
              <tr>
                <th scope="col" class="py-1.5 pr-3 font-semibold">Tanggal</th>
                <th scope="col" class="py-1.5 pr-3 font-semibold text-right">Positif</th>
                <th scope="col" class="py-1.5 pr-3 font-semibold text-right">Netral</th>
                <th scope="col" class="py-1.5 pr-3 font-semibold text-right">Negatif</th>
                <th scope="col" class="py-1.5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-parchment-200 dark:divide-monastic-700 text-parchment-800 dark:text-parchment-200">
              <tr v-for="d in days" :key="d.date">
                <td class="py-1.5 pr-3">{{ formatDay(d.date) }}</td>
                <td class="py-1.5 pr-3 text-right">{{ d.positive }}</td>
                <td class="py-1.5 pr-3 text-right">{{ d.neutral }}</td>
                <td class="py-1.5 pr-3 text-right">{{ d.negative }}</td>
                <td class="py-1.5 text-right font-semibold">{{ d.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
  </section>
</template>
