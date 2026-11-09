import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SadMonitorIllustration } from "@/shared/components/illustrations";
import styles from "./DeviceErrorGate.module.css";

type DeviceErrorGateProps = {
  children: ReactNode;
};

// Shows the page from 768px up and the device error below it. CSS swaps them, so no JS runs.
export function DeviceErrorGate({ children }: DeviceErrorGateProps) {
  const t = useTranslations("deviceError");

  return (
    <>
      <div className={styles.page}>{children}</div>
      <div className={styles.gate}>
        <div className={styles.content}>
          <SadMonitorIllustration />
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.message}>
            {t("messageLine1")}
            <br />
            {t("messageLine2")}
          </p>
        </div>
      </div>
    </>
  );
}
