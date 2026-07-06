<template>
  <div class="properties-panel">
    <h2 class="title">📋 {{ t('properties.title') }}</h2>
    <p class="copy">
      {{ t('properties.line1') }}<br />
      {{ t('properties.line2') }}<br />
      {{ t('properties.line3') }}
    </p>

    <div class="fields">
      <label class="check">
        <span>{{ t('properties.optionA') }}</span>
        <input type="checkbox" />
      </label>
      <label class="check">
        <span>{{ t('properties.optionB') }}</span>
        <input type="checkbox" />
      </label>
      <label class="number-field">
        <span>{{ t('properties.value') }}</span>
        <input type="number" value="100" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.properties-panel {
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  overflow: auto;
  background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 800;
}

.copy {
  margin: 0 0 13px;
  color: rgba(226, 232, 240, 0.62);
  font-size: 13px;
  line-height: 1.6;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.check,
.number-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

input[type='number'] {
  width: 90px;
  height: 30px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  padding: 0 8px;
}
</style>
