"use client";

import { useRef, useState, type BaseSyntheticEvent } from "react";
import type { DefaultValues, FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import { readFailure, type Failure } from "@/shared/failures";
import {
  applyServerFieldErrors,
  type ApplyServerFieldErrorsOptions,
} from "../applyServerFieldErrors";
import { useZodForm } from "../useZodForm";

/** The general message of a form: `failed` for every form, plus the form's own keys (`TExtra`). */
export type GeneralError<TExtra extends string = never> = "failed" | TExtra;

/**
 * Where one failed request shows. The form decides it from the parsed `Failure`; `useServerForm` does it.
 * - `field`: one known field is to blame (for example a taken name). The text shows under it and it gets the focus.
 * - `general`: only the general error. The server field errors are not applied.
 * - `fieldErrors`: the `BAD_USER_INPUT` field errors go under their fields. If one of them has no field in the form,
 *   or there is none (a network error), `otherwise` shows as the general error.
 * There is no "show nothing" case: a failed request always leaves a field error or a general error.
 */
export type FailurePlacement<TValues extends FieldValues, TExtra extends string = never> =
  | { show: "field"; field: Path<TValues>; message: string }
  | { show: "general"; error: GeneralError<TExtra> }
  | { show: "fieldErrors"; otherwise: GeneralError<TExtra> };

export type UseServerFormOptions<TValues extends FieldValues, TExtra extends string = never> = {
  /** The first values. They are the "unchanged" state until `reset`. */
  defaultValues: TValues;
  /** The fields the backend validates, and the translated text under each. */
  serverFields: ApplyServerFieldErrorsOptions<TValues>;
  /**
   * Pure: where a failed request shows, from the result of `readFailure`. Without it every failure is `fieldErrors`
   * with `failed` as the general error, and `readFailure` is not called.
   */
  placeFailure?: (failure: Failure) => FailurePlacement<TValues, TExtra>;
};

/**
 * Shows a failed request where the form says and returns the general error to set (`null` for none). The only side
 * effect is `setError`, so a test can run it without React.
 */
export function placeServerError<TValues extends FieldValues, TExtra extends string = never>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  {
    serverFields,
    placeFailure,
  }: Pick<UseServerFormOptions<TValues, TExtra>, "serverFields" | "placeFailure">,
): GeneralError<TExtra> | null {
  const placement: FailurePlacement<TValues, TExtra> = placeFailure
    ? placeFailure(readFailure(error))
    : { show: "fieldErrors", otherwise: "failed" };

  switch (placement.show) {
    case "field":
      setError(
        placement.field,
        { type: "server", message: placement.message },
        { shouldFocus: true },
      );
      return null;
    case "general":
      return placement.error;
    case "fieldErrors":
      return applyServerFieldErrors(error, setError, serverFields) ? null : placement.otherwise;
  }
}

/**
 * A Zod form that sends to the server: the form (`useZodForm`), the guard against a double submit, the one general
 * error, and the placement of a failed request. A failed request keeps every typed value. The form's hook gives the
 * rules, the server fields and, when some failures have their own place, `placeFailure`.
 * `TValues` is what the fields hold, `TSubmit` what the schema makes of them (`send` gets this), `TExtra` the form's
 * own general errors besides `failed`.
 */
export function useServerForm<
  TValues extends FieldValues,
  TSubmit extends FieldValues,
  TExtra extends string = never,
>(schema: z.ZodType<TSubmit, TValues>, options: UseServerFormOptions<TValues, TExtra>) {
  const [generalError, setGeneralError] = useState<GeneralError<TExtra> | null>(null);

  // A ref changes at once: two submits in the same tick cannot both pass (duplicate submissions are prevented).
  const sending = useRef(false);

  const form = useZodForm<TValues, TSubmit>(schema, {
    defaultValues: options.defaultValues as DefaultValues<TValues>,
  });

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: TValues) {
    form.reset(values);
    setGeneralError(null);
  }

  /** Shows a failed request where `placeFailure` says. */
  function showError(error: unknown) {
    setGeneralError(placeServerError(error, form.setError, options));
  }

  /**
   * Validates, then calls `send` with the checked values. A second submit during the request is ignored. The general
   * error clears only after validation passed. An error that `send` throws goes to `showError`, so `send` needs no
   * `try/catch` of its own. A form that submits without a DOM event passes `undefined`.
   */
  async function submit(
    event: BaseSyntheticEvent | undefined,
    send: (values: TSubmit) => Promise<void>,
  ) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(async (values) => {
        setGeneralError(null);
        try {
          await send(values);
        } catch (error) {
          showError(error);
        }
      })(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, generalError, reset, showError, submit };
}
