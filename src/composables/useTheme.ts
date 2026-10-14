import { ref, watch, onMounted } from 'vue'

const isDark = ref<boolean>(false)
const STORAGE_KEY = 'accounting_theme'

function apply(dark: boolean) {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    apply(saved === 'dark')
  } else {
    apply(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
})

watch(isDark, (v) => apply(v))

export function useTheme() {
  function toggleTheme() {
    apply(!isDark.value)
  }
  return { isDark, toggleTheme, setDark: apply }
}
