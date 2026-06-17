<template>
  <div class="confirm-dialog">
    <div class="icon">⚠️</div>
    <div class="title">確認儲存設定？</div>
    <p class="copy">
      此操作將覆蓋現有設定。<br />
      確定要繼續嗎？
    </p>
    <div class="actions">
      <button class="btn ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn danger" type="button" @click="emit('close')">確認儲存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<style scoped>
.confirm-dialog {
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 13px;
  text-align: center;
  background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.icon {
  font-size: 40px;
  line-height: 1;
}

.title {
  font-size: 15px;
  font-weight: 800;
}

.copy {
  margin: 0;
  color: rgba(226, 232, 240, 0.62);
  font-size: 13px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 3px;
}

.btn {
  height: 34px;
  padding: 0 22px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn.ghost {
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: transparent;
  color: inherit;
}

.btn.danger {
  border: 0;
  background: #e74c3c;
  color: #fff;
}

.btn:hover {
  filter: brightness(1.08);
}
</style>
