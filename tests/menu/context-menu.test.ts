import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "../../src/menu/ContextMenu.js";

const menus: ContextMenu[] = [];

afterEach(() => {
  menus.splice(0).forEach((menu) => menu.destroy());
});

describe("ContextMenu keyboard and selection behavior", () => {
  it("focuses the first enabled item, navigates, and closes with Escape", () => {
    const menu = new ContextMenu({
      injectStyles: false,
      items: [
        { id: "disabled", label: "Disabled", disabled: true },
        { id: "open", label: "Open" },
        { id: "rename", label: "Rename" },
      ],
    });
    menus.push(menu);
    menu.showAt(40, 50);

    const open = menu
      .getElement()
      .querySelector<HTMLButtonElement>('[data-menu-id="open"]')!;
    const rename = menu
      .getElement()
      .querySelector<HTMLButtonElement>('[data-menu-id="rename"]')!;
    expect(menu.isOpen()).toBe(true);
    expect(menu.getElement().getAttribute("aria-hidden")).toBe("false");
    expect(document.activeElement).toBe(open);

    open.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    expect(document.activeElement).toBe(rename);

    rename.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(menu.isOpen()).toBe(false);
    expect(menu.getElement().getAttribute("aria-hidden")).toBe("true");
  });

  it("opens and closes a submenu with ArrowRight and ArrowLeft", () => {
    const menu = new ContextMenu({
      injectStyles: false,
      items: [
        {
          id: "tools",
          label: "Tools",
          children: [{ id: "settings", label: "Settings" }],
        },
      ],
    });
    menus.push(menu);
    menu.showAt(0, 0);

    const tools = menu
      .getElement()
      .querySelector<HTMLButtonElement>('[data-menu-id="tools"]')!;
    const settings = menu
      .getElement()
      .querySelector<HTMLButtonElement>('[data-menu-id="settings"]')!;
    tools.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(tools.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(settings);

    settings.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(tools.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(tools);
  });

  it("emits selection, invokes the action, and closes after a click", () => {
    const action = vi.fn();
    const selected = vi.fn();
    const menu = new ContextMenu({
      injectStyles: false,
      items: [{ id: "open", label: "Open", action }],
    });
    menus.push(menu);
    menu.events.on("menu:select", selected);
    menu.showAt(0, 0);

    menu
      .getElement()
      .querySelector<HTMLButtonElement>('[data-menu-id="open"]')
      ?.click();

    expect(action).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(menu.isOpen()).toBe(false);
  });

  it("binds the browser contextmenu gesture and can be unbound", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const menu = new ContextMenu({ injectStyles: false });
    menus.push(menu);
    const unbind = menu.bindTo(target, () => [
      { id: "dynamic", label: "Dynamic" },
    ]);

    const firstEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 20,
      clientY: 30,
    });
    target.dispatchEvent(firstEvent);
    expect(firstEvent.defaultPrevented).toBe(true);
    expect(menu.isOpen()).toBe(true);
    expect(
      menu.getElement().querySelector('[data-menu-id="dynamic"]'),
    ).not.toBeNull();

    menu.hide();
    unbind();
    target.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );
    expect(menu.isOpen()).toBe(false);
  });
});
