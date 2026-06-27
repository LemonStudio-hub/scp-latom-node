import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import i18n from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import DeviceView from '@/components/DeviceView.vue'

function deviceRoute(
  name: string,
  desktop: () => Promise<any>,
  mobile: () => Promise<any>,
  meta: Record<string, any> = {}
): RouteRecordRaw {
  return {
    path: meta.path || '/',
    name,
    component: DeviceView,
    props: { desktop, mobile },
    meta: { titleKey: meta.titleKey, ...meta },
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/HomeView.vue'),
      mobile: () => import('@/views/mobile/MobileHomeView.vue'),
    },
    meta: { titleKey: 'nav.home' },
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/CatalogView.vue'),
      mobile: () => import('@/views/mobile/MobileCatalogView.vue'),
    },
    meta: { titleKey: 'nav.catalog' },
  },
  {
    path: '/entry/:lang/:scpNumber',
    name: 'entry',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/EntryView.vue'),
      mobile: () => import('@/views/mobile/MobileEntryView.vue'),
    },
    meta: { titleKey: 'nav.catalog' },
  },
  {
    path: '/documents',
    name: 'documents',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/DocumentsView.vue'),
      mobile: () => import('@/views/mobile/MobileDocumentsView.vue'),
    },
    meta: { titleKey: 'nav.documents' },
  },
  {
    path: '/proposals',
    name: 'proposals',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/ProposalsView.vue'),
      mobile: () => import('@/views/mobile/MobileProposalsView.vue'),
    },
    meta: { titleKey: 'nav.proposals', requiresAuth: true },
  },
  {
    path: '/about',
    name: 'about',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/AboutView.vue'),
      mobile: () => import('@/views/mobile/MobileAboutView.vue'),
    },
    meta: { titleKey: 'nav.about' },
  },
  {
    path: '/login',
    name: 'login',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/LoginView.vue'),
      mobile: () => import('@/views/mobile/MobileLoginView.vue'),
    },
    meta: { titleKey: 'auth.loginTitle', requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/RegisterView.vue'),
      mobile: () => import('@/views/mobile/MobileRegisterView.vue'),
    },
    meta: { titleKey: 'auth.registerTitle', requiresGuest: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/ProfileView.vue'),
      mobile: () => import('@/views/mobile/MobileProfileView.vue'),
    },
    meta: { titleKey: 'auth.profile', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: DeviceView,
    props: {
      desktop: () => import('@/views/NotFoundView.vue'),
      mobile: () => import('@/views/mobile/MobileNotFoundView.vue'),
    },
    meta: { titleKey: 'notFound.accessDenied' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
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
router.beforeEach((to) => {
  const auth = useAuthStore()

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
    console.error('[Router] Chunk load failure — reloading page', error)
    window.location.reload()
  }
})

export default router
