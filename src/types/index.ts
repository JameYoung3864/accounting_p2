export type BillType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  type: BillType
  icon: string
  color: string
}

export interface Bill {
  id: string
  type: BillType
  categoryId: string
  amount: number
  date: string
  note: string
  createdAt: number
}

export interface Budget {
  categoryId: string
  amount: number
}

export interface AppData {
  bills: Bill[]
  categories: Category[]
  budgets: Budget[]
}
