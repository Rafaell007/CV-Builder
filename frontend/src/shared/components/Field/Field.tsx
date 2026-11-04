import { Label } from "radix-ui";
import type { ReactNode } from "react";
import styles from "./Field.module.css";

export type FieldProps = {
  label: string;
  // From useFieldIds: the label points to the control, and the control's aria-describedby to the text below.
  controlId: string;
  // For a control that is not a labelable element (a div combobox): it points to the label with aria-labelledby.
  labelId?: string | undefined;
  helperId: string;
  errorId: string;
  helperText?: string | undefined;
  error?: string | undefined;
  // Textarea: the label rests at the top instead of the middle.
  multiline?: boolean;
  // Password and textarea draw a darker focus border than the text input in light Figma.
  focusBorder?: "default" | "strong";
  // For controls without an <input> (Select, MultiSelect): has a value, so the label stays above the border.
  filled?: boolean;
  className?: string | undefined;
  // Extra class on the bordered box, for a control's own state colours (e.g. Select's fill when open).
  controlClassName?: string | undefined;
  // The <input> / <textarea>, plus anything inside the border (e.g. the password toggle).
  children: ReactNode;
};

export function Field({
  label,
  controlId,
  labelId,
  helperId,
  errorId,
  helperText,
  error,
  multiline = false,
  focusBorder = "default",
  filled = false,
  className,
  controlClassName,
  children,
}: FieldProps) {
  const controlClasses = [
    styles.control,
    multiline && styles.multiline,
    focusBorder === "strong" && styles.strongFocus,
    controlClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <div className={controlClasses} data-filled={filled || undefined}>
        {children}
        <Label.Root id={labelId} htmlFor={controlId} className={styles.label}>
          {label}
        </Label.Root>
      </div>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
}
