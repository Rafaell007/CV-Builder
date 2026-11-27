"use client";

import { useTranslations } from "next-intl";
import type { FieldValues, Path } from "react-hook-form";
import type { z } from "zod";
import { useServerForm, type GeneralError } from "@/shared/forms";
import { CONCURRENT_CHANGE_REASON } from "@/shared/userProfile";
import { EMAIL_TAKEN_REASON, OWN_ROLE_REASON } from "../users.constants";

/** The message under the fields when a request failed in a way no field can show. */
export type UserFormGeneralError = GeneralError<
  "forbidden" | "ownRole" | "notFound" | "concurrentChange"
>;

export type UseUserFormOptions<TValues extends FieldValues, TSubmit extends FieldValues> = {
  /** The rules of the form, with translated messages. Build it in `useMemo`. */
  schema: z.ZodType<TSubmit, TValues>;
  defaultValues: TValues;
  /** The fields the backend validates; a `BAD_USER_INPUT` error of one of them shows under that field. */
  serverFields: readonly Path<TValues>[];
};

/**
 * The form that Create user and Update user share: the rules, and the place of a failed request. A failed request
 * keeps every typed value. A taken email (`CONFLICT`, reason `EMAIL_TAKEN`) shows under Email, `BAD_USER_INPUT` field
 * errors under their field; `FORBIDDEN` (no longer an admin), `OWN_ROLE` (D24), `NOT_FOUND` (user deleted meanwhile),
 * `CONCURRENT_CHANGE` (changed at the same time, nothing saved) and anything else become one general message
 * (`generalError`). The guard against a double submit is in `useServerForm`.
 */
export function useUserForm<TValues extends FieldValues, TSubmit extends FieldValues>({
  schema,
  defaultValues,
  serverFields,
}: UseUserFormOptions<TValues, TSubmit>) {
  const t = useTranslations("users.form");

  return useServerForm<TValues, TSubmit, Exclude<UserFormGeneralError, "failed">>(schema, {
    defaultValues,
    serverFields: { fields: serverFields, getMessage: () => t("errors.serverInvalid") },
    placeFailure: ({ kind, reason }) => {
      if (kind === "conflict" && reason === EMAIL_TAKEN_REASON) {
        // Only createUser answers EMAIL_TAKEN (Update cannot change the email), so the form has an Email field here.
        return { show: "field", field: "email" as Path<TValues>, message: t("errors.emailTaken") };
      }
      if (kind === "forbidden") return { show: "general", error: "forbidden" };
      // Only updateUser answers these two: the admin's own role (the Role field is disabled there, so only a stale
      // page gets here) and a user deleted while the modal was open.
      if (kind === "conflict" && reason === OWN_ROLE_REASON) {
        return { show: "general", error: "ownRole" };
      }
      if (kind === "notFound") return { show: "general", error: "notFound" };
      // Both mutations can answer this one: another request locked the same user. Nothing was saved, so the values stay
      // and the admin submits again.
      if (kind === "conflict" && reason === CONCURRENT_CHANGE_REASON) {
        return { show: "general", error: "concurrentChange" };
      }
      return { show: "fieldErrors", otherwise: "failed" };
    },
  });
}

export type UseUserFormResult<
  TValues extends FieldValues,
  TSubmit extends FieldValues,
> = ReturnType<typeof useUserForm<TValues, TSubmit>>;
