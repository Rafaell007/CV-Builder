# OtpField

A code input with one box per digit (default 6), built on Radix [`unstable_OneTimePasswordField`](https://www.radix-ui.com/primitives/docs/components/one-time-password-field).

- Export: `OtpField` (props: `label`, `getDigitLabel`, `value`, `onValueChange`, `length`, `error`, `disabled`, `name`, `onBlur`, `ref`, `className`).
- Works with React Hook Form like the other fields: `onBlur` runs only when focus leaves all the boxes (not between them); `ref` receives the first box, so the form can focus the field on an error.
- Controlled: the caller keeps the value (a string of digits). Radix moves the focus while the user types, moves it back on Backspace and spreads a pasted code over the boxes. Only digits are accepted.
- The names of the group and of each box come from the caller (translated). The error shows under the boxes and every box points to it with `aria-describedby`.
- The component does not decide if a code is good. The caller does (for the verification page: the backend).
- `unstable_` means the Radix API may change in a minor release: check this component after a `radix-ui` upgrade.
- Used by: the verify-email page. Docs: [06-verification-page](../../../../../docs/pages/06-verification-page.md).

## Known issues (found in the KAN-78 review)

- In KAN-78 the digit font changed from `--text-heading` to `--text-input`, the focus border from `-focus-strong` to `-focus`, and the error colour to `--color-error-text`. This changes the verify-email page. Confirm the font size with the designer.
- No E2E check covers these styles.
