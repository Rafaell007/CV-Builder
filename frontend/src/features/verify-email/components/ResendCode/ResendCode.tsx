"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import styles from "./ResendCode.module.css";
import { useResendCode, type UseResendCodeOptions } from "./useResendCode";

export type ResendCodeProps = UseResendCodeOptions;

export function ResendCode(props: ResendCodeProps) {
  const t = useTranslations("verifyEmail.resend");
  const { send, loading, secondsLeft, message } = useResendCode(props);
  const waiting = secondsLeft > 0;

  return (
    <div className={styles.resend}>
      <Button variant="ghost" loading={loading} disabled={waiting} onClick={send}>
        {waiting ? t("wait", { seconds: secondsLeft }) : t("button")}
      </Button>
      {message !== null && (
        <p role={message === "sent" ? "status" : "alert"} className={styles[message]}>
          {t(message)}
        </p>
      )}
    </div>
  );
}
