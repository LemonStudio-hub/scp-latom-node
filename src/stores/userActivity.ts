import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchBookmarks,
  addBookmark as apiAdd,
  removeBookmark as apiRemove,
  checkBookmark as apiCheck,
  fetchHistory,
  recordHistory,
  deleteHistoryEntry,
  clearHistory as clearAllHistory,
} from '@/services/userActivity'
import type { BookmarkItem, HistoryEntry } from '@/services/userActivity'

const TAB_KEY = 'scp-activity-tab'

export type ActivityTab = 'bookmarks' | 'history'

export const useUserActivityStore = defineStore('userActivity', () => {
  // ─── Tab State ───────────────────────────────────────────

  const activeTab = ref<ActivityTab>(
    (localStorage.getItem(TAB_KEY) as ActivityTab) || 'history'
  )

  function setTab(tab: ActivityTab) {
    activeTab.value = tab
    localStorage.setItem(TAB_KEY, tab)
    if (tab === 'bookmarks' && bookmarks.value.length === 0) {
      loadBookmarks()
    }
    if (tab === 'history' && historyEntries.value.length === 0) {
      fetchHistoryList()
    }
  }

  // ─── Bookmark State ─────────────────────────────────────

  const bookmarks = ref<BookmarkItem[]>([])
  const bookmarkLoading = ref(false)
  const bookmarkError = ref('')

  const bookmarkSet = computed(() => {
    const set = new Set<string>()
    for (const b of bookmarks.value) {
      set.add(`${b.language}:${b.scpNumber}`)
    }
    return set
  })

  function isBookmarked(lang: string, scpNumber: number): boolean {
    return bookmarkSet.value.has(`${lang}:${scpNumber}`)
  }

  async function loadBookmarks() {
    bookmarkLoading.value = true
    bookmarkError.value = ''
    const res = await fetchBookmarks()
    bookmarkLoading.value = false

    if (res.ok) {
      bookmarks.value = res.data.bookmarks
    } else {
      bookmarkError.value = res.error
    }
  }

  async function addBookmark(lang: string, scpNumber: number): Promise<boolean> {
    bookmarkError.value = ''
    const res = await apiAdd(lang, scpNumber)

    if (res.ok) {
      if (!isBookmarked(lang, scpNumber)) {
        bookmarks.value.unshift({
          scpNumber,
          language: lang,
          name: null,
          objectClass: null,
          createdAt: new Date().toISOString(),
        })
      }
      return true
    }

    if (res.code === 'ERR-409-CONFLICT') return true
    bookmarkError.value = res.error
    return false
  }

  async function removeBookmark(lang: string, scpNumber: number): Promise<boolean> {
    bookmarkError.value = ''
    const res = await apiRemove(lang, scpNumber)

    if (res.ok) {
      bookmarks.value = bookmarks.value.filter(
        (b) => !(b.language === lang && b.scpNumber === scpNumber)
      )
      return true
    }

    bookmarkError.value = res.error
    return false
  }

  async function toggleBookmark(lang: string, scpNumber: number): Promise<boolean> {
    if (isBookmarked(lang, scpNumber)) {
      return removeBookmark(lang, scpNumber)
    }
    return addBookmark(lang, scpNumber)
  }

  async function checkBookmark(lang: string, scpNumber: number): Promise<boolean> {
    const res = await apiCheck(lang, scpNumber)
    if (res.ok) return res.data.bookmarked
    return false
  }

  // ─── History State ──────────────────────────────────────

  const historyEntries = ref<HistoryEntry[]>([])
  const historyTotal = ref(0)
  const historyPage = ref(1)
  const historyLimit = ref(50)
  const historyTotalPages = ref(0)
  const historyLoading = ref(false)
  const historyError = ref('')
  const langFilter = ref<string | null>(null)

  const hasHistoryEntries = computed(() => historyEntries.value.length > 0)

  async function fetchHistoryList(): Promise<boolean> {
    historyLoading.value = true
    historyError.value = ''

    const res = await fetchHistory({
      page: historyPage.value,
      limit: historyLimit.value,
      lang: langFilter.value ?? undefined,
    })

    historyLoading.value = false

    if (res.ok) {
      historyEntries.value = res.data.entries
      historyTotal.value = res.data.total
      historyTotalPages.value = res.data.totalPages
      return true
    }

    historyError.value = res.error
    return false
  }

  async function recordVisit(data: {
    language: string
    scpNumber: number
    name?: string
    objectClass?: string
  }): Promise<void> {
    await recordHistory(data)
  }

  async function deleteHistoryEntryById(id: number): Promise<boolean> {
    const res = await deleteHistoryEntry(id)
    if (res.ok) {
      historyEntries.value = historyEntries.value.filter((e) => e.id !== id)
      historyTotal.value = Math.max(0, historyTotal.value - 1)
      return true
    }
    historyError.value = res.error
    return false
  }

  async function clearHistory(): Promise<boolean> {
    const res = await clearAllHistory()
    if (res.ok) {
      historyEntries.value = []
      historyTotal.value = 0
      historyPage.value = 1
      historyTotalPages.value = 0
      return true
    }
    historyError.value = res.error
    return false
  }

  function setHistoryPage(n: number) {
    historyPage.value = n
    fetchHistoryList()
  }

  function setLangFilter(lang: string | null) {
    langFilter.value = lang
    historyPage.value = 1
    fetchHistoryList()
  }

  // ─── Init ───────────────────────────────────────────────

  function init() {
    if (activeTab.value === 'bookmarks') {
      loadBookmarks()
    } else {
      fetchHistoryList()
    }
  }

  return {
    // Tab
    activeTab,
    setTab,

    // Bookmarks
    bookmarks,
    bookmarkLoading,
    bookmarkError,
    bookmarkSet,
    isBookmarked,
    loadBookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    checkBookmark,

    // History
    historyEntries,
    historyTotal,
    historyPage,
    historyLimit,
    historyTotalPages,
    historyLoading,
    historyError,
    langFilter,
    hasHistoryEntries,
    fetchHistoryList,
    recordVisit,
    deleteHistoryEntryById,
    clearHistory,
    setHistoryPage,
    setLangFilter,

    // Init
    init,
  }
})
