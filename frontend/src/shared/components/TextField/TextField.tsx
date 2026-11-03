import type { ComponentProps } from "react";
import { Field, useFieldIds } from "../Field";
import styles from "./TextField.module.css";

// Normal <input> props (incl. `ref`, so React Hook Form's register works), minus the placeholder:
// the floating label takes its place (Figma), and Field needs placeholder=" " to know when the field is filled.
export type TextFieldProps = Omit<ComponentProps<"input">, "placeholder" | "children"> & {
  label: string;
  helperText?: string | undefined;
  error?: string | undefined;
};

export function TextField({
  label,
  id,
  helperText,
  error,
  className,
  type = "text",
  ...props
}: TextFieldProps) {
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
      className={className}
    >
      <input {...props} {...controlProps} type={type} placeholder=" " className={styles.input} />
    </Field>
  );
}
