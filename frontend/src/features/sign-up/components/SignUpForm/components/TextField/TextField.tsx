import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./TextField.module.css";

export type TextFieldProps = Omit<ComponentProps<"input">, "id" | "className" | "placeholder"> & {
  // Shown as the placeholder and read by screen readers as the label.
  label: string;
  // The message under the field; its presence marks the field as invalid.
  error?: string | undefined;
  // Slot inside the border, after the input (for example the show/hide button of a password).
  endAdornment?: ReactNode;
};

export function TextField({ label, error, endAdornment, ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error === undefined ? undefined : ""}>
        <input
          {...rest}
          id={id}
          className={styles.input}
          placeholder={label}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={error === undefined ? undefined : errorId}
        />
        {endAdornment}
      </div>
      {error !== undefined && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
