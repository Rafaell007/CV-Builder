"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ErrorScreen } from "@/shared/components/ErrorScreen";
import styles from "./NoInternetGate.module.css";
import { useNetworkStatus } from "./useNetworkStatus";
import { useRetryQueries } from "./useRetryQueries";

type NoInternetGateProps = {
  children: ReactNode;
};

// Offline or a failed query: the No Internet screen. The page stays mounted (hidden), so typed text
// survives and RETRY can run its queries again.
export function NoInternetGate({ children }: NoInternetGateProps) {
  const t = useTranslations("noInternet");
  const isOnline = useNetworkStatus() === "online";
  const retry = useRetryQueries();

  return (
    <>
      <div className={isOnline ? styles.page : styles.hiddenPage}>{children}</div>
      {!isOnline && (
        <ErrorScreen
          title={t("title")}
          message={
            <>
              {t("messageLine1")}
              <br />
              {t("messageLine2")}
            </>
          }
          action={{ label: t("retry"), onClick: retry }}
          announce
        />
      )}
    </>
  );
}
