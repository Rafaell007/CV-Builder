import { useId } from "react";
import styles from "./OtpFieldStub.module.css";

/**
 * TEMPORARY stand-in for the shared `OtpField` from S1.1b (KAN-78). The props below are the contract
 * this page expects; when KAN-78 lands, import `OtpField` from `@/shared/components` in
 * `VerifyEmail.tsx`, compare its props with this type, and delete this file and its stylesheet.
 */
export type OtpFieldProps = {
  name: string;
  label: string;
  // Digits only, at most `length` characters.
  value: string;
  onChange: (value: string) => void;
  length?: number;
  // Message shown under the field; also sets the error state.
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
};

// One text box instead of six: it accepts typing and pasting, but has no auto-advance between boxes.
// No `maxLength`: the browser would cut a pasted "123 456" before the non-digits are removed.
export function OtpFieldStub({
  name,
  label,
  value,
  onChange,
  length = 6,
  error = null,
  disabled = false,
  autoFocus = false,
}: OtpFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={styles.input}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, length))}
      />
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
