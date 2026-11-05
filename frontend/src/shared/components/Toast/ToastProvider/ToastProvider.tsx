"use client";

import { Toast } from "radix-ui";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastContextValue } from "../ToastContext";
import type { ToastContent, ToastEntry, ToastVariant } from "../Toast.types";
import { addToast, closeToast, removeToast } from "../utils";
import { ToastItem } from "./ToastItem";
import styles from "./ToastProvider.module.css";

export interface ToastProviderProps {
  /** Accessible name of each toast's close (×) button. Callers pass translated texts, as for every text below. */
  closeLabel: string;
  /** Read before each toast's text by screen readers, e.g. "Notification". */
  label: string;
  /** Name of the toast area; name the F8 hotkey in it, e.g. "Notifications (F8)" (Radix also replaces a literal `{hotkey}`). */
  viewportLabel: string;
  children: ReactNode;
}

/** Holds the toast list and shows it bottom-right; components show toasts with `useToast()`. */
export function ToastProvider({ closeLabel, label, viewportLabel, children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const value = useMemo<ToastContextValue>(() => {
    const show = (variant: ToastVariant) => (content: ToastContent) => {
      nextId.current += 1;
      const toast: ToastEntry = { ...content, id: String(nextId.current), variant, open: true };
      setToasts((current) => addToast(current, toast));
    };

    return {
      success: show("success"),
      error: show("error"),
      warning: show("warning"),
      info: show("info"),
    };
  }, []);

  function handleOpenChange(id: string, open: boolean) {
    if (!open) setToasts((current) => closeToast(current, id));
  }

  function handleExitComplete(id: string) {
    setToasts((current) => removeToast(current, id));
  }

  return (
    <ToastContext value={value}>
      {children}
      {/* Radix closes each toast after 5 s, paused on hover, focus and window blur.
          It is a sibling of the children, not their parent: the viewport updates the Radix provider
          after hydration, and a provider around the children makes React render the whole page twice
          while the server HTML is still streaming in (two copies of the page in the DOM for ~300 ms). */}
      <Toast.Provider label={label}>
        {toasts.map(({ id, ...toast }) => (
          <ToastItem
            key={id}
            {...toast}
            closeLabel={closeLabel}
            onOpenChange={(open) => handleOpenChange(id, open)}
            onExitComplete={() => handleExitComplete(id)}
          />
        ))}
        <Toast.Viewport label={viewportLabel} className={styles.viewport} />
      </Toast.Provider>
    </ToastContext>
  );
}
