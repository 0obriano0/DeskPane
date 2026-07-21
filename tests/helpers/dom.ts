import { vi } from "vitest";

export interface ElementBox {
  left?: number;
  top?: number;
  width: number;
  height: number;
}

export function mockElementBox(element: HTMLElement, box: ElementBox): void {
  const left = box.left ?? 0;
  const top = box.top ?? 0;
  Object.defineProperties(element, {
    offsetWidth: { configurable: true, get: () => box.width },
    offsetHeight: { configurable: true, get: () => box.height },
  });
  vi.spyOn(element, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(left, top, box.width, box.height),
  );
}

export function createSizedContainer(width = 800, height = 600): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  mockElementBox(container, { width, height });
  return container;
}
