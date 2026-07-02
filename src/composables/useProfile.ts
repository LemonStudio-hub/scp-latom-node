import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

export function useProfile() {
  const { t } = useI18n()
  const router = useRouter()
  const auth = useAuthStore()

  const activeTab = ref<'profile' | 'ai'>('profile')

  const editingCodename = ref(false)
  const changingPassword = ref(false)
  const newCodename = ref('')
  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmNew = ref('')
  const localError = ref('')
  const successMsg = ref('')

  onMounted(() => {
    if (!auth.isAuthenticated) {
      router.push('/login')
    }
  })

  function startEditCodename() {
    newCodename.value = auth.user?.codename || ''
    editingCodename.value = true
    localError.value = ''
    auth.error = ''
    successMsg.value = ''
  }

  async function saveCodename() {
    localError.value = ''
    auth.error = ''
    successMsg.value = ''
    if (!newCodename.value.trim()) return
    const ok = await auth.updateProfile({ codename: newCodename.value.trim() })
    if (ok) {
      editingCodename.value = false
      successMsg.value = t('auth.codenameUpdated')
    }
  }

  async function savePassword() {
    localError.value = ''
    auth.error = ''
    successMsg.value = ''
    if (newPassword.value.length < 8) {
      localError.value = t('auth.errors.passwordLength')
      return
    }
    if (newPassword.value !== confirmNew.value) {
      localError.value = t('auth.errors.passwordMismatch')
      return
    }
    const ok = await auth.updateProfile({
      password: currentPassword.value,
      newPassword: newPassword.value,
    })
    if (ok) {
      changingPassword.value = false
      currentPassword.value = ''
      newPassword.value = ''
      confirmNew.value = ''
      successMsg.value = t('auth.passwordUpdated')
    }
  }

  function handleLogout() {
    auth.logout()
    router.push('/')
  }

  return {
    t,
    auth,
    router,
    activeTab,
    editingCodename,
    changingPassword,
    newCodename,
    currentPassword,
    newPassword,
    confirmNew,
    localError,
    successMsg,
    startEditCodename,
    saveCodename,
    savePassword,
    handleLogout,
  }
}
