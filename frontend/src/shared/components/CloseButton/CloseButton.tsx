import type { ButtonHTMLAttributes } from "react";
import { CloseIcon } from "../icons";
import styles from "./CloseButton.module.css";

export type CloseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  // Required: the button shows only a cross, so this is its only accessible name.
  "aria-label": string;
};

// 24×24 cross for modals and toasts; it takes the colour of the text around it.
export function CloseButton({ type = "button", className, ...props }: CloseButtonProps) {
  const classes = [styles.closeButton, className].filter(Boolean).join(" ");

  return (
    <button {...props} type={type} className={classes}>
      <CloseIcon />
    </button>
  );
}
