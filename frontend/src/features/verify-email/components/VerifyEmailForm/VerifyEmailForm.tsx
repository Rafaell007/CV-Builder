"use client";

import { useTranslations } from "next-intl";
import { Button, OtpField } from "@/shared/components";
import { Link } from "@/shared/i18n";
import { HOME_PATH } from "@/shared/session";
import { ResendCode } from "../ResendCode";
import styles from "./VerifyEmailForm.module.css";
import { useVerifyEmail } from "./useVerifyEmail";

export function VerifyEmailForm() {
  const t = useTranslations("verifyEmail");
  const {
    code,
    onCodeChange,
    error,
    pending,
    locked,
    hidden,
    onCodeResent,
    onAlreadyVerified,
    onSubmit,
  } = useVerifyEmail();

  if (hidden) return null;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <OtpField
        label={t("code")}
        getDigitLabel={(position, length) => t("digit", { position, length })}
        name="code"
        value={code}
        onValueChange={onCodeChange}
        error={error}
        disabled={locked}
      />
      <div className={styles.actions}>
        <Button type="submit" loading={pending} className={styles.confirm}>
          {t("confirm")}
        </Button>
        <ResendCode onSent={onCodeResent} onAlreadyVerified={onAlreadyVerified} />
        <Button asChild variant="ghost">
          <Link href={HOME_PATH}>{t("later")}</Link>
        </Button>
      </div>
    </form>
  );
}
