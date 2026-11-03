"use client";

import { useTranslations } from "next-intl";
import { Button, PasswordField } from "@/shared/components";
import { Link } from "@/shared/i18n";
import { ResetPasswordNotice } from "../ResetPasswordNotice";
import styles from "./ResetPasswordForm.module.css";
import { useResetPassword } from "./useResetPassword";

export type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("resetPassword");
  const { getFieldProps, pending, done, tokenError, formError, onSubmit } = useResetPassword(token);

  if (done) return <ResetPasswordNotice tone="success" message={t("success")} />;
  if (tokenError !== undefined) {
    return <ResetPasswordNotice tone="error" message={t(`errors.${tokenError}`)} offerNewLink />;
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.fields}>
        <PasswordField
          {...getFieldProps("newPassword")}
          label={t("newPassword")}
          name="newPassword"
          autoComplete="new-password"
          required
          showPasswordLabel={t("showPassword")}
          hidePasswordLabel={t("hidePassword")}
        />
        <PasswordField
          {...getFieldProps("confirmPassword")}
          label={t("confirmPassword")}
          name="confirmPassword"
          autoComplete="new-password"
          required
          showPasswordLabel={t("showConfirmPassword")}
          hidePasswordLabel={t("hideConfirmPassword")}
        />
      </div>
      {formError !== undefined && (
        <p role="alert" className={styles.error}>
          {formError}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={pending} className={styles.submit}>
          {t("submit")}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("goToSignIn")}</Link>
        </Button>
      </div>
    </form>
  );
}
