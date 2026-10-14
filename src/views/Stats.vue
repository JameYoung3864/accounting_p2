<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../store'
import { useTheme } from '../composables/useTheme'
import { formatMoney, getMonthKey, monthRange } from '../utils'
import EmptyState from '../components/EmptyState.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const { state } = useStore()
const { isDark } = useTheme()

const months = computed(() => {
  const set = new Set<string>()
  state.bills.forEach((b) => set.add(getMonthKey(b.date)))
  const arr = Array.from(set).sort().reverse()
  if (!arr.includes(getMonthKey(new Date()))) arr.unshift(getMonthKey(new Date()))
  return arr
})

const selectedMonth = ref<string>(months.value[0] || getMonthKey(new Date()))

const range = computed(() => monthRange(selectedMonth.value))
const monthBills = computed(() =>
  state.bills.filter((b) => {
    const d = new Date(b.date)
    return d >= range.value.start && d <= range.value.end
  })
)

const textColor = computed(() => (isDark.value ? '#e5e7eb' : '#374151'))

const expensePie = computed(() => {
  const catMap = new Map<string, number>()
  monthBills.value
    .filter((b) => b.type === 'expense')
    .forEach((b) => catMap.set(b.categoryId, (catMap.get(b.categoryId) || 0) + b.amount))
  const data = Array.from(catMap.entries()).map(([cid, val]) => {
    const cat = state.categories.find((c) => c.id === cid)
    return {
      name: cat?.name || '未分类',
      value: Math.round(val * 100) / 100,
      itemStyle: { color: cat?.color },
    }
  })
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: textColor.value } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 4, borderColor: isDark.value ? '#1f2937' : '#fff', borderWidth: 2 },
        label: { color: textColor.value },
        data,
      },
    ],
  }
})

const incomePie = computed(() => {
  const catMap = new Map<string, number>()
  monthBills.value
    .filter((b) => b.type === 'income')
    .forEach((b) => catMap.set(b.categoryId, (catMap.get(b.categoryId) || 0) + b.amount))
  const data = Array.from(catMap.entries()).map(([cid, val]) => {
    const cat = state.categories.find((c) => c.id === cid)
    return {
      name: cat?.name || '未分类',
      value: Math.round(val * 100) / 100,
      itemStyle: { color: cat?.color },
    }
  })
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: textColor.value } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 4, borderColor: isDark.value ? '#1f2937' : '#fff', borderWidth: 2 },
        label: { color: textColor.value },
        data,
      },
    ],
  }
})

const dailyLine = computed(() => {
  const start = range.value.start
  const days: string[] = []
  const expenses: number[] = []
  let d = new Date(start)
  while (d <= range.value.end) {
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push(`${d.getMonth() + 1}/${d.getDate()}`)
    const sum = state.bills
      .filter((b) => b.date === dayStr && b.type === 'expense')
      .reduce((s, b) => s + b.amount, 0)
    expenses.push(sum)
    d.setDate(d.getDate() + 1)
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: days, axisLabel: { color: textColor.value } },
    yAxis: { type: 'value', axisLabel: { color: textColor.value } },
    series: [
      {
        name: '支出',
        type: 'line',
        data: expenses,
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
      },
    ],
  }
})

const monthCompare = computed(() => {
  const labels: string[] = []
  const incData: number[] = []
  const expData: number[] = []
  const current = selectedMonth.value
  const [cy, cm] = current.split('-').map(Number)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(cy, cm - 1 - i, 1)
    labels.push(`${d.getMonth() + 1}月`)
    const mk = getMonthKey(d)
    const r = monthRange(mk)
    const ms = state.bills.filter((b) => {
      const dt = new Date(b.date)
      return dt >= r.start && dt <= r.end
    })
    incData.push(ms.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0))
    expData.push(ms.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0))
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], textStyle: { color: textColor.value }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: labels, axisLabel: { color: textColor.value } },
    yAxis: { type: 'value', axisLabel: { color: textColor.value } },
    series: [
      { name: '收入', type: 'bar', data: incData, itemStyle: { color: '#10b981' } },
      { name: '支出', type: 'bar', data: expData, itemStyle: { color: '#ef4444' } },
    ],
  }
})

const summary = computed(() => {
  const inc = monthBills.value.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const exp = monthBills.value.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  return { inc, exp, bal: inc - exp, count: monthBills.value.length }
})

const topCategories = computed(() => {
  const catMap = new Map<string, number>()
  monthBills.value
    .filter((b) => b.type === 'expense')
    .forEach((b) => catMap.set(b.categoryId, (catMap.get(b.categoryId) || 0) + b.amount))
  return Array.from(catMap.entries())
    .map(([cid, val]) => ({ cat: state.categories.find((c) => c.id === cid), amount: val }))
    .filter((x) => x.cat)
    .sort((a, b) => b.amount - a.amount)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">统计分析</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">多维度分析你的收支情况</p>
      </div>
      <select v-model="selectedMonth" class="input max-w-[180px]">
        <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">收入</div>
        <div class="mt-2 text-xl font-bold text-emerald-500">¥{{ formatMoney(summary.inc) }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">支出</div>
        <div class="mt-2 text-xl font-bold text-red-500">¥{{ formatMoney(summary.exp) }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500 dark:text-gray-400">结余 · {{ summary.count }} 笔</div>
        <div :class="['mt-2 text-xl font-bold', summary.bal >= 0 ? 'text-primary-500' : 'text-red-500']">
          {{ summary.bal >= 0 ? '+' : '' }}¥{{ formatMoney(summary.bal) }}
        </div>
      </div>
    </div>

    <div v-if="monthBills.length === 0">
      <EmptyState icon="📊" title="该月份没有数据" description="选择其他月份或先添加账单" />
    </div>
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="font-semibold mb-3">支出分类占比</div>
          <div v-if="summary.exp === 0">
            <EmptyState icon="💸" title="本月暂无支出" />
          </div>
          <v-chart v-else :option="expensePie" autoresize style="height: 300px" />
        </div>
        <div class="card">
          <div class="font-semibold mb-3">收入来源占比</div>
          <div v-if="summary.inc === 0">
            <EmptyState icon="💰" title="本月暂无收入" />
          </div>
          <v-chart v-else :option="incomePie" autoresize style="height: 300px" />
        </div>
      </div>

      <div class="card">
        <div class="font-semibold mb-3">每日支出趋势</div>
        <v-chart :option="dailyLine" autoresize style="height: 280px" />
      </div>

      <div class="card">
        <div class="font-semibold mb-3">近6个月收支对比</div>
        <v-chart :option="monthCompare" autoresize style="height: 280px" />
      </div>

      <div class="card">
        <div class="font-semibold mb-3">支出排行榜</div>
        <div class="space-y-3">
          <div v-for="(item, idx) in topCategories" :key="item.cat!.id" class="flex items-center gap-3">
            <div class="w-6 text-center font-bold text-gray-400">{{ idx + 1 }}</div>
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              :style="{ backgroundColor: (item.cat?.color || '#6b7280') + '22' }"
            >{{ item.cat?.icon }}</div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span class="font-medium">{{ item.cat?.name }}</span>
                <span class="text-sm text-gray-500">¥{{ formatMoney(item.amount) }}</span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: `${(item.amount / summary.exp) * 100}%`, backgroundColor: item.cat?.color }"
                />
              </div>
            </div>
            <div class="text-xs text-gray-400 w-14 text-right">
              {{ ((item.amount / summary.exp) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
