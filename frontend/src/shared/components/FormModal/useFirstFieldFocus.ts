import { useRef } from "react";

// Inputs, textareas and the combobox buttons of Select, MultiSelect and DatePicker.
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not(:disabled)',
  "textarea:not(:disabled)",
  '[role="combobox"]:not(:disabled)',
].join(", ");

// How long after opening a selection is undone. A menu that opened the modal (a row's Actions menu) returns the focus
// to its button as it closes; the Radix focus trap then pulls the focus back with select(), which selects the whole
// text of the field (the date of a filled date field). The pull-back comes some milliseconds after the modal opened.
const SELECTION_GUARD_MS = 1000;

function hasSelection(field: HTMLInputElement | HTMLTextAreaElement) {
  return field.selectionStart !== field.selectionEnd;
}

// Puts the cursor at the end of the text, so nothing is selected and a key press does not replace the value.
function collapseSelection(field: HTMLElement) {
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
  try {
    if (!hasSelection(field)) return;
    const end = field.value.length;
    field.setSelectionRange(end, end);
  } catch {
    // Input types without a selection (number, email in some browsers): nothing to collapse
  }
}

// Collapses at once and again for every select() in the first second (the "select" event fires after select()).
function keepSelectionCollapsed(field: HTMLElement) {
  collapseSelection(field);
  const onSelect = () => collapseSelection(field);
  field.addEventListener("select", onSelect);
  window.setTimeout(() => field.removeEventListener("select", onSelect), SELECTION_GUARD_MS);
}

// The DatePicker marks its box with this attribute.
const DATE_PICKER_SELECTOR = "[data-date-picker]";

/**
 * Focuses the form's first field when the modal opens, instead of Radix's first button (the ×).
 * When the first field is a date field, the form itself gets the focus instead (it has tabindex -1): no cursor and no
 * selected date, and the first Tab reaches the date field. Focusing a date field never opens its calendar (Enter, an
 * arrow or a click does). When no field exists, Radix decides.
 * Put `formRef` on the `<form>` and pass `onOpenAutoFocus` to `Modal`.
 */
export function useFirstFieldFocus() {
  const formRef = useRef<HTMLFormElement>(null);

  function onOpenAutoFocus(event: Event) {
    const fields = formRef.current?.querySelectorAll<HTMLElement>(FIELD_SELECTOR) ?? [];
    const firstField = fields[0];
    if (!firstField) return;
    event.preventDefault();
    if (firstField.closest(DATE_PICKER_SELECTOR)) {
      formRef.current?.focus();
      return;
    }
    firstField.focus();
    keepSelectionCollapsed(firstField);
  }

  return { formRef, onOpenAutoFocus };
}
