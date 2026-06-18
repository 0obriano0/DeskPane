<template>
  <div class="sample-tabs-wrap">
    <div class="sample-tabs" role="tablist" :aria-label="ariaLabel">
      <button
        v-for="sample in samples"
        :key="sample.id"
        type="button"
        class="sample-tab"
        :class="{ active: modelValue === sample.id }"
        role="tab"
        :aria-selected="modelValue === sample.id"
        @click="$emit('update:modelValue', sample.id)"
      >
        {{ sample.label }}
      </button>
    </div>

    <div v-if="currentSample?.description" class="sample-note">
      <strong>{{ currentSample.label }}</strong>
      <span>{{ currentSample.description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DocSampleTab {
  id: string
  label: string
  description?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  samples: readonly DocSampleTab[]
  ariaLabel?: string
}>(), {
  ariaLabel: 'Sample variants',
})

defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const currentSample = computed(() =>
  props.samples.find(sample => sample.id === props.modelValue) ?? props.samples[0]
)
</script>

<style scoped>
.sample-tabs-wrap {
  margin: 18px 0 16px;
}

.sample-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #d4d9de;
  overflow-x: auto;
}

.sample-tab {
  border: 0;
  border-right: 1px solid #d4d9de;
  background: #f7f9fb;
  color: #536577;
  padding: 9px 20px;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.sample-tab:hover {
  color: #087c98;
  background: #eef8fa;
}

.sample-tab.active {
  background: #fff;
  color: #111827;
  box-shadow: inset 0 -3px 0 #2f9bb3;
}

.sample-note {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 12px;
  border: 1px solid #d4d9de;
  border-top: 0;
  background: #f7f9fb;
  font-size: 13px;
}

.sample-note strong {
  color: #087c98;
  white-space: nowrap;
}

.sample-note span {
  color: #536577;
}

@media (max-width: 640px) {
  .sample-note {
    display: block;
  }

  .sample-note strong {
    display: block;
    margin-bottom: 4px;
  }
}
</style>
