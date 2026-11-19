import { useEffect, useRef } from "react";

// Inputs, textareas and the combobox buttons of Select, MultiSelect and DatePicker.
const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not(:disabled)',
  "textarea:not(:disabled)",
  '[role="combobox"]:not(:disabled)',
].join(", ");

// Longest time after opening that a selection is undone (it ends sooner at the first key or pointer press). A menu that opened the modal (a row's Actions menu) returns the focus
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

// Collapses at once and again for every select() until the user presses a key or a pointer button, or the guard time
// ends (the "select" event fires after select()). A selection the user makes (double-click, Ctrl+A) comes after such
// an interaction, so it stays. Returns a function that stops the guard at once.
function keepSelectionCollapsed(field: HTMLElement) {
  collapseSelection(field);
  let timer = 0;
  const stop = () => {
    window.clearTimeout(timer);
    field.removeEventListener("select", onSelect);
    document.removeEventListener("pointerdown", stop, true);
    document.removeEventListener("keydown", stop, true);
  };
  const onSelect = () => {
    if (!field.isConnected)
      stop(); // the modal closed
    else collapseSelection(field);
  };
  field.addEventListener("select", onSelect);
  document.addEventListener("pointerdown", stop, true);
  document.addEventListener("keydown", stop, true);
  timer = window.setTimeout(stop, SELECTION_GUARD_MS);
  return stop;
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
  const stopGuard = useRef<(() => void) | null>(null);

  // Stops the guard (listeners and timer) when the component unmounts.
  useEffect(() => () => stopGuard.current?.(), []);

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
    stopGuard.current?.();
    stopGuard.current = keepSelectionCollapsed(firstField);
  }

  return { formRef, onOpenAutoFocus };
}
