"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useToast } from "@/shared/components/Toast";
import { ChangePasswordDocument } from "@/shared/graphql";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/utils";
import type {
  ChangePasswordErrorKey,
  ChangePasswordField,
  ChangePasswordValues,
} from "./change-password.types";
import { toChangePasswordFailure, validateChangePassword } from "./utils";

const EMPTY_VALUES: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export type ChangePasswordFieldProps = {
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/**
 * State of the change-password form (settings, decision G). A field shows its error after it was left,
 * and the submit button stays disabled until all fields are valid. Success: toast + empty form.
 * Failure: the values stay; a wrong current password shows under that field, other errors under the form.
 */
export function useChangePassword() {
  const t = useTranslations("settings.changePassword");
  const toast = useToast();
  const [values, setValues] = useState<ChangePasswordValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<ReadonlySet<ChangePasswordField>>(new Set());
  const [failure, setFailure] = useState<ChangePasswordErrorKey | null>(null);
  const [changePassword, { loading }] = useMutation(ChangePasswordDocument);

  const validation = validateChangePassword(values);
  const isValid = Object.keys(validation).length === 0;

  function translate(key: ChangePasswordErrorKey | undefined): string | undefined {
    return key === undefined
      ? undefined
      : t(`errors.${key}`, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
  }

  function fieldError(field: ChangePasswordField): ChangePasswordErrorKey | undefined {
    if (field === "currentPassword" && failure === "currentPasswordIncorrect") return failure;
    return touched.has(field) ? validation[field] : undefined;
  }

  function getFieldProps(field: ChangePasswordField): ChangePasswordFieldProps {
    return {
      value: values[field],
      error: translate(fieldError(field)),
      onChange: (event) => {
        const { value } = event.target;
        setValues((current) => ({ ...current, [field]: value }));
        setFailure(null);
      },
      onBlur: () => setTouched((current) => new Set(current).add(field)),
    };
  }

  function submit() {
    if (loading || !isValid) return;

    setFailure(null);
    changePassword({
      variables: {
        input: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      },
    }).then(
      () => {
        setValues(EMPTY_VALUES);
        setTouched(new Set());
        toast.success({ title: t("success") });
      },
      (error: unknown) => setFailure(toChangePasswordFailure(error)),
    );
  }

  return {
    getFieldProps,
    pending: loading,
    canSubmit: isValid && !loading,
    formError:
      failure !== null && failure !== "currentPasswordIncorrect" ? translate(failure) : undefined,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
  };
}
