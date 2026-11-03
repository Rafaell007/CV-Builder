"use client";

import { useTranslations } from "next-intl";
import { Button, PasswordField, TextField } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./SignInForm.module.css";
import { useSignInForm } from "./useSignInForm";

export function SignInForm() {
  const t = useTranslations("signIn");
  const { register, onSubmit, errors, canSubmit, pending, serverError } = useSignInForm();

  return (
    // noValidate: our own messages replace the browser's bubbles.
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField
        {...register("email")}
        label={t("email")}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
      />
      <PasswordField
        {...register("password")}
        label={t("password")}
        autoComplete="current-password"
        showPasswordLabel={t("showPassword")}
        hidePasswordLabel={t("hidePassword")}
        error={errors.password?.message}
      />
      {/* Always rendered: a live region that exists before its text appears is announced reliably. */}
      <p className={styles.serverError} role="alert">
        {serverError}
      </p>
      <Button
        type="submit"
        loading={pending}
        // A loading button already ignores clicks (see Button); only an invalid form disables it.
        disabled={!canSubmit}
        className={styles.submit}
      >
        {t("submit")}
      </Button>
      <Button asChild variant="text">
        <Link href="/forgot-password">{t("forgotPassword")}</Link>
      </Button>
    </form>
  );
}
