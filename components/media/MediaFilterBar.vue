<script setup lang="ts">
import { AtSign, Globe, Twitter, Youtube, Video, MessageSquare, ShieldAlert } from 'lucide-vue-next'
import type { PlatformType } from '~/types/issue'

interface Props {
  activeSources: PlatformType[]
  /** Kanal yang kredensial konektornya terpasang di server; `null` = status belum dimuat */
  configuredSources?: PlatformType[] | null
}

const props = withDefaults(defineProps<Props>(), { configuredSources: null })

const isUnconfigured = (platform: PlatformType) => !!props.configuredSources && !props.configuredSources.includes(platform)
const emit = defineEmits<{
  (e: 'toggle', platform: PlatformType): void
}>()

const platforms: { key: PlatformType; label: string; icon: any }[] = [
  { key: 'news', label: 'Portal Berita (RSS)', icon: Globe },
  { key: 'threads', label: 'Threads', icon: AtSign },
  { key: 'x', label: 'X / Twitter', icon: Twitter },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'tiktok', label: 'TikTok', icon: Video },
  { key: 'forum', label: 'Forum publik (Reddit)', icon: MessageSquare }
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
        :title="isUnconfigured(p.key) ? `${p.label}: kredensial API belum diatur di server, kanal ini belum dirayapi` : `Saluran ${p.label}`"
        :class="[
          'flex items-center gap-1.5 px-3 h-10 sm:h-9 rounded-md text-xs font-medium border transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400',
          activeSources.includes(p.key)
            ? 'bg-white dark:bg-monastic-700 text-claret-800 dark:text-brass-300 border-claret-300 dark:border-brass-600 shadow-sm'
            : 'bg-parchment-200/50 dark:bg-monastic-900/50 text-parchment-500 dark:text-parchment-400 border-dashed border-parchment-300 dark:border-monastic-700 opacity-60 hover:opacity-100'
        ]"
      >
        <component :is="p.icon" class="w-3.5 h-3.5" aria-hidden="true" />
        <span>{{ p.label }}</span>
        <span v-if="isUnconfigured(p.key)" class="text-[10px] font-normal text-parchment-500">belum diatur</span>
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
