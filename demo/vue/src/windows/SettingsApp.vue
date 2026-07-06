<template>
  <div class="settings-app">
    <h2 class="title">⚙️ {{ t('settings.title') }}</h2>

    <section class="card">
      <div class="card-label">{{ t('settings.appearance') }}</div>
      <label class="field">
        <span>{{ t('settings.language') }}</span>
        <select v-model="locale">
          <option value="zh-TW">{{ t('settings.zhTW') }}</option>
          <option value="en">{{ t('settings.en') }}</option>
        </select>
      </label>
      <p class="field-hint">{{ t('settings.languageDescription') }}</p>
      <label class="field">
        <span>{{ t('settings.theme') }}</span>
        <select>
          <option>Dark desktop</option>
          <option>Light desktop</option>
          <option>Medieval pixel</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('settings.dockPosition') }}</span>
        <select>
          <option>Bottom</option>
          <option>Top</option>
          <option>Left</option>
          <option>Right</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('settings.snapGap') }}</span>
        <input type="number" min="0" max="50" value="0" />
      </label>
    </section>

    <section class="card">
      <div class="card-label">{{ t('settings.childWindows') }}</div>
      <div class="button-row">
        <button class="action danger" type="button" @click="emit('openModal')">
          🔴 {{ t('settings.openModal') }}
        </button>
        <button class="action primary" type="button" @click="emit('openProperties')">
          🔵 {{ t('settings.openProperties') }}
        </button>
      </div>
      <p class="hint">
        🔴 <b>Modal</b>: {{ t('settings.modalHint') }}<br />
        🔵 <b>Non-modal</b>: {{ t('settings.nonModalHint') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  (event: 'openModal'): void
  (event: 'openProperties'): void
}>()

const { t, locale } = useI18n()
</script>

<style scoped>
.settings-app {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  padding: 13px 14px;
}

.card-label {
  margin-bottom: 10px;
  color: #60a5fa;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-top: 9px;
  font-size: 13px;
}

.field-hint {
  margin: 7px 0 2px 130px;
  color: rgba(226, 232, 240, 0.54);
  font-size: 11px;
  line-height: 1.5;
}

select,
input {
  min-width: 0;
  height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  padding: 0 10px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.action.danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.34);
}

.action.primary {
  background: linear-gradient(135deg, #2980b9, #1a5276);
  box-shadow: 0 2px 8px rgba(41, 128, 185, 0.34);
}

.action:hover {
  filter: brightness(1.08);
}

.hint {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
  line-height: 1.6;
}
</style>
