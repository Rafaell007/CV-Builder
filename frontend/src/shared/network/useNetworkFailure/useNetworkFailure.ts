"use client";

import { useSyncExternalStore } from "react";
import { getNetworkFailed, subscribeToNetworkStatus } from "../store";

/** True while the browser is offline or a request failed for a network reason. False on the server. */
export function useNetworkFailure(): boolean {
  return useSyncExternalStore(subscribeToNetworkStatus, getNetworkFailed, () => false);
}
