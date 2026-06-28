<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localValue = ref(props.modelValue)
let debounce: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (v) => { localValue.value = v })

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  localValue.value = val
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => emit('update:modelValue', val), 300)
}
</script>

<template>
  <div class="search-input-wrap">
    <Search class="search-icon" :size="16" />
    <input
      :value="localValue"
      @input="onInput"
      type="text"
      :placeholder="placeholder || 'Search...'"
      class="input search-input"
    />
  </div>
</template>

<style scoped>
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  padding-left: 34px;
  min-width: 240px;
}
</style>
