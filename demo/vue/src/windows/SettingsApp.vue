<template>
  <div class="settings-app">
    <h2 class="title">⚙️ 系統設定</h2>

    <section class="card">
      <div class="card-label">外觀設定</div>
      <label class="field">
        <span>主題</span>
        <select>
          <option>Dark desktop</option>
          <option>Light desktop</option>
          <option>Medieval pixel</option>
        </select>
      </label>
      <label class="field">
        <span>Dock 位置</span>
        <select>
          <option>Bottom</option>
          <option>Top</option>
          <option>Left</option>
          <option>Right</option>
        </select>
      </label>
      <label class="field">
        <span>視窗吸附間距</span>
        <input type="number" min="0" max="50" value="0" />
      </label>
    </section>

    <section class="card">
      <div class="card-label">子視窗功能示範</div>
      <div class="button-row">
        <button class="action danger" type="button" @click="emit('openModal')">
          🔴 Modal 確認對話框
        </button>
        <button class="action primary" type="button" @click="emit('openProperties')">
          🔵 開啟屬性面板（非獨佔）
        </button>
      </div>
      <p class="hint">
        🔴 <b>Modal</b>：子視窗開啟後，父視窗加遮罩不可操作；點擊遮罩子視窗會抖動。<br />
        🔵 <b>非獨佔</b>：子視窗與父視窗可自由切換，Dock 只顯示父視窗項目。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: 'openModal'): void
  (event: 'openProperties'): void
}>()
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
