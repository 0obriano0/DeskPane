import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WindowManager,
  type EdgeSnapEvent,
} from "../../src/core/WindowManager.js";
import { createSizedContainer, mockElementBox } from "../helpers/dom.js";

const managers: WindowManager[] = [];

function createManager(
  options: ConstructorParameters<typeof WindowManager>[0] = {},
): WindowManager {
  const manager = new WindowManager({
    container: options.container ?? createSizedContainer(),
    isolated: true,
    injectStyles: false,
    throttleMs: 0,
    ...options,
  });
  managers.push(manager);
  return manager;
}

function openTestWindow(manager: WindowManager, id = "notes"): void {
  const content = document.createElement("div");
  content.textContent = `${id} content`;
  manager.open({
    id,
    title: id,
    content,
    x: 100,
    y: 80,
    width: 300,
    height: 200,
  });
}

afterEach(() => {
  managers.splice(0).forEach((manager) => manager.destroy());
});

describe("WindowManager lifecycle", () => {
  it("opens, reuses, and closes a window without duplicating its DOM", () => {
    const manager = createManager();
    const opened = vi.fn();
    const closed = vi.fn();
    manager.events.on("window:opened", opened);
    manager.events.on("window:closed", closed);

    openTestWindow(manager);
    manager.minimize("notes");
    openTestWindow(manager);

    expect(manager.getWindowIds()).toEqual(["notes"]);
    expect(document.querySelectorAll('[data-dp-id="notes"]')).toHaveLength(1);
    expect(manager.getState("notes")?.isMinimized).toBe(false);
    expect(opened).toHaveBeenCalledTimes(1);

    manager.close("notes");
    expect(manager.getState("notes")).toBeUndefined();
    expect(document.querySelector('[data-dp-id="notes"]')).toBeNull();
    expect(closed).toHaveBeenCalledWith({ id: "notes" });
  });

  it("keeps a maximized window maximized when it is minimized and activated again", () => {
    const manager = createManager();
    openTestWindow(manager);

    manager.maximize("notes");
    manager.minimize("notes");
    manager.maximize("notes");

    expect(manager.getState("notes")).toMatchObject({
      isMaximized: true,
      isMinimized: false,
    });
    expect(
      manager.getWindowElement("notes")?.classList.contains("dp-maximized"),
    ).toBe(true);
  });

  it("restores the saved geometry through the maximize button", () => {
    const manager = createManager();
    openTestWindow(manager);
    manager.maximize("notes");

    const maximizeButton = manager
      .getWindowElement("notes")
      ?.querySelector<HTMLButtonElement>(".dp-btn-max");
    maximizeButton?.click();

    expect(manager.getState("notes")).toMatchObject({
      x: 100,
      y: 80,
      width: 300,
      height: 200,
      isMaximized: false,
    });
  });

  it("closes child windows and modal overlays with their parent", () => {
    const manager = createManager();
    openTestWindow(manager, "parent");
    manager.open({
      id: "child",
      title: "Child",
      content: document.createElement("div"),
      parentId: "parent",
      modal: true,
      width: 240,
      height: 160,
    });

    expect(manager.getChildIds("parent")).toEqual(["child"]);
    expect(
      manager.getWindowElement("parent")?.querySelector(".dp-modal-overlay"),
    ).not.toBeNull();

    manager.close("parent");
    expect(manager.getState("parent")).toBeUndefined();
    expect(manager.getState("child")).toBeUndefined();
    expect(document.querySelector(".dp-modal-overlay")).toBeNull();
  });
});

describe("WindowManager edge snap", () => {
  it("previews and applies a left half-screen snap from the pointer position", () => {
    const container = createSizedContainer(800, 600);
    const manager = createManager({
      container,
      snap: true,
      edgeSnap: true,
      edgeSnapThreshold: 20,
    });
    const preview = vi.fn();
    const snapped = vi.fn<(event: EdgeSnapEvent) => void>();
    manager.events.on("window:edge-snap-preview", preview);
    manager.events.on<EdgeSnapEvent>("window:edge-snapped", snapped);
    openTestWindow(manager);

    const root = manager.getWindowElement("notes")!;
    const header = root.querySelector<HTMLElement>(".dp-header")!;
    mockElementBox(root, { left: 100, top: 80, width: 300, height: 200 });

    header.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        clientX: 150,
        clientY: 100,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 1, clientY: 240 }),
    );

    const snapPreview = container.querySelector<HTMLElement>(
      ".dp-edge-snap-preview",
    );
    expect(snapPreview?.dataset.edgeSnapTarget).toBe("left");
    expect(
      snapPreview?.classList.contains("dp-edge-snap-preview--visible"),
    ).toBe(true);
    expect(preview).toHaveBeenCalledWith({
      id: "notes",
      edgeSnapTarget: "left",
    });

    document.dispatchEvent(new MouseEvent("mouseup"));

    expect(manager.getState("notes")).toMatchObject({
      x: 0,
      y: 0,
      width: 400,
      height: 600,
      isMaximized: false,
    });
    expect(snapped.mock.calls[0]?.[0].edgeSnapTarget).toBe("left");
  });
});
