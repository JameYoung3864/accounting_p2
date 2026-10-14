import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

const list = reactive<ToastItem[]>([])

let seed = 0

export function useToast() {
  function push(message: string, type: ToastType = 'info', duration = 2500) {
    const id = `t_${++seed}`
    list.push({ id, type, message, duration })
    setTimeout(() => {
      const idx = list.findIndex((t) => t.id === id)
      if (idx !== -1) list.splice(idx, 1)
    }, duration)
  }

  return {
    list,
    success: (m: string, d?: number) => push(m, 'success', d),
    error: (m: string, d?: number) => push(m, 'error', d),
    info: (m: string, d?: number) => push(m, 'info', d),
    warning: (m: string, d?: number) => push(m, 'warning', d),
  }
}
