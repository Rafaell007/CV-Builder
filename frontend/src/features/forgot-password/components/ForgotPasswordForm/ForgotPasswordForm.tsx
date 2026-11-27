"use client";

import { useTranslations } from "next-intl";
import { Button, TextField } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./ForgotPasswordForm.module.css";
import { useForgotPassword } from "./useForgotPassword";

export function ForgotPasswordForm() {
  const t = useTranslations("forgotPassword");
  const { emailProps, pending, sent, formError, onSubmit } = useForgotPassword();

  if (sent) {
    return (
      <div className={styles.form}>
        <p role="status" className={styles.confirmation}>
          {t("confirmation")}
        </p>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("backToSignIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.fields}>
        <TextField
          {...emailProps}
          label={t("email")}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </div>
      {formError !== undefined && (
        <p role="alert" className={styles.error}>
          {formError}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={pending} className={styles.submit}>
          {t("resetPassword")}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
