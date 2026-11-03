"use client";

import { useTranslations } from "next-intl";
import { Button, PasswordField, TextField } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./SignUpForm.module.css";
import { useSignUp } from "./useSignUp";

export function SignUpForm() {
  const t = useTranslations("signUp");
  const { getFieldProps, pending, formError, onSubmit } = useSignUp();

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.fields}>
        <TextField
          {...getFieldProps("email")}
          label={t("email")}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        <PasswordField
          {...getFieldProps("password")}
          label={t("password")}
          name="password"
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
          {t("createAccount")}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sign-in">{t("haveAccount")}</Link>
        </Button>
      </div>
    </form>
  );
}
