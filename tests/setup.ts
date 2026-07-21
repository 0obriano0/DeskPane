import { afterEach, beforeEach, vi } from "vitest";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const storageData = new Map<string, string>();
const localStorageStub: Storage = {
  get length() {
    return storageData.size;
  },
  clear() {
    storageData.clear();
  },
  getItem(key) {
    return storageData.get(String(key)) ?? null;
  },
  key(index) {
    return Array.from(storageData.keys())[index] ?? null;
  },
  removeItem(key) {
    storageData.delete(String(key));
  },
  setItem(key, value) {
    storageData.set(String(key), String(value));
  },
};
vi.stubGlobal("localStorage", localStorageStub);
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

if (!globalThis.CSS) {
  Object.defineProperty(globalThis, "CSS", { value: {}, configurable: true });
}
if (!globalThis.CSS.escape) {
  globalThis.CSS.escape = (value) => String(value).replace(/["\\]/g, "\\$&");
}

beforeEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
  localStorageStub.clear();
  Object.defineProperty(window, "innerWidth", {
    value: 1280,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: 720,
    configurable: true,
  });
});

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});
