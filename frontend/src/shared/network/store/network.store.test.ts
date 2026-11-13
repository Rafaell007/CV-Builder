import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearQueryFailed,
  getServerSnapshot,
  getSnapshot,
  markQueryFailed,
  subscribe,
} from "./network.store";

// Sets what the browser reports as its connection.
function stubOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

afterEach(() => {
  clearQueryFailed();
  vi.restoreAllMocks();
});

describe("getSnapshot", () => {
  it("is online when the browser is online and no query failed", () => {
    stubOnline(true);

    expect(getSnapshot()).toBe("online");
  });

  it("is offline when the browser is offline", () => {
    stubOnline(false);

    expect(getSnapshot()).toBe("offline");
  });

  it("is queryFailed after a failed query", () => {
    stubOnline(true);

    markQueryFailed();

    expect(getSnapshot()).toBe("queryFailed");
  });

  it("prefers offline over a failed query", () => {
    stubOnline(false);

    markQueryFailed();

    expect(getSnapshot()).toBe("offline");
  });

  it("is online again after the failed query is cleared", () => {
    stubOnline(true);
    markQueryFailed();

    clearQueryFailed();

    expect(getSnapshot()).toBe("online");
  });
});

describe("getServerSnapshot", () => {
  it("is always online", () => {
    stubOnline(false);

    expect(getServerSnapshot()).toBe("online");
  });
});

describe("subscribe", () => {
  it("notifies on the browser's online and offline events", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("notifies once when a query fails, not again while it stays failed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    markQueryFailed();
    markQueryFailed();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("notifies when the failed query is cleared, not when nothing failed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    clearQueryFailed();
    markQueryFailed();
    clearQueryFailed();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribe(listener)();

    window.dispatchEvent(new Event("offline"));
    markQueryFailed();

    expect(listener).not.toHaveBeenCalled();
  });
});
