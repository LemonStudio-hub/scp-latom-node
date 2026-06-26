<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchModal from '@/components/layout/SearchModal.vue'
import MobileLayout from '@/components/mobile/MobileLayout.vue'
import MobileSearchModal from '@/components/mobile/MobileSearchModal.vue'
import { useDevice } from '@/composables/useDevice'

const { isMobile } = useDevice()
</script>

<template>
  <!-- Desktop Layout -->
  <template v-if="!isMobile">
    <AppHeader />
    <AppSidebar />

    <main class="main">
      <div class="main-content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
        <AppFooter />
      </div>
    </main>

    <SearchModal />
  </template>

  <!-- Mobile Layout -->
  <MobileLayout v-else>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </MobileLayout>

  <MobileSearchModal v-if="isMobile" />
</template>

<style>
@import './styles/base.css';
</style>

<style scoped>
.main {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
  padding: var(--space-2xl) var(--pad-page);
}

.main-content {
  max-width: var(--max-content);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
    padding: var(--space-lg) var(--pad-page);
    padding-bottom: calc(var(--nav-height) + var(--space-md));
  }
}
</style>
