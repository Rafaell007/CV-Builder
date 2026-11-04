# MultiSelect

Several choices from a list, shown as chips inside the shared `Field` frame. The list is Downshift [`useSelect`](https://www.downshift-js.com/use-select) run as a checkbox list.

- Export: `MultiSelect` (props: `label`, `options: SelectOption[]`, `value: string[]`, `onValueChange`, `onBlur`, `ref`, `getRemoveLabel`, `helperText`, `error`, `disabled`) and the type `MultiSelectProps`.
- Controlled only. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- Keyboard: the field opens with Enter, Space or the arrows. Enter or Space toggles the highlighted row, and the list stays open until Escape or Tab. Backspace on the closed field removes the last chip. Tab reaches each chip's × button.
- Chips are plain text plus a real `<button>`; `getRemoveLabel` gives its translated name ("Remove React"). Downshift's `useTagGroup` was tried and dropped: its markup fails axe (`nested-interactive`, `label-content-name-mismatch`).
- `onBlur` runs only when focus leaves the whole field (toggle and × buttons). After a × click, focus moves to the field.
- The list is not in a portal: it is positioned under the field. Inside a clipping container (`overflow: hidden`), give it room.
- Used by: project and CV forms (environment, skills). Values: [docs/design-tokens.md › Multi-select](../../../../../docs/design-tokens.md#multi-select-ds).
