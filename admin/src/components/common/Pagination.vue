<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(props.totalPages, props.page + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="pagination" v-if="totalPages > 1">
    <button
      class="pagination-btn"
      :disabled="page <= 1"
      @click="emit('pageChange', page - 1)"
    >
      <ArrowLeft :size="16" />
    </button>
    <button
      v-for="p in visiblePages"
      :key="p"
      class="pagination-btn"
      :class="{ active: p === page }"
      @click="emit('pageChange', p)"
    >
      {{ p }}
    </button>
    <button
      class="pagination-btn"
      :disabled="page >= totalPages"
      @click="emit('pageChange', page + 1)"
    >
      <ArrowRight :size="16" />
    </button>
  </div>
</template>
