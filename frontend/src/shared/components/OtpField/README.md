# OtpField

A code input with one box per digit (default 6), built on Radix [`unstable_OneTimePasswordField`](https://www.radix-ui.com/primitives/docs/components/one-time-password-field).

- Export: `OtpField` (props: `label`, `getDigitLabel`, `value`, `onValueChange`, `length`, `error`, `disabled`, `name`, `className`).
- Controlled: the caller keeps the value (a string of digits). Radix moves the focus while the user types, moves it back on Backspace and spreads a pasted code over the boxes. Only digits are accepted.
- The names of the group and of each box come from the caller (translated). The error shows under the boxes and every box points to it with `aria-describedby`.
- The component does not decide if a code is good. The caller does (for the verification page: the backend).
- `unstable_` means the Radix API may change in a minor release: check this component after a `radix-ui` upgrade.
- Used by: the verify-email page. Docs: [06-verification-page](../../../../../docs/pages/06-verification-page.md).
