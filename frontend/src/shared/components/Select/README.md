# Select

Single choice from a list, built on Radix [`Select`](https://www.radix-ui.com/primitives/docs/components/select) inside the shared `Field` frame.

- Export: `Select` (props: `label`, `options: SelectOption[]`, `value`, `onValueChange`, `onBlur`, `ref`, `name`, `helperText`, `error`, `disabled`, `required`) and the types `SelectOption`, `SelectProps`.
- Controlled only: `""` means nothing is chosen, so option values must not be `""`. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- `onBlur` runs when focus leaves the field, not when the list opens (`useTriggerBlur`), so `onTouched` validation waits until the user moves on.
- No placeholder: the label rests inside until a value is chosen, as in the text input.
- The list is in a portal at the field's width, shows 5 options and then scrolls. Radix makes it modal: the rest of the page is hidden from screen readers while it is open.
- Used by: user profile (department, position), CV and project forms. Values: [docs/design-tokens.md › Select](../../../../../docs/design-tokens.md#select-ds).
