import type { NetworkStatus } from "../network.types";

// Store for useSyncExternalStore: the browser knows "offline"; the Apollo link reports failed queries.

let queryFailed = false;
const listeners = new Set<() => void>();

const notifyListeners = () => listeners.forEach((listener) => listener());

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};

export const getSnapshot = (): NetworkStatus => {
  if (!navigator.onLine) return "offline";
  return queryFailed ? "queryFailed" : "online";
};

// The server cannot know; the page always renders as online first.
export const getServerSnapshot = (): NetworkStatus => "online";

export const markQueryFailed = (): void => {
  if (queryFailed) return;
  queryFailed = true;
  notifyListeners();
};

export const clearQueryFailed = (): void => {
  if (!queryFailed) return;
  queryFailed = false;
  notifyListeners();
};
