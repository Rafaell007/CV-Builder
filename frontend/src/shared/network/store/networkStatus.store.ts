type Listener = () => void;

const listeners = new Set<Listener>();
let browserOffline = false;
let requestFailed = false;
let failed = false;

function update(): void {
  const next = browserOffline || requestFailed;
  if (next === failed) return;
  failed = next;
  listeners.forEach((listener) => listener());
}

function handleOffline(): void {
  browserOffline = true;
  update();
}

function handleOnline(): void {
  browserOffline = false;
  update();
}

/** True when the browser reports no connection, or a request failed for a network reason. */
export function getNetworkFailed(): boolean {
  return failed;
}

/** A request failed before the server answered. Stays until the page is reloaded. Never runs on the server. */
export function reportRequestFailure(): void {
  // The server module is shared by all requests: a failure there must not show on another user's page.
  if (typeof window === "undefined") return;
  requestFailed = true;
  update();
}

/** For `useSyncExternalStore`. Listens to the browser only while someone subscribes. */
export function subscribeToNetworkStatus(listener: Listener): () => void {
  if (listeners.size === 0) {
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    browserOffline = !navigator.onLine;
    update();
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    }
  };
}

/** Back to "no failure": for tests. */
export function resetNetworkStatus(): void {
  browserOffline = false;
  requestFailed = false;
  failed = false;
}
