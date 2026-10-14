<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStore } from '../store'
import { useToast } from '../composables/useToast'
import { useRouter, useRoute } from 'vue-router'
import { todayStr, formatDate } from '../utils'
import Modal from '../components/Modal.vue'
import type { BillType } from '../types'

const { state, addBill, updateBill, addCategory } = useStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const editId = ref<string | null>(null)

const type = ref<BillType>('expense')
const amount = ref<string>('')
const date = ref<string>(todayStr())
const note = ref<string>('')
const categoryId = ref<string>('')

const showCategoryModal = ref(false)
const newCatName = ref('')
const newCatIcon = ref('📦')
const newCatColor = ref('#6b7280')
const presetIcons = ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📚', '📦', '💰', '🎁', '💼', '📈', '💻', '✨']
const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6366f1']

const categories = computed(() => state.categories.filter((c) => c.type === type.value))

watch(type, () => {
  const first = categories.value[0]
  if (first) categoryId.value = first.id
})

watch(
  () => route.query.edit,
  (id) => {
    if (!id) {
      editId.value = null
      return
    }
    const bill = state.bills.find((b) => b.id === id)
    if (bill) {
      editId.value = bill.id
      type.value = bill.type
      amount.value = String(bill.amount)
      date.value = bill.date
      note.value = bill.note
      categoryId.value = bill.categoryId
    }
  },
  { immediate: true }
)

function submit() {
  const amt = parseFloat(amount.value)
  if (!amt || amt <= 0) {
    toast.warning('请输入有效金额')
    return
  }
  if (!categoryId.value) {
    toast.warning('请选择分类')
    return
  }
  if (!date.value) {
    toast.warning('请选择日期')
    return
  }
  if (editId.value) {
    updateBill(editId.value, {
      type: type.value,
      amount: amt,
      date: date.value,
      note: note.value.trim(),
      categoryId: categoryId.value,
    })
    toast.success('已更新账单')
  } else {
    addBill({
      type: type.value,
      amount: amt,
      date: date.value,
      note: note.value.trim(),
      categoryId: categoryId.value,
    })
    toast.success('已添加账单')
  }
  reset()
  router.push('/bills')
}

function reset() {
  editId.value = null
  amount.value = ''
  date.value = todayStr()
  note.value = ''
  const first = categories.value[0]
  categoryId.value = first ? first.id : ''
}

function openNewCat() {
  newCatName.value = ''
  newCatIcon.value = type.value === 'expense' ? '📦' : '💰'
  newCatColor.value = '#6b7280'
  showCategoryModal.value = true
}

function saveNewCat() {
  if (!newCatName.value.trim()) {
    toast.warning('请输入分类名称')
    return
  }
  const c = addCategory({
    name: newCatName.value.trim(),
    type: type.value,
    icon: newCatIcon.value,
    color: newCatColor.value,
  })
  categoryId.value = c.id
  showCategoryModal.value = false
  toast.success('已添加分类')
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ editId ? '编辑账单' : '记一笔' }}</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">记录你的每一笔收支</p>
    </div>

    <div class="card">
      <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
        <button
          :class="[
            'py-2 rounded-md text-sm font-medium transition-colors',
            type === 'expense' ? 'bg-white dark:bg-gray-800 text-red-500 shadow' : 'text-gray-600 dark:text-gray-300',
          ]"
          @click="type = 'expense'"
        >
          💸 支出
        </button>
        <button
          :class="[
            'py-2 rounded-md text-sm font-medium transition-colors',
            type === 'income' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow' : 'text-gray-600 dark:text-gray-300',
          ]"
          @click="type = 'income'"
        >
          💰 收入
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="label">金额</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
            <input
              v-model="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="input pl-8 text-xl font-semibold"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="label mb-0">分类</label>
            <button type="button" class="text-xs text-primary-500 hover:underline" @click="openNewCat">+ 新建分类</button>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
            <button
              v-for="c in categories"
              :key="c.id"
              type="button"
              :class="[
                'flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-colors',
                categoryId === c.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
              ]"
              @click="categoryId = c.id"
            >
              <span class="text-xl">{{ c.icon }}</span>
              <span class="text-xs truncate w-full text-center">{{ c.name }}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="label">日期</label>
          <input v-model="date" type="date" class="input" :max="formatDate(new Date())" />
        </div>

        <div>
          <label class="label">备注（可选）</label>
          <textarea
            v-model="note"
            rows="2"
            placeholder="添加备注..."
            class="input resize-none"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button v-if="editId" class="btn-secondary flex-1" @click="router.back()">取消</button>
        <button class="btn-primary flex-1" @click="submit">
          {{ editId ? '保存修改' : '保存账单' }}
        </button>
      </div>
    </div>

    <Modal v-model:open="showCategoryModal" title="新建分类">
      <div class="space-y-4">
        <div>
          <label class="label">名称</label>
          <input v-model="newCatName" type="text" class="input" placeholder="如：餐饮、工资..." maxlength="10" />
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
                newCatIcon === i ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100',
              ]"
              @click="newCatIcon = i"
            >
              {{ i }}
            </button>
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
                newCatColor === col ? 'border-gray-800 dark:border-white' : 'border-transparent',
              ]"
              :style="{ backgroundColor: col }"
              @click="newCatColor = col"
            />
            <input v-model="newCatColor" type="color" class="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCategoryModal = false">取消</button>
        <button class="btn-primary" @click="saveNewCat">确定</button>
      </template>
    </Modal>
  </div>
</template>
