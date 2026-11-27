"use client";

import { useSyncExternalStore } from "react";
import { PREFERENCES_SCRIPT } from "./preferencesScript.constants";

const subscribe = () => () => {};
const isServerRender = () => true;
const isClientRender = () => false;

// The script is only needed in the server HTML: it runs before the first paint. React 19 warns when the client
// creates a <script> (a language change swaps the root layout), so after hydration it renders nothing.
// Hydration still sees the server snapshot (true), so the server's tag is reused and nothing mismatches.
export function PreferencesScript() {
  const isServerHtml = useSyncExternalStore(subscribe, isClientRender, isServerRender);
  if (!isServerHtml) return null;
  return (
    <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} suppressHydrationWarning />
  );
}
