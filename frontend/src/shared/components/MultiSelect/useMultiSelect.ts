import { useSelect } from "downshift";
import { useRef, type KeyboardEvent, type MouseEvent, type Ref } from "react";
import { useElementByIdRef } from "@/shared/hooks";
import { createFocusLeaveHandler } from "@/shared/utils";
import type { SelectOption } from "../Select";
import { useScrollListIntoView } from "./useScrollListIntoView";
import { getSelectedOptions, toggleValue } from "./utils";

const {
  ItemClick,
  ToggleButtonKeyDownEnter,
  ToggleButtonKeyDownSpaceButton,
  ToggleButtonKeyDownArrowDown,
  ToggleButtonKeyDownArrowUp,
} = useSelect.stateChangeTypes;

// A list opened with the keyboard.
const KEYBOARD_OPEN_TYPES = new Set<string>([
  ToggleButtonKeyDownEnter,
  ToggleButtonKeyDownSpaceButton,
  ToggleButtonKeyDownArrowDown,
  ToggleButtonKeyDownArrowUp,
]);

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
  // True while a key is down on the toggle: Downshift reports Enter and Space on the closed toggle as a click.
  const keyIsDown = useRef(false);

  // Downshift keeps its own ref on the toggle; the caller gets the same element, found by its id after mount.
  useElementByIdRef(ref, controlId);

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
      // A keyboard opening starts on a row (the first chosen one, else the first), so the user sees where they are
      // and Enter has a row to toggle. Downshift opens with nothing highlighted (selectedItem is always null here).
      if (
        !state.isOpen &&
        changes.isOpen &&
        (keyIsDown.current || KEYBOARD_OPEN_TYPES.has(type)) &&
        options.length > 0
      ) {
        const chosen = options.findIndex(
          (option) => value.includes(option.value) && !option.disabled,
        );
        const first = options.findIndex((option) => !option.disabled);
        return { ...changes, selectedItem: null, highlightedIndex: chosen >= 0 ? chosen : first };
      }
      // Anything else must not choose: useSelect would pick the highlighted row on blur (Tab)
      // and the typed-ahead row while closed, as a native <select> does.
      return { ...changes, selectedItem: null };
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onValueChange(toggleValue(value, selectedItem.value));
    },
  });

  useScrollListIntoView(select.isOpen, menuId);

  return {
    isOpen: select.isOpen,
    highlightedIndex: select.highlightedIndex,
    selectedOptions,
    getToggleButtonProps: select.getToggleButtonProps,
    // Backspace on the closed field removes the last chip (as in tag inputs).
    onToggleKeyDown: (event: KeyboardEvent) => {
      keyIsDown.current = true;
      if (event.key === "Backspace" && !select.isOpen && value.length > 0) {
        onValueChange(value.slice(0, -1));
      }
    },
    onToggleKeyUp: () => {
      keyIsDown.current = false;
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
    onFocusLeave: createFocusLeaveHandler(onBlur),
  };
}
