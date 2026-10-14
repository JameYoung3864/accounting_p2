<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStore } from '../store'
import { useToast } from '../composables/useToast'
import { formatMoney, getMonthKey, monthRange, downloadJSON, readFileAsText } from '../utils'

import Modal from '../components/Modal.vue'
import type { Budget, Category } from '../types'

const { state, setBudgets, exportData, importData, clearAll, removeCategory, addCategory } = useStore()
const toast = useToast()

const currentMonth = computed(() => getMonthKey(new Date()))
const range = computed(() => monthRange(currentMonth.value))

const budgets = ref<Budget[]>([...state.budgets])
watch(
  () => state.budgets,
  (v) => (budgets.value = [...v]),
  { deep: true }
)

const expenseCategories = computed(() => state.categories.filter((c) => c.type === 'expense'))

const budgetRows = computed(() => {
  return expenseCategories.value.map((cat) => {
    const bg = budgets.value.find((b) => b.categoryId === cat.id)
    const spent = state.bills
      .filter((b) => b.categoryId === cat.id && b.type === 'expense')
      .filter((b) => {
        const d = new Date(b.date)
        return d >= range.value.start && d <= range.value.end
      })
      .reduce((s, b) => s + b.amount, 0)
    return {
      cat,
      budget: bg?.amount ?? 0,
      spent,
      percent: bg?.amount ? Math.min(100, (spent / bg.amount) * 100) : 0,
      over: bg?.amount ? spent > bg.amount : false,
      remaining: (bg?.amount ?? 0) - spent,
    }
  })
})

const totalBudget = computed(() => budgetRows.value.reduce((s, r) => s + r.budget, 0))
const totalSpent = computed(() => budgetRows.value.reduce((s, r) => s + r.spent, 0))
const totalPercent = computed(() => (totalBudget.value ? (totalSpent.value / totalBudget.value) * 100 : 0))

function updateBudget(catId: string, val: string) {
  const num = parseFloat(val) || 0
  const idx = budgets.value.findIndex((b) => b.categoryId === catId)
  if (num <= 0) {
    if (idx !== -1) budgets.value.splice(idx, 1)
  } else {
    if (idx !== -1) budgets.value[idx].amount = num
    else budgets.value.push({ categoryId: catId, amount: num })
  }
}

function save() {
  setBudgets(budgets.value.filter((b) => b.amount > 0))
  toast.success('预算已保存')
}

const confirmImport = ref(false)
const confirmClear = ref(false)
const importText = ref('')

function doExport() {
  const data = exportData()
  const filename = `记账数据_${currentMonth.value}.json`
  downloadJSON(filename, data)
  toast.success('数据已导出')
}

async function onImportFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    const text = await readFileAsText(file)
    JSON.parse(text)
    importText.value = text
    confirmImport.value = true
    target.value = ''
  } catch {
    toast.error('文件格式无效')
  }
}

function doImport() {
  try {
    const data = JSON.parse(importText.value)
    if (!data.bills || !data.categories) throw new Error('格式错误')
    importData(data)
    confirmImport.value = false
    toast.success('数据已导入')
  } catch {
    toast.error('导入失败：格式错误')
  }
}

function doClear() {
  clearAll()
  confirmClear.value = false
  toast.success('数据已清空')
}

const showCatModal = ref(false)
const catType = ref<'expense' | 'income'>('expense')
const catName = ref('')
const catIcon = ref('📦')
const catColor = ref('#6b7280')
const editingCatId = ref<string | null>(null)
const presetIcons = ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📚', '📦', '💰', '🎁', '💼', '📈', '💻', '✨']
const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6366f1']

function openEditCat(c: Category) {
  editingCatId.value = c.id
  catType.value = c.type
  catName.value = c.name
  catIcon.value = c.icon
  catColor.value = c.color
  showCatModal.value = true
}

function openAddCat(type: 'expense' | 'income') {
  editingCatId.value = null
  catType.value = type
  catName.value = ''
  catIcon.value = type === 'expense' ? '📦' : '💰'
  catColor.value = '#6b7280'
  showCatModal.value = true
}

function saveCat() {
  if (!catName.value.trim()) {
    toast.warning('请输入名称')
    return
  }
  if (editingCatId.value) {
    const cat = state.categories.find((c) => c.id === editingCatId.value)
    if (cat) {
      cat.name = catName.value.trim()
      cat.icon = catIcon.value
      cat.color = catColor.value
    }
    toast.success('分类已更新')
  } else {
    addCategory({ name: catName.value.trim(), type: catType.value, icon: catIcon.value, color: catColor.value })
    toast.success('分类已添加')
  }
  showCatModal.value = false
}

