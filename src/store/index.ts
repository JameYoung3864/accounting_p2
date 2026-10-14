import type { AppData, Bill, Category, Budget } from '../types'

const STORAGE_KEY = 'accounting_app_data_v1'

const defaultCategories: Category[] = [
  { id: 'c_1', name: '餐饮', type: 'expense', icon: '🍜', color: '#ef4444' },
  { id: 'c_2', name: '交通', type: 'expense', icon: '🚗', color: '#f97316' },
  { id: 'c_3', name: '购物', type: 'expense', icon: '🛒', color: '#eab308' },
  { id: 'c_4', name: '娱乐', type: 'expense', icon: '🎮', color: '#22c55e' },
  { id: 'c_5', name: '居住', type: 'expense', icon: '🏠', color: '#06b6d4' },
  { id: 'c_6', name: '医疗', type: 'expense', icon: '💊', color: '#3b82f6' },
  { id: 'c_7', name: '教育', type: 'expense', icon: '📚', color: '#8b5cf6' },
  { id: 'c_8', name: '其他支出', type: 'expense', icon: '📦', color: '#6b7280' },
  { id: 'i_1', name: '工资', type: 'income', icon: '💼', color: '#10b981' },
  { id: 'i_2', name: '奖金', type: 'income', icon: '🎁', color: '#14b8a6' },
  { id: 'i_3', name: '投资', type: 'income', icon: '📈', color: '#0ea5e9' },
  { id: 'i_4', name: '兼职', type: 'income', icon: '💻', color: '#8b5cf6' },
  { id: 'i_5', name: '其他收入', type: 'income', icon: '💰', color: '#6366f1' },
]

function genId(prefix = 'b'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const init: AppData = { bills: [], categories: defaultCategories, budgets: [] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init))
      return init
    }
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = defaultCategories
    }
    return parsed
  } catch {
    const init: AppData = { bills: [], categories: defaultCategories, budgets: [] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init))
    return init
  }
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

import { reactive, watch } from 'vue'

const state = reactive<AppData>(load())

watch(
  state,
  (val) => {
    save(val as AppData)
  },
  { deep: true }
)

export function useStore() {
  function addBill(bill: Omit<Bill, 'id' | 'createdAt'>): Bill {
    const b: Bill = {
      ...bill,
      id: genId('b'),
      createdAt: Date.now(),
    }
    state.bills.push(b)
    return b
  }

  function updateBill(id: string, patch: Partial<Bill>) {
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx !== -1) {
      state.bills[idx] = { ...state.bills[idx], ...patch }
    }
  }

  function removeBill(id: string) {
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx !== -1) state.bills.splice(idx, 1)
  }

  function addCategory(cat: Omit<Category, 'id'>): Category {
    const c: Category = { ...cat, id: genId(cat.type === 'income' ? 'i' : 'c') }
    state.categories.push(c)
    return c
  }

  function updateCategory(id: string, patch: Partial<Category>) {
    const idx = state.categories.findIndex((c) => c.id === id)
    if (idx !== -1) state.categories[idx] = { ...state.categories[idx], ...patch }
  }

  function removeCategory(id: string) {
    const idx = state.categories.findIndex((c) => c.id === id)
    if (idx !== -1) state.categories.splice(idx, 1)
    state.budgets = state.budgets.filter((b) => b.categoryId !== id)
  }

  function setBudgets(budgets: Budget[]) {
    state.budgets = budgets
  }

  function importData(data: AppData) {
    state.bills = data.bills || []
    state.categories = data.categories?.length ? data.categories : defaultCategories
    state.budgets = data.budgets || []
  }

  function exportData(): AppData {
    return JSON.parse(JSON.stringify(state))
  }

  function clearAll() {
    state.bills = []
    state.budgets = []
  }

  return {
    state,
    addBill,
    updateBill,
    removeBill,
    addCategory,
    updateCategory,
    removeCategory,
    setBudgets,
    importData,
    exportData,
    clearAll,
  }
}
