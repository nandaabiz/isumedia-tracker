<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  variant?: 'default' | 'claret' | 'brass' | 'outline' | 'positive' | 'negative' | 'neutral'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'claret':
      return 'bg-claret-100 text-claret-800 border-claret-200 dark:bg-claret-950 dark:text-claret-300 dark:border-claret-800'
    case 'brass':
      return 'bg-brass-100 text-brass-800 border-brass-300 dark:bg-brass-900/40 dark:text-brass-300 dark:border-brass-700'
    case 'outline':
      return 'bg-transparent text-parchment-800 dark:text-parchment-200 border-parchment-300 dark:border-monastic-700'
    case 'positive':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    case 'negative':
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    case 'neutral':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    case 'default':
    default:
      return 'bg-parchment-200 text-parchment-900 border-parchment-300 dark:bg-monastic-700 dark:text-parchment-100 dark:border-monastic-600'
  }
})
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
      variantClasses,
      props.class
    )"
  >
    <slot />
  </span>
</template>
