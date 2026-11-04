import type { ToastVariant } from "./Toast.types";

/** Toasts shown at once; a new one pushes out the oldest. */
export const MAX_VISIBLE_TOASTS = 3;

/**
 * How screen readers announce a toast: foreground interrupts at once, background waits.
 * Only errors interrupt, so a success toast never cuts one off.
 */
export const ANNOUNCEMENT_BY_VARIANT = {
  success: "background",
  error: "foreground",
  warning: "background",
  info: "background",
} as const satisfies Record<ToastVariant, "foreground" | "background">;
