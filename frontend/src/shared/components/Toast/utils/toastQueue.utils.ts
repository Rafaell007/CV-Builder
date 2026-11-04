import { MAX_VISIBLE_TOASTS } from "../toast.constants";
import type { ToastEntry } from "../Toast.types";

/**
 * Appends a toast (newest last). Toasts that already finished closing are dropped, and when more
 * than `max` would be open, the oldest open ones are closed so they can still animate out.
 */
export function addToast(
  toasts: readonly ToastEntry[],
  toast: ToastEntry,
  max: number = MAX_VISIBLE_TOASTS,
): ToastEntry[] {
  const next = [...toasts.filter((entry) => entry.open), toast];
  const toClose = next.length - max;

  return next.map((entry, index) => (index < toClose ? { ...entry, open: false } : entry));
}

/** Marks a toast closed; it stays in the list until its exit animation ends. */
export function closeToast(toasts: readonly ToastEntry[], id: string): ToastEntry[] {
  return toasts.map((entry) => (entry.id === id ? { ...entry, open: false } : entry));
}

/** Drops a toast from the list, after its exit animation. */
export function removeToast(toasts: readonly ToastEntry[], id: string): ToastEntry[] {
  return toasts.filter((entry) => entry.id !== id);
}
