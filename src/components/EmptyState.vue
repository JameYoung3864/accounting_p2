<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="text-6xl mb-4">{{ icon || '📭' }}</div>
    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ title || '暂无数据' }}
    </h3>
    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
      {{ description }}
    </p>
    <slot name="action" />
  </div>
</template>
