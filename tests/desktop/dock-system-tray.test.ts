import { afterEach, describe, expect, it, vi } from "vitest";
import { Dock } from "../../src/desktop/Dock.js";
import {
  SystemTray,
  type SystemTrayItemEvent,
  type SystemTrayItemsChangedEvent,
} from "../../src/desktop/SystemTray.js";

const docks: Dock[] = [];
const trays: SystemTray[] = [];

afterEach(() => {
  docks.splice(0).forEach((dock) => dock.destroy());
  trays.splice(0).forEach((tray) => tray.destroy());
});

describe("Dock compatibility and slots", () => {
  it("preserves direct item children when no slots are configured", () => {
    const action = vi.fn();
    const dock = new Dock({
      items: [{ id: "notes", label: "Notes", icon: "N", action }],
    });
    docks.push(dock);

    const root = dock.getElement();
    document.body.appendChild(root);
    expect(root.classList.contains("dp-dock--slotted")).toBe(false);
    expect(root.querySelector(":scope > .dp-dock-items")).toBeNull();
    expect(root.querySelectorAll(":scope > .dp-dock-item")).toHaveLength(1);
    expect(dock.getItemsElement()).toBe(root);

    dock.getItemElement("notes")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      }),
    );
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("renders leading/trailing slots and returns to legacy DOM when they are cleared", () => {
    const start = document.createElement("button");
    start.textContent = "Start";
    const status = document.createElement("span");
    status.textContent = "12:00";
    const dock = new Dock({
      leading: start,
      trailing: status,
      items: [{ id: "notes", label: "Notes", icon: "N", action: vi.fn() }],
    });
    docks.push(dock);
    document.body.appendChild(dock.getElement());

    expect(dock.getElement().classList.contains("dp-dock--slotted")).toBe(true);
    expect(dock.getSlotElement("leading")?.contains(start)).toBe(true);
    expect(dock.getSlotElement("trailing")?.contains(status)).toBe(true);
    expect(dock.getItemsElement().classList.contains("dp-dock-items")).toBe(
      true,
    );

    dock.setLeading(null);
    dock.setTrailing(null);

    expect(dock.getElement().classList.contains("dp-dock--slotted")).toBe(
      false,
    );
    expect(dock.getSlotElement("leading")).toBeNull();
    expect(dock.getItemsElement()).toBe(dock.getElement());
    expect(
      dock.getElement().querySelectorAll(":scope > .dp-dock-item"),
    ).toHaveLength(1);
  });

  it("lets an item renderer decorate the managed host without replacing activation", () => {
    const action = vi.fn();
    const dock = new Dock({
      itemLayout: "taskbar",
      items: [{ id: "notes", label: "Notes", icon: "N", action }],
      itemRenderer: ({ container, renderDefault }) => {
        renderDefault();
        container.dataset.rendered = "custom";
      },
    });
    docks.push(dock);
    document.body.appendChild(dock.getElement());

    const item = dock.getItemElement("notes");
    expect(dock.getElement().classList.contains("dp-dock--taskbar")).toBe(true);
    expect(item?.dataset.rendered).toBe("custom");
    expect(item?.querySelector(".dp-dock-icon")).not.toBeNull();
    item?.click();
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe("SystemTray", () => {
  it("uses button semantics for commands and status semantics for passive items", () => {
    const tray = new SystemTray({
      ariaLabel: "Desktop status",
      items: [
        { id: "network", label: "Network", icon: "N", action: vi.fn() },
        { id: "clock", label: "Clock", icon: "C" },
      ],
    });
    trays.push(tray);
    document.body.appendChild(tray.getElement());

    expect(tray.getElement().getAttribute("role")).toBe("toolbar");
    expect(tray.getElement().getAttribute("aria-label")).toBe("Desktop status");
    expect(tray.getItemElement("network")).toBeInstanceOf(HTMLButtonElement);
    expect(tray.getItemElement("clock")?.getAttribute("role")).toBe("status");
  });

  it("supports CRUD, badges, disabled state, and change reasons", () => {
    const tray = new SystemTray();
    const changes: SystemTrayItemsChangedEvent[] = [];
    tray.events.on<SystemTrayItemsChangedEvent>("tray:items-changed", (event) =>
      changes.push(event),
    );
    trays.push(tray);

    tray.addItem({ id: "mail", label: "Mail", icon: "M" });
    tray.setBadge("mail", 3);
    tray.setDisabled("mail", true);
    tray.removeItem("mail");

    expect(changes.map((change) => change.reason)).toEqual([
      "add",
      "update",
      "update",
      "remove",
    ]);
    expect(tray.getItems()).toEqual([]);
    expect(() =>
      tray.setItems([
        { id: "same", label: "One" },
        { id: "same", label: "Two" },
      ]),
    ).toThrow("Duplicate item id");
  });

  it("allows activation listeners to cancel the item action", () => {
    const action = vi.fn();
    const tray = new SystemTray({
      items: [{ id: "volume", label: "Volume", action }],
    });
    trays.push(tray);
    tray.events.on<SystemTrayItemEvent>("tray:item-activated", (event) => {
      event.originalEvent.preventDefault();
    });

    tray.getItemElement("volume")?.click();
    expect(action).not.toHaveBeenCalled();
  });
});
