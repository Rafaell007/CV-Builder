"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ResetPasswordDocument } from "@/shared/graphql";
import { useRouter } from "@/shared/i18n";
import { SIGN_IN_PATH } from "@/shared/session";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/utils";
import type {
  ResetPasswordErrorKey,
  ResetPasswordField,
  ResetPasswordTokenErrorKey,
  ResetPasswordValues,
} from "./reset-password.types";
import { isTokenError, toResetPasswordFailure, validateResetPassword } from "./utils";

const FIELDS: readonly ResetPasswordField[] = ["newPassword", "confirmPassword"];
const EMPTY_VALUES: ResetPasswordValues = { newPassword: "", confirmPassword: "" };

export type ResetPasswordFieldProps = {
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/**
 * State of the reset-password form. A field shows its client-side error after it was left or after a submit,
 * and the error updates while the user types. The values stay when the request fails (AC-25).
 * The backend decides if the token is good (AC-12); a bad token ends the form in `tokenError`.
 * The backend does not sign the user in, so a good reset leads to the sign-in page (AC-22).
 */
export function useResetPassword(token: string) {
  const router = useRouter();
  const t = useTranslations("resetPassword.errors");
  const [values, setValues] = useState<ResetPasswordValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<ReadonlySet<ResetPasswordField>>(new Set());
  const [failure, setFailure] = useState<ResetPasswordErrorKey | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [resetPassword, { loading }] = useMutation(ResetPasswordDocument);

  const validation = validateResetPassword(values);
  // `redirecting` keeps the form locked between the answer and the page change (AC-11).
  const pending = loading || redirecting;

  function translate(key: ResetPasswordErrorKey | undefined): string | undefined {
    return key === undefined
      ? undefined
      : t(key, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
  }

  function getFieldProps(field: ResetPasswordField): ResetPasswordFieldProps {
    return {
      value: values[field],
      error: translate(touched.has(field) ? validation[field] : undefined),
      onChange: (event) => {
        const { value } = event.target;
        setValues((current) => ({ ...current, [field]: value }));
        setFailure(null);
      },
      onBlur: () => setTouched((current) => new Set(current).add(field)),
    };
  }

  function submit() {
    if (pending) return;
    setTouched(new Set(FIELDS));
    if (Object.keys(validation).length > 0) return;

    setFailure(null);
    resetPassword({ variables: { input: { token, newPassword: values.newPassword } } }).then(
      () => {
        setRedirecting(true);
        router.push(SIGN_IN_PATH);
      },
      (error: unknown) => setFailure(toResetPasswordFailure(error)),
    );
  }

  const tokenError: ResetPasswordTokenErrorKey | undefined =
    failure !== null && isTokenError(failure) ? failure : undefined;

  return {
    getFieldProps,
    pending,
    tokenError,
    formError: failure !== null && !isTokenError(failure) ? translate(failure) : undefined,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
  };
}
