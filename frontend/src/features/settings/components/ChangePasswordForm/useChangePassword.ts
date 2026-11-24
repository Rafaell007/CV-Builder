"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useToast } from "@/shared/components/Toast";
import { readFailure } from "@/shared/failures";
import { ChangePasswordDocument } from "@/shared/graphql";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/utils";
import type {
  ChangePasswordErrorKey,
  ChangePasswordField,
  ChangePasswordValues,
} from "./change-password.types";
import { FIELD_FAILURES, validateChangePassword } from "./utils";

const EMPTY_VALUES: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// `extensions.reason` of the backend's BAD_USER_INPUT (backend auth README) → the field it belongs to.
const REASONS: Record<string, ChangePasswordErrorKey> = {
  CURRENT_PASSWORD_INCORRECT: "currentPasswordIncorrect",
  NEW_PASSWORD_SAME: "newPasswordSame",
};

// Turns the failure of the changePassword mutation into the message key the user sees. The passwords are never part of it.
function toChangePasswordFailure(error: unknown): ChangePasswordErrorKey {
  const { kind, reason } = readFailure(error);
  if (kind === "invalid") {
    return (reason === undefined ? undefined : REASONS[reason]) ?? "invalidInput";
  }
  return kind === "tooManyRequests" ? "tooManyRequests" : "unexpected";
}

export type ChangePasswordFieldProps = {
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/**
 * State of the change-password form (settings, decision G). A field shows its error after it was left,
 * and the submit button stays disabled until all fields are valid. Success: toast + empty form.
 * Failure: the values stay; a wrong current password or a reused one shows under its field, other errors under the form.
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

  // The field a server failure belongs to, or undefined when it is shown under the form.
  const failureField = failure === null ? undefined : FIELD_FAILURES[failure];

  function fieldError(field: ChangePasswordField): ChangePasswordErrorKey | undefined {
    if (failure !== null && failureField === field) return failure;
    return touched.has(field) ? validation[field] : undefined;
  }

  function getFieldProps(field: ChangePasswordField): ChangePasswordFieldProps {
    return {
      value: values[field],
      error: translate(fieldError(field)),
      onChange: (event) => {
        const { value } = event.target;
        setValues((current) => ({ ...current, [field]: value }));
        // A field's server error stays until that field changes (the current password is still wrong
        // while the user edits the new one); an error under the form goes on any change.
        if (failureField === undefined || failureField === field) setFailure(null);
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
    // Only validity: while `pending` the Button blocks clicks itself and keeps the focus (aria-disabled, not disabled).
    canSubmit: isValid,
    formError: failure !== null && failureField === undefined ? translate(failure) : undefined,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
  };
}
