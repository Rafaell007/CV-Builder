import type { ComponentProps } from "react";
import styles from "./Button.module.css";

export type ButtonProps = Omit<ComponentProps<"button">, "className"> & {
  variant?: "primary" | "text";
  // Shows a spinner and blocks clicks, so a request cannot be sent twice.
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
