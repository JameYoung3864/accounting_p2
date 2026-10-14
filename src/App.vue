<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const mobileOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

function handleResize() {
  if (window.innerWidth >= 768) mobileOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar :current="route" :mobile-open="mobileOpen" @close="mobileOpen = false" />

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button class="text-xl" @click="mobileOpen = !mobileOpen">☰</button>
        <div class="font-semibold flex-1">{{ route.meta.title || '记账本' }}</div>
        <button class="text-xl" @click="toggleTheme">{{ isDark ? '🌙' : '☀️' }}</button>
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="max-w-6xl mx-auto p-4 md:p-6">
          <router-view v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
      </main>

      <nav class="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1 flex justify-around">
        <router-link
          v-for="item in [
            { path: '/', icon: '📊', name: '首页' },
            { path: '/add', icon: '✍️', name: '记一笔' },
            { path: '/bills', icon: '📋', name: '账单' },
            { path: '/stats', icon: '📈', name: '统计' },
          ]"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center gap-0.5 py-1 px-3 text-xs"
          :class="route.path === item.path ? 'text-primary-500' : 'text-gray-500'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <ToastContainer />
  </div>
</template>
