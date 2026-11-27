import type { ChangeEvent, ComponentProps, KeyboardEvent } from "react";
import { SearchIcon } from "../icons";
import styles from "./SearchField.module.css";
import { useDebouncedCallback } from "./useDebouncedCallback";

// Guess: not in the docs ("may debounce"); short enough to feel instant, long enough to skip most keystrokes.
const DEFAULT_DEBOUNCE_MS = 300;

// Uncontrolled: pass the current search as `defaultValue`; `onSearch` reports a new one.
export type SearchFieldProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "onChange" | "children" | "aria-label"
> & {
  // Accessible name; there is no visible label (Figma shows only the placeholder).
  label: string;
  // Called after typing stops for `debounceMs`, and at once on Enter.
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export function SearchField({
  label,
  onSearch,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  className,
  onKeyDown,
  ...props
}: SearchFieldProps) {
  const { debounced, cancel } = useDebouncedCallback(onSearch, debounceMs);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    debounced(event.currentTarget.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    // Enter that confirms an IME composition (e.g. Japanese) is not a search. Enter alone must not submit a form around the field.
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      cancel();
      onSearch(event.currentTarget.value);
    }
  }

  return (
    <div className={[styles.searchField, className].filter(Boolean).join(" ")}>
      <SearchIcon className={styles.icon} />
      <input
        {...props}
        type="search"
        aria-label={label}
        className={styles.input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
