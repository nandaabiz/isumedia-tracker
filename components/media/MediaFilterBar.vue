<script setup lang="ts">
import { Globe, Twitter, Youtube, Video, MessageSquare, ShieldAlert } from 'lucide-vue-next'
import type { PlatformType } from '~/types/issue'

interface Props {
  activeSources: PlatformType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'toggle', platform: PlatformType): void
}>()

// `connected`: kanal yang sudah punya konektor perayapan riil; lainnya hanya memfilter data contoh
const platforms: { key: PlatformType; label: string; icon: any; connected: boolean }[] = [
  { key: 'news', label: 'Portal Berita (RSS)', icon: Globe, connected: true },
  { key: 'x', label: 'X / Twitter', icon: Twitter, connected: false },
  { key: 'youtube', label: 'YouTube', icon: Youtube, connected: false },
  { key: 'tiktok', label: 'TikTok', icon: Video, connected: false },
  { key: 'forum', label: 'Forum publik', icon: MessageSquare, connected: false }
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-parchment-100 dark:bg-monastic-800/60 border border-parchment-300 dark:border-monastic-700/80">
    <div class="flex flex-wrap items-center gap-2">
      <span class="w-full sm:w-auto text-xs font-semibold text-parchment-700 dark:text-parchment-300 uppercase tracking-wider mr-1">
        Sumber pantauan
      </span>

      <button
        v-for="p in platforms"
        :key="p.key"
        type="button"
        :aria-pressed="activeSources.includes(p.key)"
        @click="emit('toggle', p.key)"
        :title="p.connected ? `Saluran ${p.label}` : `${p.label}: konektor perayapan belum aktif; filter hanya berlaku untuk data contoh`"
        :class="[
          'flex items-center gap-1.5 px-3 h-10 sm:h-9 rounded-md text-xs font-medium border transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400',
          activeSources.includes(p.key)
            ? 'bg-white dark:bg-monastic-700 text-claret-800 dark:text-brass-300 border-claret-300 dark:border-brass-600 shadow-sm'
            : 'bg-parchment-200/50 dark:bg-monastic-900/50 text-parchment-500 dark:text-parchment-400 border-dashed border-parchment-300 dark:border-monastic-700 opacity-60 hover:opacity-100'
        ]"
      >
        <component :is="p.icon" class="w-3.5 h-3.5" aria-hidden="true" />
        <span>{{ p.label }}</span>
        <span v-if="!p.connected" class="text-[10px] font-normal text-parchment-500">segera</span>
      </button>
    </div>

    <!-- Privacy Notice Badge -->
    <div 
      class="flex items-center gap-1.5 text-[11px] text-parchment-500 dark:text-parchment-400"
      title="Prinsip Kepatuhan Data: Sistem hanya memproses data teks yang tersedia secara bebas di ruang siber publik. Profil atau unggahan privat terlindungi dan tidak pernah diambil."
    >
      <ShieldAlert class="w-3.5 h-3.5 text-brass-600 dark:text-brass-400" aria-hidden="true" />
      <span>Hanya sumber publik; akun privat diabaikan</span>
    </div>
  </div>
</template>
