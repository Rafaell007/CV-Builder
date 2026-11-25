import { Select as RadixSelect } from "radix-ui";
import type { Ref } from "react";
import { Field, useFieldIds } from "../Field";
import { ExpandMoreIcon } from "../icons";
import styles from "./Select.module.css";
import { useTriggerBlur } from "./useTriggerBlur";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  label: string;
  options: readonly SelectOption[];
  // Controlled: "" means nothing is chosen (Radix shows no value). Option values must not be "".
  value: string;
  onValueChange: (value: string) => void;
  // Runs when focus leaves the field, not when the list opens (React Hook Form's field.onBlur).
  onBlur?: () => void;
  // On the trigger button, so React Hook Form can focus the field (field.ref).
  ref?: Ref<HTMLButtonElement>;
  name?: string;
  id?: string;
  helperText?: string | undefined;
  error?: string | undefined;
  disabled?: boolean;
  // Shows the value but never opens or changes; unlike disabled it stays focusable and is read by screen readers.
  readOnly?: boolean;
  required?: boolean;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
};

// Radix Select: keyboard, typeahead and ARIA (select-only combobox). https://www.radix-ui.com/primitives/docs/components/select
// No placeholder: the label rests inside until a value is chosen, as in the text input.
export function Select({
  label,
  options,
  value,
  onValueChange,
  onBlur,
  ref,
  name,
  id,
  helperText,
  error,
  disabled = false,
  readOnly = false,
  required = false,
  className,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    id,
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
    ariaDescribedBy,
  });
  const { onOpenChange, onTriggerBlur } = useTriggerBlur(onBlur);

  return (
    <RadixSelect.Root
      value={value}
      // Radix has no read-only mode: the list stays closed, and typeahead on the closed trigger changes nothing.
      {...(readOnly
        ? { open: false, onValueChange: ignoreValueChange }
        : { onValueChange, onOpenChange })}
      name={name}
      disabled={disabled}
      required={required}
    >
      <Field
        label={label}
        controlId={controlId}
        helperId={helperId}
        errorId={errorId}
        helperText={helperText}
        error={error}
        filled={value !== ""}
        className={className}
        controlClassName={styles.control}
      >
        <RadixSelect.Trigger
          {...controlProps}
          ref={ref}
          aria-readonly={readOnly || undefined}
          onBlur={readOnly ? onBlur : onTriggerBlur}
          className={styles.trigger}
        >
          {/* Radix asks not to style Value itself; the wrapper truncates long names */}
          <span className={styles.value}>
            <RadixSelect.Value />
          </span>
          <RadixSelect.Icon className={styles.chevron}>
            <ExpandMoreIcon />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
      </Field>
      <RadixSelect.Portal>
        {/* Under the field's bottom border, aligned with its outer left edge (the trigger sits inside the border) */}
        <RadixSelect.Content
          position="popper"
          sideOffset={1}
          alignOffset={-1}
          className={styles.list}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={styles.option}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ignoreValueChange() {}
