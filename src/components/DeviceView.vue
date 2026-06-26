<script setup lang="ts">
import { useDevice } from '@/composables/useDevice'
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  desktop: () => Promise<any>
  mobile: () => Promise<any>
}>()

const { isMobile } = useDevice()

const DesktopComponent = defineAsyncComponent(props.desktop)
const MobileComponent = defineAsyncComponent(props.mobile)
</script>

<template>
  <MobileComponent v-if="isMobile" />
  <DesktopComponent v-else />
</template>
