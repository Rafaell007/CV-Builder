"use client";

import { useState, useSyncExternalStore } from "react";

// Keep in sync with the media query in AppShell.module.css.
export const NARROW_SCREEN_QUERY = "(max-width: 1023.98px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(NARROW_SCREEN_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isNarrowScreen = (): boolean => window.matchMedia(NARROW_SCREEN_QUERY).matches;
// The server does not know the width; CSS collapses the sidebar until React takes over.
const isNarrowOnServer = (): boolean => false;

export type UseSidebarCollapsedResult = {
  collapsed: boolean;
  /** The user's last click, or null while the screen width decides. */
  userChoice: boolean | null;
  toggle: () => void;
};

/**
 * Collapsed below 1024px, expanded from 1024px, until the user clicks the collapse button.
 * The click wins until the page reloads; it is not saved (docs/design-tokens.md › Predictions for KAN-82).
 */
export function useSidebarCollapsed(): UseSidebarCollapsedResult {
  const isNarrow = useSyncExternalStore(subscribe, isNarrowScreen, isNarrowOnServer);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const collapsed = userChoice ?? isNarrow;

  return { collapsed, userChoice, toggle: () => setUserChoice(!collapsed) };
}
