"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { NoInternetState } from "@/shared/components";
import { useNetworkFailure } from "@/shared/network";
import styles from "./NoInternetGate.module.css";

function reloadPage() {
  window.location.reload();
}

/** Shows the No Internet screen over the page while the app cannot reach the server. */
export function NoInternetGate({ children }: { children: ReactNode }) {
  const t = useTranslations("noInternet");
  const failed = useNetworkFailure();

  return (
    <>
      {/* `inert`: the page below cannot be reached with the keyboard or a screen reader. */}
      <div className={styles.page} inert={failed}>
        {children}
      </div>
      {failed && (
        <div className={styles.overlay}>
          <NoInternetState
            title={t("title")}
            message={
              <>
                {t("messageLine1")}
                <br />
                {t("messageLine2")}
              </>
            }
            retryLabel={t("retry")}
            onRetry={reloadPage}
          />
        </div>
      )}
    </>
  );
}
