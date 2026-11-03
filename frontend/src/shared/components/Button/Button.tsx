import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import styles from "./Button.module.css";

// "text" is Figma's "Primary (V2)": red text, no fill (docs/design-tokens.md › Components › Button).
export type ButtonVariant = "primary" | "text" | "secondary" | "ghost";

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export type ButtonProps = ButtonBaseProps &
  (
    | { asChild?: false; loading?: boolean }
    // The single child (e.g. a Link) gets the button's look. It has no spinner, so no loading state.
    | { asChild: true; loading?: never }
  );

export function Button({
  variant = "primary",
  loading = false,
  asChild = false,
  type = "button",
  className,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  if (asChild) {
    return (
      <Slot.Root {...props} className={classes} onClick={onClick}>
        {children}
      </Slot.Root>
    );
  }

  // While loading the button stays focusable (aria-disabled, not `disabled`), so keyboard focus is not lost
  // mid-submit; clicks are blocked here, which also stops a submit button from submitting its form again.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...props}
      // Default "button", not the HTML default "submit": a form's submit button says so explicitly.
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      aria-disabled={loading || props["aria-disabled"]}
      onClick={handleClick}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
