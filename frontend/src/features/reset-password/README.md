# Reset password

The `/reset-password?token=` page (PLAN S3.8, KAN-92): new password and confirm password, validation, a loading state, a redirect to `/sign-in` after a good reset, and a notice when the link cannot be used. The link comes from the mail of [forgot-password](../forgot-password/README.md).

- Exports: `ResetPasswordPage` (takes `token`; `app/[locale]/(auth)/reset-password/page.tsx` reads it from the query string, renders the page and sets the translated page title).
- `components/ResetPasswordForm`: the form. `useResetPassword` holds the state: a field shows its error after it was left or after a submit; the values stay when the request fails; the button stays locked while the request runs and until the redirect, so a request cannot be sent twice. After a good reset the hook sends the user to `/sign-in` (the backend does not sign the user in, so the user signs in with the new password). `utils/` has `validateResetPassword` (same rule as the backend `ResetPasswordInput`: 8 to 128 characters, a letter and a digit, PLAN D33, from `passwordProblem` in `@/shared/utils`) and `isTokenError`. `useResetPassword` reads a failed request with `readFailure` (`shared/failures`): kind `invalid` with `reason` `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED` or `RESET_TOKEN_USED` → a token message, any other `invalid` → "check the values", `tooManyRequests` has its own text. The meaning of a `reason` stays in this feature.
- The frontend never decides if a token is good: the backend answers on submit. A bad token replaces the form with `ResetPasswordNotice`. A link without a token shows the "invalid" notice at once and sends no request.
- `components/ResetPasswordNotice`: replaces the form when the link cannot be used: the message, "Request a new link" (`/forgot-password`) and GO TO SIGN IN.
- Texts: `messages/en.json` and `pl.json` (namespace `resetPassword`). Links use `Link` from `@/shared/i18n`, so they keep the language.
- Tests: component tests next to the code, mocked GraphQL through `renderWithProviders`; E2E in [`e2e/reset-password`](../../../../e2e/reset-password) (the whole flow, with the link read from Mailpit).

Docs: [reset password page](../../../../docs/pages/05-reset-password-page.md) · [backend auth module](../../../../backend/src/modules/auth/README.md)
