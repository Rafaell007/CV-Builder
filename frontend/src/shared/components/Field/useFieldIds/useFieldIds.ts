import { useId } from "react";

export type UseFieldIdsOptions = {
  // A fixed id from the caller (e.g. for E2E selectors); otherwise React generates a unique one.
  id?: string | undefined;
  hasHelperText: boolean;
  hasError: boolean;
};

// Ids that wire a field together for screen readers: <label for>, the control, and the text below it.
export function useFieldIds({ id, hasHelperText, hasError }: UseFieldIdsOptions) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const helperId = `${controlId}-helper`;
  const errorId = `${controlId}-error`;

  // Field shows the error instead of the helper text, so the control points to whichever is visible.
  const describedById = hasError ? errorId : hasHelperText ? helperId : undefined;

  return {
    controlId,
    helperId,
    errorId,
    // Spread onto the <input> / <textarea>.
    controlProps: {
      id: controlId,
      "aria-invalid": hasError || undefined,
      "aria-describedby": describedById,
    },
  };
}
