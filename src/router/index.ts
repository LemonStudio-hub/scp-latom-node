import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import i18n from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { logger } from '@/services/logger'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { titleKey: 'nav.home' },
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/views/CatalogView.vue'),
    meta: { titleKey: 'nav.catalog' },
  },
  {
    path: '/entry/:lang/:scpNumber',
    name: 'entry',
    component: () => import('@/views/EntryView.vue'),
    meta: { titleKey: 'nav.catalog' },
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { titleKey: 'nav.documents' },
  },
  {
    path: '/proposals',
    name: 'proposals',
    component: () => import('@/views/ProposalsView.vue'),
    meta: { titleKey: 'nav.proposals', requiresAuth: true },
  },
  {
    path: '/proposals/:id',
    name: 'proposal-detail',
    component: () => import('@/views/ProposalDetailView.vue'),
    meta: { titleKey: 'nav.proposals', requiresAuth: true },
  },
  {
    path: '/activity',
    name: 'activity',
    component: () => import('@/views/ActivityView.vue'),
    meta: { titleKey: 'nav.activity', requiresAuth: true },
  },
  {
    path: '/history',
    redirect: '/activity',
  },
  {
    path: '/bookmarks',
    redirect: '/activity',
  },
  {
    path: '/terminal',
    name: 'terminal',
    component: () => import('@/views/TerminalViewV2.vue'),
    meta: { titleKey: 'nav.terminal' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { titleKey: 'nav.about' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { titleKey: 'auth.loginTitle', requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { titleKey: 'auth.registerTitle', requiresGuest: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { titleKey: 'auth.profile', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titleKey: 'notFound.accessDenied' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return { ...savedPosition, behavior: 'smooth' }
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// Set page title on navigation
router.beforeEach((to) => {
  const key = to.meta.titleKey as string
  const t = i18n.global.t
  const title = key ? t(key) : ''
  document.title = title ? `${title} — ${t('site.title')}` : t('site.title')
})

// Enforce auth guards: requiresAuth → must be logged in, requiresGuest → must NOT be logged in
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Wait for session restoration from localStorage before checking auth state
  if (!auth.initialized) {
    await auth.init()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

// Handle chunk-load failures (e.g., stale deployment, network error loading a lazy route)
router.onError((error) => {
  const isChunkError =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.message.includes('ChunkLoadError')

  if (isChunkError) {
    logger.error('Chunk load failure — reloading page', { error: error.message })
    window.location.reload()
  }
})

export default router
