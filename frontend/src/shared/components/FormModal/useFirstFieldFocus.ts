import { useRef } from "react";

// Inputs, textareas and the combobox buttons of Select, MultiSelect and DatePicker.
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not(:disabled)',
  "textarea:not(:disabled)",
  '[role="combobox"]:not(:disabled)',
].join(", ");

/**
 * Focuses the form's first field when the modal opens, instead of Radix's first button (the ×).
 * Put `formRef` on the `<form>` and pass `onOpenAutoFocus` to `Modal`.
 */
export function useFirstFieldFocus() {
  const formRef = useRef<HTMLFormElement>(null);

  function onOpenAutoFocus(event: Event) {
    const firstField = formRef.current?.querySelector<HTMLElement>(FIELD_SELECTOR);
    if (!firstField) return;
    event.preventDefault();
    firstField.focus();
  }

  return { formRef, onOpenAutoFocus };
}
