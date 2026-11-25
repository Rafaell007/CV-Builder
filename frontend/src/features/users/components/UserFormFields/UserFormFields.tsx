import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import {
  FormErrorMessage,
  PasswordField,
  Select,
  TextField,
  type SelectOption,
} from "@/shared/components";
import { CatalogSelect, type UseCatalogOptionsResult } from "@/shared/catalogOptions";
import type { UseUserFormResult } from "../../useUserForm";
import type { UserFormSubmit, UserFormValues } from "../../users.types";
import styles from "./UserFormFields.module.css";

/**
 * Which modal shows the fields. Create: every field can be typed in. Update: Email shows `email` and Password is
 * empty, both disabled (they cannot change here); on the admin's own row (`ownAccount`) Role is disabled too (D24).
 */
export type UserFormMode =
  { kind: "create" } | { kind: "update"; email: string; ownAccount: boolean };

export interface UserFormFieldsProps {
  /** The form of the modal (`useUserForm`): the fields, their errors and the general error. */
  userForm: Pick<UseUserFormResult<UserFormValues, UserFormSubmit>, "form" | "generalError">;
  mode: UserFormMode;
  /** The Department options (`useDepartmentOptions`). */
  departments: UseCatalogOptionsResult;
  /** The Position options (`usePositionOptions`). */
  positions: UseCatalogOptionsResult;
}

/**
 * The fields of the user form (users page, Create User and Update User modals) and its general error: Email,
 * Password, First Name, Last Name, Department, Position and Role. Two per row on desktop, one column below 1024px
 * (Figma tablet). It renders only the fields: the modal around it owns the title, the buttons and the submit. While
 * the Department or Position options load, that field is disabled; when they fail, it shows an error and a Retry
 * button.
 */
export function UserFormFields({ userForm, mode, departments, positions }: UserFormFieldsProps) {
  const t = useTranslations("users.form");
  const { form, generalError } = userForm;
  const { register, control } = form;
  const { errors } = form.formState;
  const roleLocked = mode.kind === "update" && mode.ownAccount;

  const roleOptions: SelectOption[] = [
    { value: "ADMIN", label: t("roles.ADMIN") },
    { value: "USER", label: t("roles.USER") },
  ];

  return (
    <>
      <div className={styles.fields}>
        {mode.kind === "create" ? (
          <>
            <TextField
              {...register("email")}
              type="email"
              // The admin types someone else's email: the browser must not fill in the admin's own.
              autoComplete="off"
              label={t("fields.email")}
              required
              error={errors.email?.message}
            />
            <PasswordField
              {...register("password")}
              autoComplete="new-password"
              label={t("fields.password")}
              required
              error={errors.password?.message}
              showPasswordLabel={t("showPassword")}
              hidePasswordLabel={t("hidePassword")}
            />
          </>
        ) : (
          <>
            {/* Not registered: the form never sends them, and a disabled input has no value in a form anyway. */}
            <TextField type="email" label={t("fields.email")} value={mode.email} disabled />
            <PasswordField
              label={t("fields.password")}
              value=""
              disabled
              showPasswordLabel={t("showPassword")}
              hidePasswordLabel={t("hidePassword")}
            />
          </>
        )}
        <TextField
          {...register("firstName")}
          label={t("fields.firstName")}
          required
          error={errors.firstName?.message}
        />
        <TextField
          {...register("lastName")}
          label={t("fields.lastName")}
          required
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
              error={errors.positionId?.message}
              loadingText={t("options.loading")}
              failedText={t("options.positionsFailed")}
              retryLabel={t("options.retry")}
            />
          )}
        />
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select
              ref={field.ref}
              name={field.name}
              label={t("fields.role")}
              options={roleOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              required
              disabled={roleLocked}
              // A disabled field says why (accessibility; not in Figma): D24, an admin keeps their own role.
              helperText={roleLocked ? t("ownRoleLocked") : undefined}
              error={errors.role?.message}
            />
          )}
        />
      </div>
      {generalError && <FormErrorMessage>{t(`errors.${generalError}`)}</FormErrorMessage>}
    </>
  );
}
