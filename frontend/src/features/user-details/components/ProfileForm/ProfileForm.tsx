"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { TextField } from "@/shared/components";
import {
  CatalogSelect,
  useSuspenseDepartmentOptions,
  useSuspensePositionOptions,
} from "@/shared/catalogOptions";
import type { ProfileUser } from "../../user-details.types";
import { toProfileCatalog } from "../../utils";
import { useProfileForm } from "./useProfileForm";
import styles from "./ProfileForm.module.css";

export interface ProfileFormProps {
  user: ProfileUser;
  /** The owner or an Admin (`canEditProfile`). Anyone else sees the same fields read-only. */
  canEdit: boolean;
}

/**
 * The fields of the Profile tab: First Name, Last Name, Department and Position. Two per row on desktop, one column
 * below 1024px (Figma tablet). Read-only fields stay focusable (keyboard access), unlike disabled ones. The Department
 * and Position options were preloaded on the server by the page (PLAN D6), so the browser sends no request for them.
 */
export function ProfileForm({ user, canEdit }: ProfileFormProps) {
  const t = useTranslations("userDetails.profile.form");
  const { form, initialValues } = useProfileForm(user);
  const { register, control } = form;
  const { errors } = form.formState;
  const readOnly = !canEdit;
  const departments = toProfileCatalog(useSuspenseDepartmentOptions(), user.department, readOnly);
  const positions = toProfileCatalog(useSuspensePositionOptions(), user.position, readOnly);

  return (
    // Sent by UPDATE (KAN-105 step 4c). `noValidate`: the Zod rules show the errors, not the browser.
    <form className={styles.form} noValidate>
      <div className={styles.fields}>
        <TextField
          {...register("firstName")}
          defaultValue={initialValues.firstName}
          label={t("fields.firstName")}
          autoComplete="given-name"
          required={canEdit}
          readOnly={readOnly}
          error={errors.firstName?.message}
        />
        <TextField
          {...register("lastName")}
          defaultValue={initialValues.lastName}
          label={t("fields.lastName")}
          autoComplete="family-name"
          required={canEdit}
          readOnly={readOnly}
          error={errors.lastName?.message}
        />
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <CatalogSelect
              ref={field.ref}
              name={field.name}
              label={t("fields.department")}
              catalog={departments}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              readOnly={readOnly}
              error={errors.departmentId?.message}
              loadingText={t("options.loading")}
              failedText={t("options.departmentsFailed")}
              retryLabel={t("options.retry")}
            />
          )}
        />
        <Controller
          control={control}
          name="positionId"
          render={({ field }) => (
            <CatalogSelect
              ref={field.ref}
              name={field.name}
              label={t("fields.position")}
              catalog={positions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              readOnly={readOnly}
              error={errors.positionId?.message}
              loadingText={t("options.loading")}
              failedText={t("options.positionsFailed")}
              retryLabel={t("options.retry")}
            />
          )}
        />
      </div>
    </form>
  );
}
