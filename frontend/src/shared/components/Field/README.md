# Field

The shared frame of TextField, PasswordField and Textarea: the bordered box, the floating label and the helper or error text below it. Internal: imported only by those siblings (`../Field`), not exported from `shared/components`.

- `Field`: renders the box around its children (the control, plus e.g. the password toggle), a Radix `Label` and the text below. The error replaces the helper text.
- `useFieldIds`: ids for the label, helper and error, and `controlProps` (`id`, `aria-invalid`, `aria-describedby`) to spread onto the control.
- `fieldInputClassName`: the shared look of the control itself (value text, disabled colour, autofill). Put it on the `<input>` / `<textarea>`.

States are CSS only, read from the control: focus, filled, `aria-invalid`, `disabled`. "Filled" uses `:placeholder-shown`, so **the control must have `placeholder=" "`**; the label plays the placeholder's role.

The floated label sits 15px above the border, outside the box: the form leaves that space.

Values: [docs/design-tokens.md › Components](../../../../../docs/design-tokens.md#components).
