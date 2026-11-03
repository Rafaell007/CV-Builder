import { unstable_OneTimePasswordField as OneTimePasswordField } from "radix-ui";
import { useId } from "react";
import styles from "./OtpField.module.css";

export type OtpFieldProps = {
  // Accessible name of the whole group, translated by the caller (e.g. "Verification code").
  label: string;
  // Accessible name of one box, translated by the caller (e.g. "Digit 2 of 6").
  getDigitLabel: (position: number, length: number) => string;
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  error?: string | undefined;
  disabled?: boolean;
  name?: string;
  className?: string | undefined;
};

const DEFAULT_LENGTH = 6;

/**
 * One box per digit, built on Radix [`unstable_OneTimePasswordField`](https://www.radix-ui.com/primitives/docs/components/one-time-password-field).
 * Radix moves the focus on while the user types, moves it back on Backspace, and spreads a pasted code over the boxes.
 * Only digits are accepted. The component does not judge the code: the caller does (the backend decides if it is valid).
 */
export function OtpField({
  label,
  getDigitLabel,
  value,
  onValueChange,
  length = DEFAULT_LENGTH,
  error,
  disabled,
  name,
  className,
}: OtpFieldProps) {
  const errorId = useId();

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <OneTimePasswordField.Root
        role="group"
        aria-label={label}
        className={styles.boxes}
        value={value}
        onValueChange={onValueChange}
        validationType="numeric"
        autoComplete="one-time-code"
        disabled={disabled}
        name={name}
      >
        {Array.from({ length }, (_, index) => (
          <OneTimePasswordField.Input
            key={index}
            className={styles.box}
            aria-label={getDigitLabel(index + 1, length)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            inputMode="numeric"
          />
        ))}
        <OneTimePasswordField.HiddenInput />
      </OneTimePasswordField.Root>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
