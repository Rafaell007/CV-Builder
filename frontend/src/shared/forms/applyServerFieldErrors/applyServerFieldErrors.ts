import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getServerFieldErrors } from "../utils";

export type ApplyServerFieldErrorsOptions<TValues extends FieldValues> = {
  // The form fields the server checks. A server field outside this list cannot be shown inline.
  fields: readonly Path<TValues>[];
  // The translated text under the field. The server's own messages are English (class-validator),
  // so they are passed only as a hint and never shown as they are.
  getMessage: (field: Path<TValues>, serverMessages: readonly string[]) => string;
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
    (fieldError): fieldError is { field: Path<TValues>; messages: string[] } =>
      isFormField(fieldError.field),
  );
  shown.forEach(({ field, messages }, index) => {
    setError(
      field,
      { type: "server", message: getMessage(field, messages) },
      { shouldFocus: index === 0 },
    );
  });

  return fieldErrors.length > 0 && shown.length === fieldErrors.length;
}
