import type { ReactNode } from "react";
import styles from "./FormErrorMessage.module.css";

export interface FormErrorMessageProps {
  /** The translated text of the error. */
  children: ReactNode;
}

/**
 * An error of a whole form (not of one field), for example "Something went wrong" inside a modal after a failed
 * request. `role="alert"`, so a screen reader reads it as soon as it appears.
 */
export function FormErrorMessage({ children }: FormErrorMessageProps) {
  return (
    <p role="alert" className={styles.error}>
      {children}
    </p>
  );
}
