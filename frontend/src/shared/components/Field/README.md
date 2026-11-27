# Field

The shared frame of TextField, PasswordField and Textarea: the bordered box, the floating label and the helper or error text below it. Internal: imported only by those siblings (`../Field`), not exported from `shared/components`.

- `Field`: renders the box around its children (the control, plus e.g. the password toggle), a Radix `Label` and the text below. The error replaces the helper text.
- `useFieldIds`: ids for the label, helper and error, and `controlProps` (`id`, `aria-invalid`, `aria-describedby`) to spread onto the control.
- `fieldInputClassName`: the shared look of the control itself (value text, disabled colour, autofill). Put it on the `<input>` / `<textarea>`.

States are CSS only, read from the control: focus, filled, `aria-invalid`, `disabled`. "Filled" uses `:placeholder-shown`, so **the control must have `placeholder=" "`**; the label plays the placeholder's role.

Controls without an `<input>` (Select, MultiSelect) use a `role="combobox"` button: they pass `filled`, and their open list (`aria-expanded="true"`) counts as focus, because the list lives in a portal outside the box. `controlClassName` adds a control's own state colours; it may set `--field-border`, the default border colour.

The floated label sits 15px above the border, outside the box: the form leaves that space.

Values: [docs/design-tokens.md › Components](../../../../../docs/design-tokens.md#components).

## Focus border width (decided 2026-11-16, KAN-118, PLAN D37)

Figma draws a 1px focus border. In the CV project modal that is hard to see on the date fields, so the form's wrapper sets `--field-focus-extra: 1px` (`CvProjectFormFields.module.css`) and every field below it gets a 2px focus border: the 1px border plus a 1px inset shadow (`Field.module.css`). The variable is 0 everywhere else, so all other forms still show 1px. The search field of the CV Projects tab sets the same variable on its toolbar (`SearchField.module.css` reads it). A date field with its calendar open always has 2px. **Open: check every other form and page for the same problem and decide if the 2px focus border becomes the default** (GitHub issue "Check the focus border width of every input in the app"). If it does, set the default of `--field-focus-extra` to 1px and delete the wrapper setting.

## Known issues (found in the KAN-78 review)

- Field knows about MultiSelect: the `--field-height` variable and the `[role="combobox"]` selectors. Change Field and MultiSelect together.
