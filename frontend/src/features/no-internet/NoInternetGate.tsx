"use client";

import type { ReactNode } from "react";
import styles from "./NoInternetGate.module.css";
import { NoInternetScreen } from "./NoInternetScreen";
import { useNetworkStatus } from "./useNetworkStatus";
import { useRetryQueries } from "./useRetryQueries";

type NoInternetGateProps = {
  children: ReactNode;
};

// Offline or a failed query: the No Internet screen. The page stays mounted (hidden), so typed text
// survives and RETRY can run its queries again.
export function NoInternetGate({ children }: NoInternetGateProps) {
  const isOnline = useNetworkStatus() === "online";
  const retry = useRetryQueries();

  return (
    <>
      <div className={isOnline ? styles.page : styles.hiddenPage}>{children}</div>
      {!isOnline && <NoInternetScreen onRetry={retry} />}
    </>
  );
}
