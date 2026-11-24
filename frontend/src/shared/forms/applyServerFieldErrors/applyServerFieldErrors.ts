import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ServerFieldError } from "../forms.types";
import { getServerFieldErrors } from "../utils";

export type ApplyServerFieldErrorsOptions<TValues extends FieldValues> = {
  // The form fields the server checks. A server field outside this list cannot be shown inline.
  fields: readonly Path<TValues>[];
  // The translated text under the field. The server's own messages are English (class-validator),
  // so they are never shown as they are. `reasons` holds the stable codes the server sent for the field,
  // and is empty when the rule has none.
  getMessage: (field: Path<TValues>, reasons: readonly string[]) => string;
};

/**
 * Shows the BAD_USER_INPUT field errors of a failed request under the form's fields (PLAN D7) and
 * focuses the first one. The error clears when the user changes the field, like a client-side error.
 * Returns true when every field error found its field. False (any other error, or a field the form
 * does not have) means the form shows a general error as well.
 */
export function applyServerFieldErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  { fields, getMessage }: ApplyServerFieldErrorsOptions<TValues>,
): boolean {
  const fieldErrors = getServerFieldErrors(error);
  const isFormField = (field: string): field is Path<TValues> =>
    (fields as readonly string[]).includes(field);

  const shown = fieldErrors.filter(
    (fieldError): fieldError is ServerFieldError & { field: Path<TValues> } =>
      isFormField(fieldError.field),
  );
  shown.forEach(({ field, reasons = [] }, index) => {
    setError(
      field,
      { type: "server", message: getMessage(field, reasons) },
      { shouldFocus: index === 0 },
    );
  });

  return fieldErrors.length > 0 && shown.length === fieldErrors.length;
}
