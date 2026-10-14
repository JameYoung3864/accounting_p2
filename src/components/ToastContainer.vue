<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { list } = useToast()

const iconMap: Record<string, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

const colorMap: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup name="slide">
        <div
          v-for="t in list"
          :key="t.id"
          :class="[colorMap[t.type], 'text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 pointer-events-auto']"
        >
          <span class="text-lg">{{ iconMap[t.type] }}</span>
          <span class="flex-1 text-sm break-words">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
