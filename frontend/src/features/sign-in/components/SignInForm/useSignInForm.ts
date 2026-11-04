"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { SignInValues } from "./sign-in.types";
import { useSignIn } from "./useSignIn";
import { createSignInSchema } from "./utils";

/** The sign-in form: values, inline validation and the request. The component only renders it. */
export function useSignInForm() {
  const t = useTranslations("signIn.errors");
  const { signIn, pending, errorKind } = useSignIn();

  const schema = useMemo(
    () =>
      createSignInSchema({
        emailRequired: t("emailRequired"),
        emailInvalid: t("emailInvalid"),
        passwordRequired: t("passwordRequired"),
        passwordTooShort: t("passwordTooShort"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    // Errors appear once a field has been left; `isValid` still follows every keystroke, for the button.
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // The values stay in the form after a failed request: nothing resets them.
  const onSubmit = handleSubmit(signIn);

  return {
    register,
    onSubmit,
    errors,
    canSubmit: isValid,
    pending,
    // Translated here, so the component only shows a string.
    serverError: errorKind ? t(errorKind) : null,
  };
}
