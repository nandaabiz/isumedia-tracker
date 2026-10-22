<script setup lang="ts">
import { cn } from '~/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn(
      'bg-white dark:bg-monastic-800 rounded-lg border border-parchment-300 dark:border-monastic-700/80 shadow-parchment p-5 transition-shadow',
      props.class
    )"
  >
    <slot />
  </div>
</template>
