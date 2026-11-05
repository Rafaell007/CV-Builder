import type { Ref } from "react";
import { Field, useFieldIds } from "../Field";
import { ExpandMoreIcon } from "../icons";
import type { SelectOption } from "../Select";
import { CheckboxMark } from "./CheckboxMark";
import { ChipRemoveIcon } from "./ChipRemoveIcon";
import styles from "./MultiSelect.module.css";
import { useMultiSelect } from "./useMultiSelect";

export type MultiSelectProps = {
  label: string;
  options: readonly SelectOption[];
  // Controlled: the chosen values, in the order they were chosen.
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  // Runs when focus leaves the whole field (toggle and the × buttons), React Hook Form's field.onBlur.
  onBlur?: () => void;
  // On the toggle, so React Hook Form can focus the field (field.ref).
  ref?: Ref<HTMLElement>;
  // Translated name of a chip's × button, e.g. (option) => t("remove", { option }) → "Remove React".
  getRemoveLabel: (optionLabel: string) => string;
  id?: string;
  helperText?: string | undefined;
  error?: string | undefined;
  disabled?: boolean;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
};

export function MultiSelect({
  label,
  options,
  value,
  onValueChange,
  onBlur,
  ref,
  getRemoveLabel,
  id,
  helperText,
  error,
  disabled = false,
  className,
  "aria-describedby": ariaDescribedBy,
}: MultiSelectProps) {
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    id,
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
    ariaDescribedBy,
  });
  const labelId = `${controlId}-label`;
  const {
    isOpen,
    highlightedIndex,
    selectedOptions,
    getToggleButtonProps,
    onToggleKeyDown,
    getMenuProps,
    getItemProps,
    removeOption,
    onFocusLeave,
  } = useMultiSelect({
    options,
    value,
    onValueChange,
    onBlur,
    ref,
    controlId,
    labelId,
    menuId: `${controlId}-list`,
  });

  return (
    <Field
      label={label}
      controlId={controlId}
      labelId={labelId}
      onLabelClick={() => document.getElementById(controlId)?.focus()}
      helperId={helperId}
      errorId={errorId}
      helperText={helperText}
      error={error}
      filled={selectedOptions.length > 0}
      className={className}
      controlClassName={styles.control}
    >
      <div className={styles.box} onBlur={onFocusLeave}>
        {/* First in the tab order; covers the whole box under the chips, so a click on free space opens the list */}
        <div
          {...getToggleButtonProps({
            ...controlProps,
            onKeyDown: onToggleKeyDown,
            disabled,
            "aria-disabled": disabled || undefined,
            tabIndex: disabled ? -1 : 0,
          })}
          className={styles.toggle}
        >
          <ExpandMoreIcon className={styles.chevron} />
        </div>
        {selectedOptions.length > 0 && (
          <div
            role="group"
            aria-labelledby={labelId}
            aria-disabled={disabled || undefined}
            className={styles.chips}
          >
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.chip}>
                <span className={styles.chipText}>{option.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={getRemoveLabel(option.label)}
                    onClick={(event) => removeOption(event, option.value)}
                    className={styles.remove}
                  >
                    <ChipRemoveIcon />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {/* Always rendered (Downshift needs the menu element); hidden while closed */}
        <ul {...getMenuProps()} hidden={!isOpen} className={styles.list}>
          {isOpen &&
            options.map((option, index) => {
              const selected = value.includes(option.value);
              return (
                <li
                  key={option.value}
                  {...getItemProps({ item: option, index, "aria-selected": selected })}
                  data-highlighted={highlightedIndex === index || undefined}
                  className={styles.option}
                >
                  <CheckboxMark checked={selected} />
                  <span className={styles.optionText}>{option.label}</span>
                </li>
              );
            })}
        </ul>
      </div>
    </Field>
  );
}
