# PasswordField

Password input with a show/hide eye button, built on Radix [`unstable_PasswordToggleField`](https://www.radix-ui.com/primitives/docs/components/password-toggle-field) inside the shared `Field` frame.

- Export: `PasswordField` (props: `<input>` props + `label`, `helperText`, `error`, `showPasswordLabel`, `hidePasswordLabel`).
- The eye labels come from the caller (translated); Radix's own label is English only.
- Radix returns focus to the input after a pointer toggle, masks the value again on submit/reset, and sets `autoComplete="current-password"`. Pass `"new-password"` on sign-up and reset password; TypeScript allows only these two.
- `unstable_` means the Radix API may change in a minor release: check this component after a `radix-ui` upgrade.
- Used by: sign-in, sign-up, reset-password and settings (change password). Docs: [02-sign-in-page](../../../../../docs/pages/02-sign-in-page.md).
