<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store'
import { useTheme } from '../composables/useTheme'
import { useRouter } from 'vue-router'
import { formatMoney, getMonthKey, monthRange } from '../utils'
import EmptyState from '../components/EmptyState.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const { state } = useStore()
const { isDark } = useTheme()
const router = useRouter()

const currentMonth = computed(() => getMonthKey(new Date()))
const range = computed(() => monthRange(currentMonth.value))

const monthBills = computed(() =>
  state.bills.filter((b) => {
    const d = new Date(b.date)
    return d >= range.value.start && d <= range.value.end
  })
)

const income = computed(() => monthBills.value.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0))
const expense = computed(() => monthBills.value.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0))
const balance = computed(() => income.value - expense.value)

const recent = computed(() =>
  [...state.bills].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
)

const budgetStatus = computed(() => {
  return state.budgets
    .map((bg) => {
      const spent = monthBills.value
        .filter((b) => b.categoryId === bg.categoryId && b.type === 'expense')
        .reduce((s, b) => s + b.amount, 0)
      const cat = state.categories.find((c) => c.id === bg.categoryId)
      return { ...bg, spent, cat, over: spent > bg.amount }
    })
    .filter((b) => b.cat)
})

const overBudgets = computed(() => budgetStatus.value.filter((b) => b.over))

const pieOption = computed(() => {
  const catMap = new Map<string, number>()
  monthBills.value
    .filter((b) => b.type === 'expense')
    .forEach((b) => {
      catMap.set(b.categoryId, (catMap.get(b.categoryId) || 0) + b.amount)
    })
  const data = Array.from(catMap.entries()).map(([cid, val]) => {
    const cat = state.categories.find((c) => c.id === cid)
    return {
      name: cat?.name || '未分类',
      value: Math.round(val * 100) / 100,
      itemStyle: { color: cat?.color },
    }
  })
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: textColor } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: isDark.value ? '#1f2937' : '#fff', borderWidth: 2 },
        label: { color: textColor },
        data,
      },
    ],
  }
})

const barOption = computed(() => {
  const months: string[] = []
  const incomes: number[] = []
  const expenses: number[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mk = getMonthKey(d)
    months.push(`${d.getMonth() + 1}月`)
    const r = monthRange(mk)
    const ms = state.bills.filter((b) => {
      const dt = new Date(b.date)
      return dt >= r.start && dt <= r.end
    })
    incomes.push(ms.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0))
    expenses.push(ms.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0))
  }
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], textStyle: { color: textColor }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: months, axisLabel: { color: textColor } },
    yAxis: { type: 'value', axisLabel: { color: textColor } },
    series: [
      { name: '收入', type: 'bar', data: incomes, itemStyle: { color: '#10b981' } },
      { name: '支出', type: 'bar', data: expenses, itemStyle: { color: '#ef4444' } },
    ],
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">仪表盘</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ currentMonth }} · 本月概览</p>
    </div>

    <div v-if="overBudgets.length" class="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div class="flex-1">
          <div class="font-semibold text-red-700 dark:text-red-300">预算超支提醒</div>
          <ul class="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
            <li v-for="o in overBudgets" :key="o.categoryId">
              {{ o.cat?.icon }} {{ o.cat?.name }}：已支出 ¥{{ formatMoney(o.spent) }} / 预算 ¥{{ formatMoney(o.amount) }}
            </li>
          </ul>
        </div>
        <button class="btn-secondary text-xs py-1 px-2" @click="router.push('/budget')">去设置</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">本月收入</div>
        <div class="mt-2 text-2xl font-bold text-emerald-500">¥{{ formatMoney(income) }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">本月支出</div>
        <div class="mt-2 text-2xl font-bold text-red-500">¥{{ formatMoney(expense) }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">本月结余</div>
        <div :class="['mt-2 text-2xl font-bold', balance >= 0 ? 'text-primary-500' : 'text-red-500']">
          {{ balance >= 0 ? '+' : '' }}¥{{ formatMoney(balance) }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="font-semibold text-gray-800 dark:text-gray-200 mb-3">本月支出分类</div>
        <div v-if="expense === 0">
          <EmptyState icon="🥧" title="暂无支出数据" description="快去记一笔吧" />
        </div>
        <v-chart v-else :option="pieOption" autoresize style="height: 320px" />
      </div>
      <div class="card">
        <div class="font-semibold text-gray-800 dark:text-gray-200 mb-3">近6个月收支</div>
        <v-chart :option="barOption" autoresize style="height: 320px" />
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <div class="font-semibold text-gray-800 dark:text-gray-200">最近账单</div>
        <router-link to="/bills" class="text-sm text-primary-500 hover:underline">查看全部 →</router-link>
      </div>
      <div v-if="recent.length === 0">
        <EmptyState icon="📭" title="还没有任何账单" description="点击下方按钮开始记账" />
      </div>
      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="b in recent" :key="b.id" class="py-3 flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            :style="{ backgroundColor: (state.categories.find((c) => c.id === b.categoryId)?.color) + '22' }"
          >
            {{ state.categories.find((c) => c.id === b.categoryId)?.icon || '📦' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ state.categories.find((c) => c.id === b.categoryId)?.name || '未分类' }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ b.note || b.date }}</div>
          </div>
          <div :class="['font-semibold', b.type === 'income' ? 'text-emerald-500' : 'text-red-500']">
            {{ b.type === 'income' ? '+' : '-' }}¥{{ formatMoney(b.amount) }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
