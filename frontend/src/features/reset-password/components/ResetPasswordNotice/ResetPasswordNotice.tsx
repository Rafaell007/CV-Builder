"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./ResetPasswordNotice.module.css";

export type ResetPasswordNoticeProps = {
  message: string;
};

// Replaces the form when the link in the mail cannot be used: a way to ask for a new one, or to sign in.
export function ResetPasswordNotice({ message }: ResetPasswordNoticeProps) {
  const t = useTranslations("resetPassword");

  return (
    <div className={styles.notice}>
      <p role="alert" className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        <Button asChild>
          <Link href="/forgot-password">{t("requestNewLink")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("goToSignIn")}</Link>
        </Button>
      </div>
    </div>
  );
}
