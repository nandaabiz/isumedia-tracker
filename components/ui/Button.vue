<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger' | 'destructive' | 'claret' | 'brass'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
    case 'default':
      return 'bg-claret-700 hover:bg-claret-800 active:bg-claret-900 text-white shadow-sacramental border border-claret-800/40'
    case 'claret':
      return 'bg-claret-700 hover:bg-claret-800 active:bg-claret-900 text-white shadow-sacramental border border-claret-800/40'
    case 'secondary':
      return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border dark:border-monastic-600'
    case 'outline':
      return 'bg-transparent hover:bg-muted text-foreground border border-border dark:border-monastic-700'
    case 'ghost':
      return 'bg-transparent hover:bg-muted text-foreground'
    case 'accent':
    case 'brass':
      return 'bg-brass-500 hover:bg-brass-600 active:bg-brass-700 text-white shadow-brass border border-brass-600/40'
    case 'danger':
    case 'destructive':
      return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive/80'
    default:
      return 'bg-claret-700 text-white'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2.5 py-1 text-xs rounded-md gap-1.5'
    case 'lg':
      return 'px-5 py-2.5 text-base rounded-lg gap-2.5 font-semibold'
    case 'md':
    default:
      return 'px-3.5 py-2 text-sm rounded-md gap-2 font-medium'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    @click="emit('click', $event)"
    :class="cn(
      'inline-flex items-center justify-center transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
      variantClasses,
      sizeClasses,
      props.class
    )"
  >
    <slot />
  </button>
</template>
