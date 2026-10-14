<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store'
import { formatMoney } from '../utils'

const { state } = useStore()

const stats = computed(() => {
  const inc = state.bills.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const exp = state.bills.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  return { count: state.bills.length, inc, exp, bal: inc - exp, cats: state.categories.length }
})
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">关于</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">个人记账与预算管理系统</p>
    </div>

    <div class="card">
      <div class="text-center py-6">
        <div class="text-5xl mb-3">💸</div>
        <div class="text-xl font-bold">个人记账本</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">简洁现代的个人财务管理工具</div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card text-center">
        <div class="text-2xl font-bold text-primary-500">{{ stats.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">账单数</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-emerald-500">¥{{ formatMoney(stats.inc) }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">总收入</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-red-500">¥{{ formatMoney(stats.exp) }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">总支出</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold">{{ stats.cats }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">分类数</div>
      </div>
    </div>

    <div class="card">
      <div class="font-semibold mb-3">📖 功能特性</div>
      <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <li class="flex gap-2"><span>✅</span><span>快速添加收入/支出，支持分类与备注</span></li>
        <li class="flex gap-2"><span>✅</span><span>账单列表按日分组，支持按月/类型/分类筛选与搜索</span></li>
        <li class="flex gap-2"><span>✅</span><span>自定义分类管理（图标、颜色）</span></li>
        <li class="flex gap-2"><span>✅</span><span>月度预算设置与超支提醒</span></li>
        <li class="flex gap-2"><span>✅</span><span>多维度图表分析：分类饼图、每日折线、月度柱状对比</span></li>
        <li class="flex gap-2"><span>✅</span><span>数据本地存储，支持 JSON 导入导出</span></li>
        <li class="flex gap-2"><span>✅</span><span>深色模式自动适配 + 手动切换</span></li>
        <li class="flex gap-2"><span>✅</span><span>响应式设计，支持移动端</span></li>
      </ul>
    </div>

    <div class="card">
      <div class="font-semibold mb-3">🛠️ 技术栈</div>
      <div class="flex flex-wrap gap-2">
        <span class="tag bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Vue 3</span>
        <span class="tag bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Vite</span>
        <span class="tag bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">TypeScript</span>
        <span class="tag bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">Tailwind CSS</span>
        <span class="tag bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">ECharts</span>
        <span class="tag bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">localStorage</span>
      </div>
    </div>

    <div class="card">
      <div class="font-semibold mb-3">💡 使用说明</div>
      <ol class="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-decimal list-inside">
        <li>首次使用：进入"记一笔"页面开始记录你的第一笔收支</li>
        <li>预算提醒：在"预算设置"中设置分类预算，首页会自动提示超支</li>
        <li>定期备份：建议每月导出一次数据防止丢失</li>
      </ol>
    </div>

    <div class="text-center text-xs text-gray-400 py-4">
      Made with ❤️ · 数据仅保存在你的浏览器中
    </div>
  </div>
</template>
