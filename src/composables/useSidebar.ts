import { ref, watch } from 'vue'

const STORAGE_KEY = 'scp-sidebar-collapsed'

const collapsed = ref(false)

// Initialize from localStorage
try {
  collapsed.value = localStorage.getItem(STORAGE_KEY) === 'true'
} catch {
  // localStorage unavailable
}

watch(collapsed, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(val))
  } catch {
    // localStorage unavailable
  }
})

export function useSidebar() {
  const toggle = () => {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggle }
}
