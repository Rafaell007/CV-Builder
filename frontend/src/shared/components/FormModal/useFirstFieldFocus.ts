import { useRef } from "react";

// Inputs, textareas and the combobox buttons of Select, MultiSelect and DatePicker.
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not(:disabled)',
  "textarea:not(:disabled)",
  '[role="combobox"]:not(:disabled)',
].join(", ");

// A focused date field opens its calendar, so the modal must not start there (the DatePicker marks its box).
const DATE_PICKER_SELECTOR = "[data-date-picker]";

/**
 * Focuses the form's first field when the modal opens, instead of Radix's first button (the ×).
 * A date field is skipped: it opens its calendar when it gets focus. When no other field exists, Radix decides.
 * Put `formRef` on the `<form>` and pass `onOpenAutoFocus` to `Modal`.
 */
export function useFirstFieldFocus() {
  const formRef = useRef<HTMLFormElement>(null);

  function onOpenAutoFocus(event: Event) {
    const fields = formRef.current?.querySelectorAll<HTMLElement>(FIELD_SELECTOR) ?? [];
    const firstField = Array.from(fields).find((field) => !field.closest(DATE_PICKER_SELECTOR));
    if (!firstField) return;
    event.preventDefault();
    firstField.focus();
  }

  return { formRef, onOpenAutoFocus };
}
