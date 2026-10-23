<script setup lang="ts">
import { computed } from 'vue'
import { GitCompare } from 'lucide-vue-next'
import type { ElectionYear, SplitTicketResult } from '~/types/electoral'
import { NO_GUBERNATORIAL_ELECTION, PARTY_COLORS } from '~/lib/electoral-data'
import Badge from '~/components/ui/Badge.vue'

interface Props {
  rows: { provinceId: string; provinceName: string; result: SplitTicketResult }[]
  year: ElectionYear
  selectedProvinceId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select-province', id: string): void
}>()

const splitCount = computed(() => props.rows.filter(r => r.result.isSplitTicket).length)
const comparableRows = computed(() => props.rows.filter(r => r.result.governor?.alignedWithLegislative !== undefined))
const divergentCount = computed(() => comparableRows.value.filter(r => r.result.governor!.alignedWithLegislative === false).length)
</script>

<template>
  <div class="rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 p-5 shadow-parchment">
    <div class="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-parchment-200 dark:border-monastic-700">
      <div>
        <h3 class="font-serif font-bold text-base sm:text-lg text-parchment-900 dark:text-parchment-100 flex items-center gap-2">
          <GitCompare class="w-5 h-5 text-claret-700 dark:text-brass-400" />
          <span>Matriks Eksekutif vs Legislatif {{ year }}</span>
        </h3>
        <p class="text-xs text-parchment-500 dark:text-parchment-400">
          Split-ticket: pemenang Pileg DPR RI bukan pengusung capres pemenang. Gubernur: hasil Pilgub terdekat dengan Pemilu {{ year }}.
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <Badge variant="brass">{{ splitCount }} dari {{ rows.length }} provinsi split-ticket</Badge>
        <Badge v-if="comparableRows.length" variant="outline">{{ divergentCount }} dari {{ comparableRows.length }} gubernur beda dengan pemenang Pileg</Badge>
      </div>
    </div>

    <div v-if="!rows.length" class="mt-4 p-6 text-center text-xs text-parchment-500 rounded-lg border border-dashed border-parchment-300 dark:border-monastic-700">
      Belum ada data Pilpres & Pileg yang lengkap untuk tahun ini.
    </div>

    <div v-else class="mt-3 overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wider text-parchment-500">
            <th scope="col" class="py-2 pr-3 font-semibold">Provinsi</th>
            <th scope="col" class="py-2 pr-3 font-semibold">Capres Pemenang</th>
            <th scope="col" class="py-2 pr-3 font-semibold">Pemenang Pileg</th>
            <th scope="col" class="py-2 pr-3 font-semibold">Pola</th>
            <th scope="col" class="py-2 pr-3 font-semibold">Gubernur (Pilgub) & Pengusung</th>
            <th scope="col" class="py-2 font-semibold">Gubernur vs Pileg</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-parchment-200 dark:divide-monastic-700">
          <tr
            v-for="row in rows"
            :key="row.provinceId"
            class="cursor-pointer hover:bg-parchment-50 dark:hover:bg-monastic-900/40"
            :class="row.provinceId === selectedProvinceId ? 'bg-parchment-100/70 dark:bg-monastic-900/60' : ''"
            tabindex="0"
            @click="emit('select-province', row.provinceId)"
            @keydown.enter="emit('select-province', row.provinceId)"
          >
            <td class="py-2 pr-3 font-semibold text-parchment-900 dark:text-parchment-100">{{ row.provinceName }}</td>
            <td class="py-2 pr-3 text-parchment-700 dark:text-parchment-300">{{ row.result.presidentialWinner }}</td>
            <td class="py-2 pr-3">
              <span class="inline-flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: PARTY_COLORS[row.result.legislativeWinner]?.hex || '#64748B' }" />
                {{ row.result.legislativeWinner }}
              </span>
            </td>
            <td class="py-2 pr-3">
              <Badge :variant="row.result.isSplitTicket ? 'brass' : 'positive'">
                {{ row.result.isSplitTicket ? 'Split' : 'Searah' }}
              </Badge>
            </td>
            <td class="py-2 pr-3 text-parchment-700 dark:text-parchment-300 min-w-[12rem]">
              <template v-if="row.result.governor">
                <span class="block">{{ row.result.governor.winner }} <span class="text-parchment-500 tabular-nums">({{ row.result.governor.electionYear }})</span></span>
                <span class="block text-[11px] text-parchment-500">{{ row.result.governor.independent ? 'Perseorangan' : row.result.governor.parties?.join(', ') ?? 'Pengusung tidak terverifikasi' }}</span>
              </template>
              <span v-else class="text-parchment-500">{{ NO_GUBERNATORIAL_ELECTION.includes(row.provinceId) ? 'Ditetapkan (tanpa Pilgub)' : 'Tidak tersedia' }}</span>
            </td>
            <td class="py-2">
              <Badge v-if="row.result.governor?.alignedWithLegislative !== undefined" :variant="row.result.governor.alignedWithLegislative ? 'positive' : 'brass'">
                {{ row.result.governor!.alignedWithLegislative ? 'Searah' : 'Beda' }}
              </Badge>
              <span v-else class="text-parchment-500">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
