import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getNetworkFailed,
  reportRequestFailure,
  resetNetworkStatus,
  subscribeToNetworkStatus,
} from "./networkStatus.store";

afterEach(() => {
  resetNetworkStatus();
  vi.unstubAllGlobals();
});

describe("network status store", () => {
  it("starts without a failure", () => {
    expect(getNetworkFailed()).toBe(false);
  });

  it("follows the browser going offline and online", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNetworkStatus(listener);

    window.dispatchEvent(new Event("offline"));
    expect(getNetworkFailed()).toBe(true);

    window.dispatchEvent(new Event("online"));
    expect(getNetworkFailed()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("keeps a request failure until the page is reloaded, even when the browser is online", () => {
    const unsubscribe = subscribeToNetworkStatus(() => {});

    reportRequestFailure();
    window.dispatchEvent(new Event("online"));

    expect(getNetworkFailed()).toBe(true);
    unsubscribe();
  });

  it("reads the state of the browser when the first listener subscribes", () => {
    vi.stubGlobal("navigator", { onLine: false });

    const unsubscribe = subscribeToNetworkStatus(() => {});

    expect(getNetworkFailed()).toBe(true);
    unsubscribe();
  });

  it("stops listening to the browser after the last unsubscribe", () => {
    const listener = vi.fn();
    subscribeToNetworkStatus(listener)();

    window.dispatchEvent(new Event("offline"));

    expect(listener).not.toHaveBeenCalled();
  });
});
