<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../store'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'
import { formatMoney, getMonthKey } from '../utils'
import EmptyState from '../components/EmptyState.vue'
import Modal from '../components/Modal.vue'
import type { BillType } from '../types'

const { state, removeBill } = useStore()
const toast = useToast()
const router = useRouter()

const keyword = ref('')
const filterType = ref<BillType | 'all'>('all')
const filterCategory = ref<string>('all')
const filterMonth = ref<string>('all')

const confirmDeleteId = ref<string | null>(null)

const months = computed(() => {
  const set = new Set<string>()
  state.bills.forEach((b) => set.add(getMonthKey(b.date)))
  return Array.from(set).sort().reverse()
})

const filtered = computed(() => {
  let list = [...state.bills]
  if (filterType.value !== 'all') list = list.filter((b) => b.type === filterType.value)
  if (filterCategory.value !== 'all') list = list.filter((b) => b.categoryId === filterCategory.value)
  if (filterMonth.value !== 'all') {
    list = list.filter((b) => getMonthKey(b.date) === filterMonth.value)
  }
  if (keyword.value.trim()) {
    const k = keyword.value.trim().toLowerCase()
    list = list.filter((b) => {
      const catName = state.categories.find((c) => c.id === b.categoryId)?.name || ''
      return catName.toLowerCase().includes(k) || b.note.toLowerCase().includes(k)
    })
  }
  return list.sort((a, b) => b.createdAt - a.createdAt)
})

const grouped = computed(() => {
  const map = new Map<string, typeof filtered.value>()
  filtered.value.forEach((b) => {
    const k = b.date
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(b)
  })
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
})

const confirmOpen = computed({
  get: () => confirmDeleteId.value !== null,
  set: (v: boolean) => { if (!v) confirmDeleteId.value = null },
})

const summary = computed(() => {
  const inc = filtered.value.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const exp = filtered.value.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  return { inc, exp, bal: inc - exp, count: filtered.value.length }
})

function doDelete() {
  if (!confirmDeleteId.value) return
  removeBill(confirmDeleteId.value)
  confirmDeleteId.value = null
  toast.success('账单已删除')
}

function resetFilters() {
  keyword.value = ''
  filterType.value = 'all'
  filterCategory.value = 'all'
  filterMonth.value = 'all'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">账单列表</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">查看和管理所有账单记录</p>
    </div>

    <div class="card">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input v-model="keyword" type="text" placeholder="🔍 搜索分类或备注..." class="input" />
        <select v-model="filterMonth" class="input">
          <option value="all">全部月份</option>
          <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
        </select>
        <select v-model="filterType" class="input">
          <option value="all">全部类型</option>
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <select v-model="filterCategory" class="input">
          <option value="all">全部分类</option>
          <optgroup v-for="t in ['expense', 'income']" :key="t" :label="t === 'expense' ? '支出分类' : '收入分类'">
            <option
              v-for="c in state.categories.filter((c) => c.type === t)"
              :key="c.id"
              :value="c.id"
            >
              {{ c.icon }} {{ c.name }}
            </option>
          </optgroup>
        </select>
      </div>
      <div class="mt-3 flex items-center justify-between text-sm">
        <div class="text-gray-500 dark:text-gray-400">
          共 {{ summary.count }} 条 ·
          收入 <span class="text-emerald-500">¥{{ formatMoney(summary.inc) }}</span> ·
          支出 <span class="text-red-500">¥{{ formatMoney(summary.exp) }}</span> ·
          结余 <span :class="summary.bal >= 0 ? 'text-primary-500' : 'text-red-500'">{{ summary.bal >= 0 ? '+' : '' }}¥{{ formatMoney(summary.bal) }}</span>
        </div>
        <button v-if="keyword || filterType !== 'all' || filterCategory !== 'all' || filterMonth !== 'all'" class="text-primary-500 hover:underline" @click="resetFilters">重置筛选</button>
      </div>
    </div>

    <div class="card">
      <div v-if="grouped.length === 0">
        <EmptyState icon="📭" title="没有符合条件的账单" description="试试调整筛选条件" />
      </div>
      <div v-else class="space-y-6">
        <div v-for="[date, list] in grouped" :key="date">
          <div class="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ date }}</span>
            <span class="text-xs text-gray-400">{{ list.length }} 条</span>
          </div>
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="b in list" :key="b.id" class="py-3 flex items-center gap-3 group">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                :style="{ backgroundColor: (state.categories.find((c) => c.id === b.categoryId)?.color) + '22' }"
              >
                {{ state.categories.find((c) => c.id === b.categoryId)?.icon || '📦' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ state.categories.find((c) => c.id === b.categoryId)?.name || '未分类' }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ b.note || '无备注' }}</div>
              </div>
              <div :class="['font-semibold mr-3', b.type === 'income' ? 'text-emerald-500' : 'text-red-500']">
                {{ b.type === 'income' ? '+' : '-' }}¥{{ formatMoney(b.amount) }}
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1 text-gray-500 hover:text-primary-500" title="编辑" @click="router.push({ path: '/add', query: { edit: b.id } })">✏️</button>
                <button class="p-1 text-gray-500 hover:text-red-500" title="删除" @click="confirmDeleteId = b.id">🗑️</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <Modal v-model:open="confirmOpen" title="确认删除">
      <p class="text-gray-600 dark:text-gray-300">确定要删除这条账单记录吗？此操作无法撤销。</p>
      <template #footer>
        <button class="btn-secondary" @click="confirmDeleteId = null">取消</button>
        <button class="btn-danger" @click="doDelete">删除</button>
      </template>
    </Modal>
  </div>
</template>
