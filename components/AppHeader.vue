<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Radio, 
  Vote, 
  Sun, 
  Moon, 
  LogOut, 
  Database, 
  Activity
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { apiFetch } from '~/composables/useApi'

interface Props {
  activeTab: 'media_tracker' | 'electoral_intel'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:activeTab', tab: 'media_tracker' | 'electoral_intel'): void
}>()

const { currentUser, logout } = useAuth()

const tabs = [
  { key: 'media_tracker' as const, label: 'Pemantau Isu Medsos', shortLabel: 'Isu Medsos', icon: Radio },
  { key: 'electoral_intel' as const, label: 'Analitik Pemilu 3 Periode', shortLabel: 'Pemilu', icon: Vote }
]
const isDark = ref(false)
const isPbConnected = ref(false)

function toggleDarkMode() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      isDark.value = true
      document.documentElement.classList.add('dark')
    }
  }
  const status = await apiFetch<{ database: { connected: boolean } }>('/api/scraper/status').catch(() => null)
  isPbConnected.value = !!status?.database.connected
})
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-parchment-300 dark:border-monastic-700/80 bg-parchment-100/90 dark:bg-monastic-900/90 backdrop-blur-md transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
      <!-- Brand & Cathedral Seal -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-lg bg-claret-700 flex items-center justify-center text-white shadow-sacramental ring-1 ring-brass-400/50">
          <Activity class="w-5 h-5 text-brass-300" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h1 class="font-serif text-lg font-bold tracking-tight text-parchment-900 dark:text-parchment-50 leading-none">
            IsuMedia
          </h1>
          <p class="mt-0.5 text-[11px] leading-tight text-parchment-600 dark:text-parchment-400 truncate">
            <span class="sm:hidden">Tracker & Electoral Intel</span>
            <span class="hidden sm:inline">Intelijen Media Publik & Lanskap Pemilu 2014–2024</span>
          </p>
        </div>
      </div>

      <!-- Navigasi modul (desktop/tablet); di ponsel pindah ke bilah bawah -->
      <nav aria-label="Modul utama" class="hidden md:flex items-center p-1 rounded-lg bg-parchment-200/80 dark:bg-monastic-800 border border-parchment-300 dark:border-monastic-700">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :aria-current="activeTab === tab.key ? 'page' : undefined"
          :class="[
            'flex items-center gap-2 px-3.5 h-9 text-sm font-medium whitespace-nowrap rounded-md transition-colors cursor-pointer select-none',
            activeTab === tab.key
              ? 'bg-white dark:bg-monastic-700 text-claret-700 dark:text-brass-300 shadow-sm font-semibold'
              : 'text-parchment-600 dark:text-parchment-400 hover:text-parchment-900 dark:hover:text-parchment-100'
          ]"
          @click="emit('update:activeTab', tab.key)"
        >
          <component :is="tab.icon" class="w-4 h-4" aria-hidden="true" />
          <span class="xl:hidden">{{ tab.shortLabel }}</span>
          <span class="hidden xl:inline">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div
          class="hidden lg:flex items-center gap-1.5 px-2.5 h-9 rounded-md text-xs border border-parchment-300 dark:border-monastic-700 bg-white/60 dark:bg-monastic-800/60"
          :title="isPbConnected ? 'Basis data PocketBase tersambung' : 'PocketBase tidak tersambung; data tersimpan di cache peramban'"
        >
          <Database class="w-3.5 h-3.5" :class="isPbConnected ? 'text-emerald-600' : 'text-amber-600'" aria-hidden="true" />
          <span class="text-[11px] font-mono text-parchment-600 dark:text-parchment-400">
            {{ isPbConnected ? 'DB tersambung' : 'DB offline · cache lokal' }}
          </span>
        </div>

        <button
          type="button"
          class="w-10 h-10 flex items-center justify-center rounded-md border border-parchment-300 dark:border-monastic-700 text-parchment-600 dark:text-parchment-300 hover:bg-parchment-200 dark:hover:bg-monastic-800 transition-colors"
          :aria-label="isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'"
          @click="toggleDarkMode"
        >
          <Sun v-if="isDark" class="w-4 h-4 text-brass-400" aria-hidden="true" />
          <Moon v-else class="w-4 h-4 text-parchment-700" aria-hidden="true" />
        </button>

        <div v-if="currentUser" class="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-parchment-300 dark:border-monastic-700">
          <div class="hidden lg:flex flex-col text-right">
            <span class="text-xs font-semibold text-parchment-900 dark:text-parchment-100 leading-tight">
              {{ currentUser.name }}
            </span>
            <span class="text-[10px] font-mono text-parchment-500 uppercase tracking-wider">
              {{ currentUser.role }}
            </span>
          </div>

          <div
            class="w-8 h-8 rounded-full bg-brass-100 dark:bg-brass-900/60 text-brass-800 dark:text-brass-300 border border-brass-300 dark:border-brass-700 hidden sm:flex items-center justify-center font-bold text-xs"
            aria-hidden="true"
          >
            {{ currentUser.name ? currentUser.name.charAt(0) : 'U' }}
          </div>

          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center rounded-md text-parchment-600 hover:text-red-700 hover:bg-parchment-200 dark:hover:bg-monastic-800 dark:hover:text-red-400 transition-colors"
            :aria-label="`Keluar dari akun ${currentUser.name}`"
            @click="logout"
          >
            <LogOut class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Bilah navigasi bawah untuk ponsel -->
  <nav
    aria-label="Modul utama"
    class="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-parchment-300 dark:border-monastic-700 bg-parchment-50/95 dark:bg-monastic-900/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] print:hidden"
  >
    <div class="grid grid-cols-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :aria-current="activeTab === tab.key ? 'page' : undefined"
        :class="[
          'relative flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-semibold transition-colors',
          activeTab === tab.key ? 'text-claret-700 dark:text-brass-300' : 'text-parchment-500 dark:text-parchment-400'
        ]"
        @click="emit('update:activeTab', tab.key)"
      >
        <span
          v-if="activeTab === tab.key"
          class="absolute top-0 inset-x-8 h-0.5 rounded-full bg-claret-700 dark:bg-brass-400"
          aria-hidden="true"
        />
        <component :is="tab.icon" class="w-5 h-5" aria-hidden="true" />
        <span>{{ tab.shortLabel }}</span>
      </button>
    </div>
  </nav>
</template>
