import type { ComponentProps } from "react";
import { Field, fieldInputClassName, useFieldIds } from "../Field";
import styles from "./Textarea.module.css";

// Normal <textarea> props (incl. `ref` for React Hook Form), minus the placeholder: the floating label takes its place.
export type TextareaProps = Omit<ComponentProps<"textarea">, "placeholder" | "children"> & {
  label: string;
  helperText?: string | undefined;
  error?: string | undefined;
};

export function Textarea({ label, id, helperText, error, className, ...props }: TextareaProps) {
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    id,
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
  });

  return (
    <Field
      label={label}
      controlId={controlId}
      helperId={helperId}
      errorId={errorId}
      helperText={helperText}
      error={error}
      multiline
      focusBorder="strong"
      className={className}
    >
      <textarea
        {...props}
        {...controlProps}
        placeholder=" "
        className={`${fieldInputClassName} ${styles.textarea}`}
      />
    </Field>
  );
}
