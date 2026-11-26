"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { readFailure } from "@/shared/failures";
import { MeDocument, SignUpDocument } from "@/shared/graphql";
import { useRouter } from "@/shared/i18n";
import { VERIFY_EMAIL_PATH } from "@/shared/session";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/utils";
import type { SignUpErrorKey, SignUpField, SignUpFailure, SignUpValues } from "./sign-up.types";
import { EMAIL_TAKEN_REASON, validateSignUp } from "./utils";

const FIELDS: readonly SignUpField[] = ["email", "password", "confirmPassword"];
const EMPTY_VALUES: SignUpValues = { email: "", password: "", confirmPassword: "" };

// Turns the failure of the signUp mutation into the message key the user sees. The password is never part of it.
function toSignUpFailure(error: unknown): SignUpFailure {
  const { kind, reason } = readFailure(error);
  if (kind === "conflict" && reason === EMAIL_TAKEN_REASON) {
    return { field: "email", errorKey: "emailTaken" };
  }
  if (kind === "tooManyRequests") return { field: null, errorKey: "tooManyRequests" };
  if (kind === "invalid") return { field: null, errorKey: "invalidInput" };
  // Includes a CONFLICT with another reason: the user cannot fix it by changing the email.
  return { field: null, errorKey: "unexpected" };
}

export type SignUpFieldProps = {
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/**
 * State of the sign-up form. A field shows its client-side error after it was left or after a submit,
 * and the error updates while the user types. The values stay when the request fails (AC-24).
 */
export function useSignUp() {
  const router = useRouter();
  const t = useTranslations("signUp.errors");
  const [values, setValues] = useState<SignUpValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<ReadonlySet<SignUpField>>(new Set());
  const [failure, setFailure] = useState<SignUpFailure | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [signUp, { loading }] = useMutation(SignUpDocument);

  const validation = validateSignUp(values);
  // `redirecting` keeps the form locked between the answer and the page change (AC-13).
  const pending = loading || redirecting;

  function translate(key: SignUpErrorKey | undefined): string | undefined {
    return key === undefined
      ? undefined
      : t(key, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
  }

  function getFieldProps(field: SignUpField): SignUpFieldProps {
    const clientError = touched.has(field) ? validation[field] : undefined;
    const serverError =
      field === "email" && failure?.field === "email" ? failure.errorKey : undefined;

    return {
      value: values[field],
      error: translate(clientError ?? serverError),
      onChange: (event) => {
        const { value } = event.target;
        setValues((current) => ({ ...current, [field]: value }));
        setFailure(null);
      },
      onBlur: () => setTouched((current) => new Set(current).add(field)),
    };
  }

  async function submit() {
    if (pending) return;
    setTouched(new Set(FIELDS));
    if (Object.keys(validation).length > 0) return;

    setFailure(null);
    try {
      await signUp({
        variables: { input: { email: values.email.trim(), password: values.password } },
        // The user is signed in now, so `me` must not keep answering "nobody" (it is cached from before).
        update: (cache, { data }) => {
          if (data) cache.writeQuery({ query: MeDocument, data: { me: data.signUp } });
        },
      });
    } catch (error) {
      setFailure(toSignUpFailure(error));
      return;
    }
    setRedirecting(true);
    router.push(VERIFY_EMAIL_PATH);
  }

  return {
    getFieldProps,
    pending,
    formError: failure?.field === null ? translate(failure.errorKey) : undefined,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
  };
}
