"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { Button, FormErrorMessage, TextField } from "@/shared/components";
import {
  CatalogSelect,
  useSuspenseDepartmentOptions,
  useSuspensePositionOptions,
} from "@/shared/catalogOptions";
import type { ProfileUser } from "../../user-details.types";
import { useVerifyEmailRequest } from "../../useVerifyEmailRequest";
import { toProfileCatalog } from "../../utils";
import { useProfileForm } from "./useProfileForm";
import styles from "./ProfileForm.module.css";

export interface ProfileFormProps {
  user: ProfileUser;
  /** The owner or an Admin (`canEditProfile`). Anyone else sees the same fields read-only. */
  canEdit: boolean;
  /** The owner, email not verified yet (`canVerifyEmail`): VERIFY EMAIL shows left of UPDATE. */
  canVerifyEmail?: boolean;
}

/**
 * The fields of the Profile tab: First Name, Last Name, Department and Position. Two per row on desktop, one column
 * below 1024px (Figma tablet). Read-only fields stay focusable (keyboard access), unlike disabled ones. The Department
 * and Position options were preloaded on the server by the page (PLAN D6), so the browser sends no request for them.
 */
export function ProfileForm({ user, canEdit, canVerifyEmail = false }: ProfileFormProps) {
  const t = useTranslations("userDetails.profile.form");
  const tVerify = useTranslations("userDetails.profile.verifyEmail");
  const verifyEmail = useVerifyEmailRequest();
  const { form, initialValues, hasChanged, pending, generalError, submit } = useProfileForm(user);
  const { register, control } = form;
  const { errors } = form.formState;
  const readOnly = !canEdit;
  const departments = toProfileCatalog(useSuspenseDepartmentOptions(), user.department, readOnly);
  const positions = toProfileCatalog(useSuspensePositionOptions(), user.position, readOnly);

  return (
    // `noValidate`: the Zod rules show the errors, not the browser.
    <form className={styles.form} noValidate onSubmit={submit}>
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
      {/* No UPDATE on another employee's profile (ticket: read-only, no button). */}
      {canEdit && (
        <>
          {generalError && (
            <div className={styles.generalError}>
              <FormErrorMessage>{t(`errors.${generalError}`)}</FormErrorMessage>
            </div>
          )}
          <div className={styles.actions}>
            {/* `type="button"`: it mails a code, it does not save the form. */}
            {canVerifyEmail && (
              <Button
                type="button"
                variant="secondary"
                loading={verifyEmail.pending}
                onClick={verifyEmail.request}
              >
                {tVerify("button")}
              </Button>
            )}
            {/* Disabled until a value really changes (spaces around a name do not count). */}
            <Button type="submit" disabled={!hasChanged} loading={pending}>
              {t("update")}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
