import type { ButtonHTMLAttributes, ReactElement } from "react";
import type { IconProps } from "../icons";
import styles from "./IconButton.module.css";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  // Required: the button shows only an icon, so this is its only accessible name.
  "aria-label": string;
  // One icon from shared/components/icons; it is decorative (aria-hidden) and takes the button's colour.
  children: ReactElement<IconProps>;
};

export function IconButton({ type = "button", className, children, ...props }: IconButtonProps) {
  const classes = [styles.iconButton, className].filter(Boolean).join(" ");

  return (
    <button {...props} type={type} className={classes}>
      {children}
    </button>
  );
}
