"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useTranslations } from "next-intl";
import { useRef, useState, type BaseSyntheticEvent } from "react";
import type { DefaultValues, FieldValues, Path } from "react-hook-form";
import type { z } from "zod";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import { CONCURRENT_CHANGE_REASON, EMAIL_TAKEN_REASON, OWN_ROLE_REASON } from "../users.constants";

/** The message under the fields when a request failed in a way no field can show. */
export type UserFormGeneralError =
  "failed" | "forbidden" | "ownRole" | "notFound" | "concurrentChange";

export type UseUserFormOptions<TValues extends FieldValues, TSubmit extends FieldValues> = {
  /** The rules of the form, with translated messages. Build it in `useMemo`. */
  schema: z.ZodType<TSubmit, TValues>;
  defaultValues: TValues;
  /** The fields the backend validates; a `BAD_USER_INPUT` error of one of them shows under that field. */
  serverFields: readonly Path<TValues>[];
};

/**
 * The form that Create user and Update user share: the rules, the guard against a double submit and the mapping of a
 * failed request. A failed request keeps every typed value. A taken email (`CONFLICT`, reason `EMAIL_TAKEN`) shows
 * under Email, `BAD_USER_INPUT` field errors under their field; `FORBIDDEN` (no longer an admin), `OWN_ROLE` (D24),
 * `NOT_FOUND` (user deleted meanwhile), `CONCURRENT_CHANGE` (changed at the same time, nothing saved) and anything else
 * become one general message (`generalError`).
 */
export function useUserForm<TValues extends FieldValues, TSubmit extends FieldValues>({
  schema,
  defaultValues,
  serverFields,
}: UseUserFormOptions<TValues, TSubmit>) {
  const t = useTranslations("users.form");
  const [generalError, setGeneralError] = useState<UserFormGeneralError | null>(null);

  // A ref changes at once: two submits in the same tick cannot both pass (duplicate submissions are prevented).
  const sending = useRef(false);

  const form = useZodForm<TValues, TSubmit>(schema, {
    defaultValues: defaultValues as DefaultValues<TValues>,
  });

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: TValues) {
    form.reset(values);
    setGeneralError(null);
  }

  /** Shows a failed request: under a field when one field is to blame, otherwise as the general message. */
  function showError(error: unknown) {
    const code = errorExtension(error, "code");
    if (code === "CONFLICT" && errorExtension(error, "reason") === EMAIL_TAKEN_REASON) {
      // Only createUser answers EMAIL_TAKEN (Update cannot change the email), so the form has an Email field here.
      form.setError(
        "email" as Path<TValues>,
        { type: "server", message: t("errors.emailTaken") },
        { shouldFocus: true },
      );
      setGeneralError(null);
      return;
    }
    if (code === "FORBIDDEN") {
      setGeneralError("forbidden");
      return;
    }
    // Only updateUser answers these two: the admin's own role (the Role field is disabled there, so only a stale
    // page gets here) and a user deleted while the modal was open.
    if (code === "CONFLICT" && errorExtension(error, "reason") === OWN_ROLE_REASON) {
      setGeneralError("ownRole");
      return;
    }
    if (code === "NOT_FOUND") {
      setGeneralError("notFound");
      return;
    }
    // Both mutations can answer this one: another request locked the same user. Nothing was saved, so the values stay
    // and the admin submits again.
    if (code === "CONFLICT" && errorExtension(error, "reason") === CONCURRENT_CHANGE_REASON) {
      setGeneralError("concurrentChange");
      return;
    }
    const allShown = applyServerFieldErrors(error, form.setError, {
      fields: serverFields,
      getMessage: () => t("errors.serverInvalid"),
    });
    setGeneralError(allShown ? null : "failed");
  }

  /**
   * Validates, then calls `send` with the checked values. A second submit during the request is ignored. `send` must
   * not throw; it calls `showError`.
   */
  async function submit(event: BaseSyntheticEvent, send: (values: TSubmit) => Promise<void>) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(async (values) => {
        setGeneralError(null);
        await send(values);
      })(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, generalError, reset, showError, submit };
}

export type UseUserFormResult<
  TValues extends FieldValues,
  TSubmit extends FieldValues,
> = ReturnType<typeof useUserForm<TValues, TSubmit>>;

/** One `extensions` value of the first GraphQL error, or undefined for any other error (no network). */
function errorExtension(error: unknown, key: string): unknown {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  return error.errors[0]?.extensions?.[key];
}
