<script setup lang="ts" generic="T extends string | number">
interface Option {
  value: T
  label: string
}

interface Props {
  options: Option[]
  label: string
}

defineProps<Props>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="flex w-full sm:w-auto p-1 rounded-lg bg-parchment-200/80 dark:bg-monastic-900 border border-parchment-300 dark:border-monastic-700"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      :class="[
        'flex-1 sm:flex-none min-h-9 px-3.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-claret-700 dark:focus-visible:ring-brass-400',
        model === opt.value
          ? 'bg-claret-700 text-white shadow-sm'
          : 'text-parchment-700 dark:text-parchment-300 hover:text-parchment-900 dark:hover:text-parchment-100'
      ]"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
