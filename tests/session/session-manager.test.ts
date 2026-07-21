import { afterEach, describe, expect, it, vi } from "vitest";
import { WindowManager } from "../../src/core/WindowManager.js";
import { SessionManager } from "../../src/session/SessionManager.js";
import type { SessionSnapshot } from "../../src/session/types.js";
import { createSizedContainer } from "../helpers/dom.js";

const managers: WindowManager[] = [];

function createManager(): WindowManager {
  const manager = new WindowManager({
    container: createSizedContainer(),
    isolated: true,
    injectStyles: false,
  });
  managers.push(manager);
  return manager;
}

afterEach(() => {
  managers.splice(0).forEach((manager) => manager.destroy());
});

describe("SessionManager", () => {
  it("serializes restorable windows and skips windows without an appId", () => {
    const manager = createManager();
    manager.open({
      id: "notes",
      title: "Notes",
      content: document.createElement("div"),
      x: 20,
      y: 30,
      width: 320,
      height: 240,
      props: { appId: "notes-app", documentId: 7 },
    });
    manager.open({
      id: "temporary",
      title: "Temporary",
      content: document.createElement("div"),
    });

    const snapshot = JSON.parse(
      SessionManager.serializeWindows(manager),
    ) as SessionSnapshot;

    expect(snapshot.version).toBe(1);
    expect(snapshot.windows).toHaveLength(1);
    expect(snapshot.windows?.[0]).toMatchObject({
      id: "notes",
      appId: "notes-app",
      x: 20,
      y: 30,
      width: 320,
      height: 240,
      props: { appId: "notes-app", documentId: 7 },
    });
  });

  it("restores content, geometry, and a minimized maximized state", () => {
    const source = createManager();
    source.open({
      id: "report",
      title: "Report",
      content: document.createElement("div"),
      x: 70,
      y: 90,
      width: 500,
      height: 360,
      props: { appId: "report-app", reportId: 42 },
    });
    source.maximize("report");
    source.minimize("report");
    const json = SessionManager.serializeWindows(source);

    const target = createManager();
    const factory = vi.fn((props?: Record<string, unknown>) => {
      const content = document.createElement("div");
      content.dataset.reportId = String(props?.reportId);
      return content;
    });
    SessionManager.restoreWindows(json, { "report-app": factory }, target);

    expect(factory).toHaveBeenCalledWith({ appId: "report-app", reportId: 42 });
    expect(target.getState("report")).toMatchObject({
      isMaximized: true,
      isMinimized: true,
    });
    expect(
      target.getBodyElement("report")?.querySelector('[data-report-id="42"]'),
    ).not.toBeNull();
  });

  it("warns and skips a snapshot whose app factory is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const target = createManager();
    const snapshot: SessionSnapshot = {
      version: 1,
      currentWorkspaceId: null,
      windows: [
        {
          id: "missing",
          title: "Missing",
          appId: "missing-app",
          x: 0,
          y: 0,
          width: 300,
          height: 200,
          zIndex: 101,
          isMinimized: false,
          isMaximized: false,
          resizable: true,
        },
      ],
    };

    SessionManager.restoreWindows(JSON.stringify(snapshot), {}, target);

    expect(target.getState("missing")).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("No factory found"),
    );
  });

  it("rejects malformed JSON with a useful error", () => {
    expect(() =>
      SessionManager.restoreWindows("{bad json", {}, createManager()),
    ).toThrow("[SessionManager] Failed to parse session snapshot");
  });
});
