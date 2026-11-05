import { MAX_VISIBLE_TOASTS } from "../toast.constants";
import type { ToastEntry } from "../Toast.types";

/**
 * Appends a toast (newest last). When more than `max` would be open, the oldest open ones are closed,
 * so they still animate out. Closed toasts stay until `removeToast` runs at the end of their exit animation.
 */
export function addToast(
  toasts: readonly ToastEntry[],
  toast: ToastEntry,
  max: number = MAX_VISIBLE_TOASTS,
): ToastEntry[] {
  const next = [...toasts, toast];
  let toClose = next.filter((entry) => entry.open).length - max;

  return next.map((entry) => {
    if (toClose <= 0 || !entry.open) return entry;
    toClose -= 1;
    return { ...entry, open: false };
  });
}

/** Marks a toast closed; it stays in the list until its exit animation ends. */
export function closeToast(toasts: readonly ToastEntry[], id: string): ToastEntry[] {
  return toasts.map((entry) => (entry.id === id ? { ...entry, open: false } : entry));
}

/** Drops a toast from the list, after its exit animation. */
export function removeToast(toasts: readonly ToastEntry[], id: string): ToastEntry[] {
  return toasts.filter((entry) => entry.id !== id);
}