function deleteCat(c: Category) {
  if (state.bills.some((b) => b.categoryId === c.id)) {
    toast.warning('该分类下还有账单，无法删除')
    return
  }
  removeCategory(c.id)
  toast.success('分类已删除')
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">预算设置</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ currentMonth }} · 设置分类预算并实时追踪</p>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="font-semibold">本月总览</div>
        <button class="btn-primary text-sm py-1.5 px-3" @click="save">💾 保存预算</button>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-xs text-gray-500">总预算</div>
          <div class="text-xl font-bold text-gray-800 dark:text-gray-100">¥{{ formatMoney(totalBudget) }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500">已支出</div>
          <div class="text-xl font-bold" :class="totalPercent > 100 ? 'text-red-500' : 'text-primary-500'">
            ¥{{ formatMoney(totalSpent) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500">剩余</div>
          <div class="text-xl font-bold" :class="totalBudget - totalSpent >= 0 ? 'text-emerald-500' : 'text-red-500'">
            ¥{{ formatMoney(totalBudget - totalSpent) }}
          </div>
        </div>
      </div>
      <div v-if="totalBudget > 0" class="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="totalPercent > 100 ? 'bg-red-500' : totalPercent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'"
          :style="{ width: `${Math.min(100, totalPercent)}%` }"
        />
      </div>
    </div>

    <div class="card">
      <div class="font-semibold mb-4">分类预算</div>
      <div class="space-y-4">
        <div v-for="r in budgetRows" :key="r.cat.id" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-xl">{{ r.cat.icon }}</span>
            <span class="font-medium flex-1">{{ r.cat.name }}</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">预算</span>
              <input
                class="input py-1 w-28 text-right"
                type="number"
                min="0"
                step="10"
                :value="r.budget || ''"
                @input="updateBudget(r.cat.id, ($event.target as HTMLInputElement).value)"
                placeholder="不设置"
              />
            </div>
          </div>
          <div v-if="r.budget > 0" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span :class="r.over ? 'text-red-500 font-medium' : 'text-gray-500'">
                已支出 ¥{{ formatMoney(r.spent) }} / ¥{{ formatMoney(r.budget) }}
              </span>
              <span :class="r.over ? 'text-red-500 font-medium' : 'text-gray-500'">
                {{ r.over ? '超支 ¥' + formatMoney(-r.remaining) : '剩余 ¥' + formatMoney(r.remaining) }}
              </span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="r.over ? 'bg-red-500' : r.percent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'"
                :style="{ width: `${r.percent}%` }"
              />
            </div>
          </div>
          <div v-else class="text-xs text-gray-400">本月已支出 ¥{{ formatMoney(r.spent) }}，未设置预算</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="font-semibold">分类管理</div>
        <div class="flex gap-2">
          <button class="btn-outline text-sm py-1.5 px-3" @click="openAddCat('expense')">+ 支出分类</button>
          <button class="btn-outline text-sm py-1.5 px-3" @click="openAddCat('income')">+ 收入分类</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="text-sm text-gray-500 mb-2">支出分类</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="c in state.categories.filter((c) => c.type === 'expense')"
              :key="c.id"
              class="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm group"
            >
              <span>{{ c.icon }}</span>
              <span>{{ c.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-500 ml-1" @click="openEditCat(c)">✏️</button>
              <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500" @click="deleteCat(c)">×</button>
            </div>
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-500 mb-2">收入分类</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="c in state.categories.filter((c) => c.type === 'income')"
              :key="c.id"
              class="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm group"
            >
              <span>{{ c.icon }}</span>
              <span>{{ c.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-500 ml-1" @click="openEditCat(c)">✏️</button>
              <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500" @click="deleteCat(c)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="font-semibold mb-4">数据管理</div>
      <div class="flex flex-wrap gap-3">
        <button class="btn-primary" @click="doExport">📤 导出数据</button>
        <label class="btn-outline cursor-pointer">
          📥 导入数据
          <input type="file" accept="application/json" class="hidden" @change="onImportFile" />
        </label>
        <button class="btn-danger" @click="confirmClear = true">🗑️ 清空所有数据</button>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
        数据存储在浏览器 localStorage，清除浏览器缓存会导致数据丢失。建议定期导出备份。
      </p>
    </div>

    <Modal v-model:open="confirmImport" title="确认导入">
      <p class="text-gray-600 dark:text-gray-300">导入将覆盖当前所有数据（账单、分类、预算），确定继续吗？</p>
      <template #footer>
        <button class="btn-secondary" @click="confirmImport = false">取消</button>
        <button class="btn-primary" @click="doImport">确定导入</button>
      </template>
    </Modal>

    <Modal v-model:open="confirmClear" title="确认清空">
      <p class="text-red-600">⚠️ 此操作将删除所有账单和预算数据，且无法恢复！</p>
      <template #footer>
        <button class="btn-secondary" @click="confirmClear = false">取消</button>
        <button class="btn-danger" @click="doClear">确认清空</button>
      </template>
    </Modal>

    <Modal v-model:open="showCatModal" :title="editingCatId ? '编辑分类' : '新建分类'">
      <div class="space-y-4">
        <div>
          <label class="label">类型</label>
          <div class="flex gap-2">
            <button
              :class="[
                'px-4 py-2 rounded-lg text-sm',
                catType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700',
              ]"
              @click="catType = 'expense'"
            >支出</button>
            <button
              :class="[
                'px-4 py-2 rounded-lg text-sm',
                catType === 'income' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700',
              ]"
              @click="catType = 'income'"
            >收入</button>
          </div>
        </div>
        <div>
          <label class="label">名称</label>
          <input v-model="catName" type="text" class="input" placeholder="分类名称" maxlength="10" />
        </div>
        <div>
          <label class="label">图标</label>
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="i in presetIcons"
              :key="i"
              type="button"
              :class="[
                'text-xl py-1 rounded border',
                catIcon === i ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100',
              ]"
              @click="catIcon = i"
            >{{ i }}</button>
          </div>
        </div>
        <div>
          <label class="label">颜色</label>
          <div class="flex flex-wrap gap-2 items-center">
            <button
              v-for="col in presetColors"
              :key="col"
              type="button"
              :class="[
                'w-8 h-8 rounded-full border-2',
                catColor === col ? 'border-gray-800 dark:border-white' : 'border-transparent',
              ]"
              :style="{ backgroundColor: col }"
              @click="catColor = col"
            />
            <input v-model="catColor" type="color" class="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCatModal = false">取消</button>
        <button class="btn-primary" @click="saveCat">确定</button>
      </template>
    </Modal>
  </div>
</template>
