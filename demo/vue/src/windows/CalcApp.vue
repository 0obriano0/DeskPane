<template>
  <div class="calc-app">
    <div class="display">{{ display }}</div>
    <div class="grid">
      <button
        v-for="k in keys" :key="k"
        class="key"
        :class="{ op: isOp(k), fn: isFn(k) }"
        @click="press(k)"
      >{{ k }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const display = ref('0')
let expr = ''

const keys = ['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','=']

const isOp = (k: string) => '÷×−+='.includes(k)
const isFn = (k: string) => 'C±%'.includes(k)

function press(k: string) {
  if (k === 'C') { expr = ''; display.value = '0'; return }
  if (k === '=') {
    try {
      const r = Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))()
      display.value = String(r); expr = String(r)
    } catch { display.value = t('calc.error'); expr = '' }
    return
  }
  if (k === '⌫') { expr = expr.slice(0,-1); display.value = expr || '0'; return }
  if (k === '±') {
    try {
      const v = -Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))()
      display.value = String(v); expr = String(v)
    } catch {} return
  }
  if (k === '%') {
    try {
      const v = Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))() / 100
      display.value = String(v); expr = String(v)
    } catch {} return
  }
  expr += k; display.value = expr
}
</script>

<style scoped>
.calc-app {
  height: 100%; display: flex; flex-direction: column; gap: 10px;
  padding: 12px; box-sizing: border-box;
  background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0);
}
.display {
  width: 100%; padding: 10px; font-size: 22px; text-align: right;
  border-radius: 6px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06); min-height: 48px;
  word-break: break-all;
}
.grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; flex: 1;
}
.key {
  padding: 0; font-size: 16px; font-weight: 500; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08); cursor: pointer;
  background: rgba(255,255,255,0.08); color: inherit;
  transition: opacity .1s;
}
.key:active { opacity: 0.65; }
.key.op { background: #ff9500; color: #fff; border-color: #ff9500; }
.key.fn { background: rgba(255,255,255,0.18); }
</style>
