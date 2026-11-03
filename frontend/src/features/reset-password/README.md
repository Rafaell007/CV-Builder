# Reset password

The `/reset-password?token=` page (PLAN S3.8, KAN-92): new password and confirm password, validation, a loading state, and a notice when the link cannot be used. The link comes from the mail of [forgot-password](../forgot-password/README.md).

- Exports: `ResetPasswordPage` (takes `token`; `app/[locale]/(auth)/reset-password/page.tsx` reads it from the query string, renders the page and sets the translated page title).
- `components/ResetPasswordForm`: the form. `useResetPassword` holds the state: a field shows its error after it was left or after a submit; the values stay when the request fails; a second click is ignored while the request runs. `utils/` has `validateResetPassword` (same rule as the backend `ResetPasswordInput`: 8 to 128 characters, a letter and a digit, PLAN D33, from `passwordProblem` in `@/shared/utils`) and `toResetPasswordFailure` (`BAD_USER_INPUT` with `reason` `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED` or `RESET_TOKEN_USED` → a token message).
- The frontend never decides if a token is good: the backend answers on submit. A bad token replaces the form with `ResetPasswordNotice`. A link without a token shows the "invalid" notice at once and sends no request.
- `components/ResetPasswordNotice`: the end of the page. After success it says the password was changed and offers GO TO SIGN IN. The backend does not sign the user in (backend auth README), so the user signs in with the new password. For a bad token it also offers "Request a new link" (`/forgot-password`).
- Texts: `messages/en.json` and `pl.json` (namespace `resetPassword`). Links use `Link` from `@/shared/i18n`, so they keep the language.
- Tests: component tests next to the code, mocked GraphQL through `renderWithProviders`; E2E in [`e2e/reset-password`](../../../../e2e/reset-password) (the whole flow, with the link read from Mailpit).

Docs: [reset password page](../../../../docs/pages/05-reset-password-page.md) · [backend auth module](../../../../backend/src/modules/auth/README.md)
