import { useSelect } from "downshift";
import {
  useImperativeHandle,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
} from "react";
import type { SelectOption } from "../Select";
import { getSelectedOptions, toggleValue } from "./utils";

const { ItemClick, ToggleButtonKeyDownEnter, ToggleButtonKeyDownSpaceButton } =
  useSelect.stateChangeTypes;

export type UseMultiSelectOptions = {
  options: readonly SelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  onBlur: (() => void) | undefined;
  // The caller's ref (React Hook Form's field.ref): receives the toggle element.
  ref: Ref<HTMLElement> | undefined;
  // Ids shared with Field: the toggle is the control, the label names it and the list.
  controlId: string;
  labelId: string;
  menuId: string;
};

// Downshift's useSelect runs the list as a checkbox list: a click or Enter / Space toggles the row and the list
// stays open. https://www.downshift-js.com/use-select. Controlled by `value`; Downshift's own selectedItem stays null.
// Chips are plain text with a real × button (Downshift's useTagGroup fails axe: nested-interactive).
export function useMultiSelect({
  options,
  value,
  onValueChange,
  onBlur,
  ref,
  controlId,
  labelId,
  menuId,
}: UseMultiSelectOptions) {
  const selectedOptions = getSelectedOptions(options, value);

  // Downshift keeps its own ref on the toggle; the caller gets the same element, found by its id after mount.
  useImperativeHandle(ref, () => document.getElementById(controlId) as HTMLElement, [controlId]);

  const select = useSelect<SelectOption>({
    items: [...options],
    itemToString: (option) => option?.label ?? "",
    isItemDisabled: (option) => Boolean(option.disabled),
    selectedItem: null,
    toggleButtonId: controlId,
    labelId,
    menuId,
    stateReducer: (state, { type, changes }) => {
      const togglesRow =
        state.isOpen &&
        (type === ItemClick ||
          type === ToggleButtonKeyDownEnter ||
          type === ToggleButtonKeyDownSpaceButton);
      if (togglesRow) {
        return { ...changes, isOpen: true, highlightedIndex: state.highlightedIndex };
      }
      // Anything else must not choose: useSelect would pick the highlighted row on blur (Tab)
      // and the typed-ahead row while closed, as a native <select> does.
      return { ...changes, selectedItem: null };
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onValueChange(toggleValue(value, selectedItem.value));
    },
  });

  return {
    isOpen: select.isOpen,
    highlightedIndex: select.highlightedIndex,
    selectedOptions,
    getToggleButtonProps: select.getToggleButtonProps,
    // Backspace on the closed field removes the last chip (as in tag inputs).
    onToggleKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Backspace" && !select.isOpen && value.length > 0) {
        onValueChange(value.slice(0, -1));
      }
    },
    // Clicking a row must not take focus from the toggle, so the keyboard keeps working.
    getMenuProps: () =>
      select.getMenuProps({
        "aria-multiselectable": true,
        onMouseDown: (event: MouseEvent) => event.preventDefault(),
      }),
    getItemProps: select.getItemProps,
    // The × disappears with its chip; focus goes to the toggle (found by its id) instead of the page body.
    removeOption: (event: MouseEvent<HTMLElement>, optionValue: string) => {
      event.currentTarget.ownerDocument.getElementById(controlId)?.focus();
      onValueChange(value.filter((item) => item !== optionValue));
    },
    // Focus moving between the toggle and the × buttons stays inside the field: not a blur for the form.
    onFocusLeave: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
    },
  };
}
