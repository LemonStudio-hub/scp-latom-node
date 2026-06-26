import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchCrawlerEntries,
  fetchCrawlerOverallStatus,
  fetchCrawlerStatus,
  fetchCrawlerSeries,
} from '@/services/crawler'
import type { CrawlEntry, CrawlState } from '@/services/crawler'

const LANG_KEY = 'scp-crawler-lang'

export const useCrawlerStore = defineStore('crawler', () => {
  // ─── State ──────────────────────────────────────────────

  const language = ref<'en' | 'cn'>(
    (localStorage.getItem(LANG_KEY) as 'en' | 'cn') || 'en'
  )
  const entries = ref<CrawlEntry[]>([])
  const state = ref<CrawlState | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Incremental crawl info
  const incremental = ref<{
    nextSeries: number
    seriesLastCrawl: Record<number, number>
  } | null>(null)

  // Overall status for both languages
  const overallState = ref<{ en: CrawlState | null; cn: CrawlState | null }>({
    en: null,
    cn: null,
  })

  // Filtering & pagination
  const classFilter = ref<string | null>(null)
  const searchQuery = ref('')
  const page = ref(1)
  const limit = ref(50)
  const total = ref(0)
  const totalPages = ref(0)

  // ─── Computed ───────────────────────────────────────────

  const isIdle = computed(() => state.value?.status === 'idle')
  const isCrawling = computed(() => state.value?.status === 'crawling')
  const isError = computed(() => state.value?.status === 'error')
  const hasData = computed(() => entries.value.length > 0 || total.value > 0)
  const lastCrawlTime = computed(() => {
    if (!state.value?.lastCrawl) return null
    return new Date(state.value.lastCrawl)
  })

  // ─── Actions ────────────────────────────────────────────

  function setLanguage(lang: 'en' | 'cn') {
    language.value = lang
    localStorage.setItem(LANG_KEY, lang)
    page.value = 1
    fetchEntries()
    fetchStatus()
  }

  function setClassFilter(cls: string | null) {
    classFilter.value = cls
    page.value = 1
    fetchEntries()
  }

  function setSearchQuery(q: string) {
    searchQuery.value = q
    page.value = 1
    fetchEntries()
  }

  function setPage(n: number) {
    page.value = n
    fetchEntries()
  }

  async function fetchEntries(): Promise<boolean> {
    loading.value = true
    error.value = ''

    const res = await fetchCrawlerEntries(language.value, {
      class: classFilter.value ?? undefined,
      q: searchQuery.value || undefined,
      page: page.value,
      limit: limit.value,
    })

    loading.value = false

    if (res.ok) {
      entries.value = res.data.entries
      total.value = res.data.total
      totalPages.value = res.data.totalPages
      state.value = res.data.state
      return true
    }

    error.value = res.error
    return false
  }

  async function fetchStatus(): Promise<boolean> {
    const res = await fetchCrawlerStatus(language.value)
    if (res.ok) {
      state.value = res.data.state
      if (res.data.incremental) {
        incremental.value = res.data.incremental
      }
      return true
    }
    error.value = res.error
    return false
  }

  async function fetchOverallStatus(): Promise<boolean> {
    const res = await fetchCrawlerOverallStatus()
    if (res.ok) {
      overallState.value = {
        en: res.data.en,
        cn: res.data.cn,
      }
      return true
    }
    error.value = res.error
    return false
  }

  async function fetchSeries(seriesNum: number): Promise<CrawlEntry[]> {
    const res = await fetchCrawlerSeries(language.value, seriesNum)
    if (res.ok) {
      return res.data.entries
    }
    error.value = res.error
    return []
  }

  async function init() {
    await Promise.all([fetchEntries(), fetchStatus()])
  }

  return {
    // State
    language,
    entries,
    state,
    loading,
    error,
    overallState,
    incremental,
    classFilter,
    searchQuery,
    page,
    limit,
    total,
    totalPages,

    // Computed
    isIdle,
    isCrawling,
    isError,
    hasData,
    lastCrawlTime,

    // Actions
    setLanguage,
    setClassFilter,
    setSearchQuery,
    setPage,
    fetchEntries,
    fetchStatus,
    fetchOverallStatus,
    fetchSeries,
    init,
  }
})
