"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Button, PasswordField } from "@/shared/components";
import styles from "./ChangePasswordForm.module.css";
import { useChangePassword } from "./useChangePassword";

export function ChangePasswordForm() {
  const t = useTranslations("settings.changePassword");
  const { getFieldProps, pending, canSubmit, formError, onSubmit } = useChangePassword();
  const titleId = useId();

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {t("title")}
      </h2>
      <form className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby={titleId}>
        <PasswordField
          {...getFieldProps("currentPassword")}
          label={t("currentPassword")}
          name="currentPassword"
          autoComplete="current-password"
          required
          showPasswordLabel={t("showCurrentPassword")}
          hidePasswordLabel={t("hideCurrentPassword")}
        />
        <PasswordField
          {...getFieldProps("newPassword")}
          label={t("newPassword")}
          name="newPassword"
          autoComplete="new-password"
          required
          showPasswordLabel={t("showNewPassword")}
          hidePasswordLabel={t("hideNewPassword")}
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
        {formError !== undefined && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="submit" loading={pending} disabled={!canSubmit}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
