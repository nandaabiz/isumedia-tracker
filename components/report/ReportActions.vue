<script setup lang="ts">
import { FileDown, Share2, Loader2 } from 'lucide-vue-next'

interface Props {
  busy: boolean
  canShare: boolean
  disabled?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'download'): void
  (e: 'share'): void
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      :disabled="busy || disabled"
      class="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-md border border-parchment-300 dark:border-monastic-600 bg-white dark:bg-monastic-800 text-sm font-medium text-parchment-800 dark:text-parchment-100 hover:bg-parchment-200/70 dark:hover:bg-monastic-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400"
      @click="emit('download')"
    >
      <Loader2 v-if="busy" class="w-4 h-4 animate-spin" aria-hidden="true" />
      <FileDown v-else class="w-4 h-4" aria-hidden="true" />
      <span>Unduh PDF</span>
    </button>
    <button
      v-if="canShare"
      type="button"
      :disabled="busy || disabled"
      class="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-md bg-claret-700 hover:bg-claret-800 text-sm font-medium text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400"
      @click="emit('share')"
    >
      <Share2 class="w-4 h-4" aria-hidden="true" />
      <span>Bagikan</span>
    </button>
  </div>
</template>
