# MultiSelect

Several choices from a list, shown as chips inside the shared `Field` frame. The list is Downshift [`useSelect`](https://www.downshift-js.com/use-select) run as a checkbox list.

- Export: `MultiSelect` (props: `label`, `options: SelectOption[]`, `value: string[]`, `onValueChange`, `onBlur`, `ref`, `getRemoveLabel`, `helperText`, `error`, `disabled`) and the type `MultiSelectProps`.
- Controlled only. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- Keyboard: the field opens with Enter, Space or the arrows, and the list starts on a row (the first chosen one, else the first), so the user sees where they are (`useMultiSelect`, `keyIsDown`). The rows are rendered also while the list is closed (the list is `hidden`): removing them while Tab leaves the open list made the Radix focus trap of a `Modal` move the focus to the dialog, and Tab never reached the next control. Enter or Space toggles the highlighted row, and the list stays open until Escape or Tab. Backspace on the closed field removes the last chip. The toggle is the first Tab stop and shows a 2px focus ring just inside the border on keyboard focus (without it a field with chips shows no change, because its filled border is the focus border); then Tab reaches each chip's × button.
- Chips are plain text plus a real `<button>`; `getRemoveLabel` gives its translated name ("Remove React"). Downshift's `useTagGroup` was tried and dropped: its markup fails axe (`nested-interactive`, `label-content-name-mismatch`).
- `onBlur` runs only when focus leaves the whole field (toggle and × buttons). After a × click, focus moves to the field.
- The list is not in a portal: it is positioned under the field. Inside a clipping container (`overflow: hidden`), give it room. Inside a container that scrolls (a modal), the container scrolls to show the whole open list and goes back when the list closes (`useScrollListIntoView`; no animation with reduced motion).
- Used by: project and CV forms (environment, skills). Values: [docs/design-tokens.md › Multi-select](../../../../../docs/design-tokens.md#multi-select-ds).

## Known issues (found in the KAN-78 review)

- `SelectOption` is imported from the sibling `../Select` folder. Move the type to the nearest common ancestor if a third component needs it.
- `Field` knows about MultiSelect (`--field-height`, the combobox selector). Change both together.
- The CSS repeats the Select CSS on purpose (see the comment in `MultiSelect.module.css`). Keep the two in step.
- Backspace on the closed field removes the last chip. This is not in the design. Confirm it.
- No search inside the list. The pages in `docs/pages/` do not ask for it.
- Open list rows (decision of Maciek, 2026-11-16: Figma does not draw the open list): no grey fill, not for a chosen row and not for the highlighted row. The checkbox shows whether a row is chosen, and the highlighted row (arrow keys or the mouse) has a 2px outline inside the row. A disabled row keeps its grey text.
