"use client";

import { useTranslations } from "next-intl";
import { Button, PasswordField } from "@/shared/components";
import { useChangePassword } from "./useChangePassword";

export function ChangePasswordForm() {
  const t = useTranslations("settings.changePassword");
  const { getFieldProps, pending, canSubmit, formError, onSubmit } = useChangePassword();

  return (
    <form onSubmit={onSubmit} noValidate>
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
      {formError !== undefined && <p role="alert">{formError}</p>}
      <Button type="submit" loading={pending} disabled={!canSubmit}>
        {t("submit")}
      </Button>
    </form>
  );
}
