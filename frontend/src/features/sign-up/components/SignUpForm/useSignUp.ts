"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { MeDocument, SignUpDocument } from "@/shared/graphql";
import type { SignUpField, SignUpFailure, SignUpValues } from "./sign-up.types";
import { toSignUpFailure, validateSignUp } from "./utils";

const FIELDS: readonly SignUpField[] = ["email", "password", "confirmPassword"];
const EMPTY_VALUES: SignUpValues = { email: "", password: "", confirmPassword: "" };

// The new user is signed in but not verified yet; the code is in their mailbox.
export const VERIFY_EMAIL_PATH = "/verify-email";

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
  const [values, setValues] = useState<SignUpValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<ReadonlySet<SignUpField>>(new Set());
  const [failure, setFailure] = useState<SignUpFailure | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [signUp, { loading }] = useMutation(SignUpDocument);

  const validation = validateSignUp(values);
  // `redirecting` keeps the form locked between the answer and the page change (AC-13).
  const pending = loading || redirecting;

  function getFieldProps(field: SignUpField): SignUpFieldProps {
    const clientError = touched.has(field) ? validation[field] : undefined;
    const serverError =
      field === "email" && failure?.field === "email" ? failure.message : undefined;

    return {
      value: values[field],
      error: clientError ?? serverError,
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
    formError: failure?.field === null ? failure.message : undefined,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
  };
}
