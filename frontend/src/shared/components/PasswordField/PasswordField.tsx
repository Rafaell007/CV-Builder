import { unstable_PasswordToggleField as PasswordToggleField } from "radix-ui";
import { useState, type ComponentProps } from "react";
import { Field, fieldInputClassName, useFieldIds } from "../Field";
import { IconButton } from "../IconButton";
import { VisibilityIcon, VisibilityOffIcon } from "../icons";
import styles from "./PasswordField.module.css";

// Radix Input's props: <input> props without `type` (Radix sets password/text), and autoComplete limited to
// "current-password" | "new-password". No placeholder: the floating label takes its place.
export type PasswordFieldProps = Omit<
  ComponentProps<typeof PasswordToggleField.Input>,
  "placeholder" | "children" | "asChild"
> & {
  label: string;
  helperText?: string | undefined;
  error?: string | undefined;
  // Accessible names of the eye button, translated by the caller.
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

// Radix keeps focus right when toggling, masks the value again on submit/reset and sets
// autoComplete="current-password" (pass "new-password" on sign-up). https://www.radix-ui.com/primitives/docs/components/password-toggle-field
export function PasswordField({
  label,
  id,
  helperText,
  error,
  className,
  disabled,
  showPasswordLabel,
  hidePasswordLabel,
  ...props
}: PasswordFieldProps) {
  // UI-only state: needed to pick the translated label (Radix's own label is English only).
  const [visible, setVisible] = useState(false);
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    id,
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
  });
  const toggleLabel = visible ? hidePasswordLabel : showPasswordLabel;

  return (
    <PasswordToggleField.Root visible={visible} onVisibilityChange={setVisible}>
      <Field
        label={label}
        controlId={controlId}
        helperId={helperId}
        errorId={errorId}
        helperText={helperText}
        error={error}
        focusBorder="strong"
        className={className}
      >
        <PasswordToggleField.Input
          {...props}
          {...controlProps}
          disabled={disabled}
          placeholder=" "
          className={fieldInputClassName}
        />
        {/* aria-label on Toggle too, so Radix does not add its English default */}
        <PasswordToggleField.Toggle asChild aria-label={toggleLabel} disabled={disabled}>
          <IconButton aria-label={toggleLabel} className={styles.toggle}>
            {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </PasswordToggleField.Toggle>
      </Field>
    </PasswordToggleField.Root>
  );
}
