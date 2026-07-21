import { createApp, defineComponent, h, nextTick, ref, type App } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { DpWindow, DpWindowManager } from "../../src/adapters/vue/index.js";
import type { WindowManager } from "../../src/core/WindowManager.js";

let mountedApp: App<Element> | null = null;

afterEach(() => {
  mountedApp?.unmount();
  mountedApp = null;
});

describe("DpWindow closed registration regression", () => {
  it("stays closed during translated prop updates and reopens from v-model state", async () => {
    const isOpen = ref(true);
    const locale = ref<"en" | "zh-TW">("en");
    let manager: WindowManager | null = null;

    const Root = defineComponent({
      setup() {
        return () =>
          h(
            DpWindowManager,
            {
              injectStyles: false,
              snap: false,
              onInitialized: (instance: WindowManager) => {
                manager = instance;
              },
            },
            {
              default: () =>
                h(
                  DpWindow,
                  {
                    id: "calculator",
                    key: "calculator",
                    title: locale.value === "en" ? "Calculator" : "計算機",
                    label: locale.value === "en" ? "Calculator" : "計算機",
                    open: isOpen.value,
                    "onUpdate:open": (value: boolean) => {
                      isOpen.value = value;
                    },
                  },
                  {
                    default: () =>
                      h("div", { class: "calculator-content" }, locale.value),
                  },
                ),
            },
          );
      },
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    mountedApp = createApp(Root);
    mountedApp.mount(host);
    await nextTick();
    await nextTick();

    expect(manager).not.toBeNull();
    expect(manager!.getState("calculator")?.title).toBe("Calculator");

    manager!.close("calculator");
    await nextTick();
    expect(isOpen.value).toBe(false);
    expect(manager!.getState("calculator")).toBeUndefined();

    locale.value = "zh-TW";
    await nextTick();
    expect(manager!.getState("calculator")).toBeUndefined();

    isOpen.value = true;
    await nextTick();
    await nextTick();

    expect(manager!.getState("calculator")?.title).toBe("計算機");
    expect(document.querySelector(".calculator-content")?.textContent).toBe(
      "zh-TW",
    );
  });
});
