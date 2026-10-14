<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
  widthClass?: string
  closable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

watch(
  () => props.open,
  (v) => {
    if (v) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closable !== false && close()" />
        <div
          :class="[
            'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-h-[90vh] overflow-hidden flex flex-col',
            widthClass || 'max-w-md',
          ]"
        >
          <div v-if="title" class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
            <button
              v-if="closable !== false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              @click="close"
            >
              ×
            </button>
          </div>
          <div class="p-5 overflow-y-auto flex-1">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
