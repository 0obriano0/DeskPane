import { ref, provide, inject } from 'vue'
import type { Ref } from 'vue'

export interface CodeFile {
  name: string
  /** highlight.js language key (typescript | javascript | html | css | vue) */
  lang: string
  code: string
}

const PAGE_CODE_KEY = Symbol('pageCode')
const SET_CODE_KEY  = Symbol('setPageCode')

/** 在 App.vue 呼叫，提供共用 code 狀態 */
export function provideDocCode() {
  const pageCode = ref<CodeFile[]>([])
  provide(PAGE_CODE_KEY, pageCode)
  provide(SET_CODE_KEY, (files: CodeFile[]) => { pageCode.value = files })
  return pageCode
}

/** 在各 Demo 頁面呼叫，登記要顯示在右側 Code Panel 的程式碼 */
export function useDocCode() {
  const pageCode = inject<Ref<CodeFile[]>>(PAGE_CODE_KEY)
  const setCode = inject<(files: CodeFile[]) => void>(SET_CODE_KEY)
  return { pageCode: pageCode ?? ref<CodeFile[]>([]), setCode: setCode ?? (() => {}) }
}
