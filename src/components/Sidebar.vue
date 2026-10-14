<script setup lang="ts">
import { useTheme } from '../composables/useTheme'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

defineProps<{
  current: RouteLocationNormalizedLoaded
  mobileOpen: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { isDark, toggleTheme } = useTheme()

const nav = [
  { path: '/', name: '仪表盘', icon: '📊' },
  { path: '/add', name: '记一笔', icon: '✍️' },
  { path: '/bills', name: '账单列表', icon: '📋' },
  { path: '/stats', name: '统计分析', icon: '📈' },
  { path: '/budget', name: '预算设置', icon: '💰' },
  { path: '/about', name: '关于', icon: 'ℹ️' },
]
</script>

<template>
  <div
    v-if="mobileOpen"
    class="fixed inset-0 bg-black/50 z-30 md:hidden"
    @click="$emit('close')"
  />
  <aside
    :class="[
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col w-64 fixed md:static top-0 left-0 z-40 transition-transform duration-300',
      mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
  >
      <div class="px-5 py-5 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">💸</span>
          <div>
            <div class="font-bold text-base">记账本</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">个人记账 · 预算管理</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            current.path === item.path
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="$emit('close')"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="toggleTheme"
        >
          <span class="text-lg">{{ isDark ? '🌙' : '☀️' }}</span>
          <span>{{ isDark ? '深色模式' : '浅色模式' }}</span>
        </button>
      </div>
    </aside>
</template>
