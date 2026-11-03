"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ForgotPasswordDocument } from "@/shared/graphql";
import { emailProblem } from "@/shared/utils";
import type { ForgotPasswordErrorKey } from "./forgot-password.types";
import { toForgotPasswordFailure } from "./utils";

export type ForgotPasswordFieldProps = {
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/**
 * State of the forgot-password form. The email shows its client-side error after it was left or after a submit,
 * and the value stays when the request fails (AC-19). `sent` turns true after the backend answered: it answers
 * the same for known and unknown emails (AC-16), so the page never says whether the account exists.
 */
export function useForgotPassword() {
  const t = useTranslations("forgotPassword.errors");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [failure, setFailure] = useState<ForgotPasswordErrorKey | null>(null);
  const [sent, setSent] = useState(false);
  const [forgotPassword, { loading }] = useMutation(ForgotPasswordDocument);

  const problem = emailProblem(email);

  function submit() {
    if (loading) return;
    setTouched(true);
    if (problem !== undefined) return;

    setFailure(null);
    forgotPassword({ variables: { input: { email: email.trim() } } }).then(
      () => setSent(true),
      (error: unknown) => setFailure(toForgotPasswordFailure(error)),
    );
  }

  const emailProps: ForgotPasswordFieldProps = {
    value: email,
    error: touched && problem !== undefined ? t(problem) : undefined,
    onChange: (event) => {
      setEmail(event.target.value);
      setFailure(null);
    },
    onBlur: () => setTouched(true),
  };

  return {
    emailProps,
    pending: loading,
    sent,
    formError: failure === null ? undefined : t(failure),
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
  };
}
