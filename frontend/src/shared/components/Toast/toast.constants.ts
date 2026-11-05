import type { ToastVariant } from "./Toast.types";

/** Toasts shown at once; a new one pushes out the oldest. */
export const MAX_VISIBLE_TOASTS = 3;

/**
 * How long a toast stays open, in ms. Errors stay until the user closes them (WCAG 2.2.1, timing adjustable):
 * the user has to read them and often act. The others close after Radix's default 5 s.
 */
export const DURATION_BY_VARIANT = {
  success: 5000,
  error: Infinity,
  warning: 5000,
  info: 5000,
} as const satisfies Record<ToastVariant, number>;

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
