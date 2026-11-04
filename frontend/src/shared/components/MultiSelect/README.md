# MultiSelect

Several choices from a list, shown as chips inside the shared `Field` frame. The list is Downshift [`useSelect`](https://www.downshift-js.com/use-select) run as a checkbox list.

- Export: `MultiSelect` (props: `label`, `options: SelectOption[]`, `value: string[]`, `onValueChange`, `onBlur`, `ref`, `getRemoveLabel`, `helperText`, `error`, `disabled`) and the type `MultiSelectProps`.
- Controlled only. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- Keyboard: the field opens with Enter, Space or the arrows. Enter or Space toggles the highlighted row, and the list stays open until Escape or Tab. Backspace on the closed field removes the last chip. Tab reaches each chip's × button.
- Chips are plain text plus a real `<button>`; `getRemoveLabel` gives its translated name ("Remove React"). Downshift's `useTagGroup` was tried and dropped: its markup fails axe (`nested-interactive`, `label-content-name-mismatch`).
- `onBlur` runs only when focus leaves the whole field (toggle and × buttons). After a × click, focus moves to the field.
- The list is not in a portal: it is positioned under the field. Inside a clipping container (`overflow: hidden`), give it room.
- Used by: project and CV forms (environment, skills). Values: [docs/design-tokens.md › Multi-select](../../../../../docs/design-tokens.md#multi-select-ds).

## Known issues (found in the KAN-78 review)

- The label's `htmlFor` points at a `div` (the Downshift toggle), which a label cannot focus. A click on the label does not focus the field. Screen readers are served by `aria-labelledby`.
- `SelectOption` is imported from the sibling `../Select` folder. Move the type to the nearest common ancestor if a third component needs it.
- `Field` knows about MultiSelect (`--field-height`, the combobox selector). Change both together.
- The CSS repeats the Select CSS on purpose (see the comment in `MultiSelect.module.css`). Keep the two in step.
- Backspace on the closed field removes the last chip. This is not in the design. Confirm it.
- No search inside the list. The pages in `docs/pages/` do not ask for it.
