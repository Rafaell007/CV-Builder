# Select

Single choice from a list, built on Radix [`Select`](https://www.radix-ui.com/primitives/docs/components/select) inside the shared `Field` frame.

- Export: `Select` (props: `label`, `options: SelectOption[]`, `value`, `onValueChange`, `onBlur`, `ref`, `name`, `helperText`, `error`, `disabled`, `required`) and the types `SelectOption`, `SelectProps`.
- Controlled only: `""` means nothing is chosen, so option values must not be `""`. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- `onBlur` runs when focus leaves the field, not when the list opens (`useTriggerBlur`), so `onTouched` validation waits until the user moves on.
- No placeholder: the label rests inside until a value is chosen, as in the text input.
- The list is in a portal at the field's width, shows 5 options and then scrolls. Radix makes it modal: the rest of the page is hidden from screen readers while it is open.
- The list has `z-index: 21`, above the modal (20). Without it the modal overlay covers the list and options cannot be clicked in a modal (found in KAN-114: the first modal with a Select). Unit tests and jsdom cannot see this; the E2E spec `e2e/cvs/cv-skills.spec.ts` chooses options inside a modal.
- Used by: user profile (department, position), CV and project forms. Values: [docs/design-tokens.md › Select](../../../../../docs/design-tokens.md#select-ds).

## Known issues (found in the KAN-78 review)

- `useTriggerBlur` is a small wrapper with one user. Inline it if no other component needs it.
- If the list is closed by an outside click, focus can return to the trigger without a blur, so React Hook Form `onTouched` waits for the next blur. Check this when a form uses `mode: "onTouched"`.
- Error text is 12/16 here, but the Figma says 10/16. The deviation is deliberate and is in [docs/design-tokens.md](../../../../../docs/design-tokens.md).
