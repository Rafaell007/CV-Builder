# Forgot password

The `/forgot-password` page (PLAN S3.7, KAN-92): one email field, a loading state, and a confirmation after the backend accepted the request.

- Exports: `ForgotPasswordPage` (Server Component; `app/[locale]/(auth)/forgot-password/page.tsx` renders it and sets the translated page title).
- `components/ForgotPasswordForm`: the form. `useForgotPassword` holds the state: the email shows its error after it was left or after a submit; the value stays when the request fails; a second click is ignored while the request runs. The backend answers `true` for known and unknown emails, so the confirmation ("If an account with this email exists…") never says whether the account exists. `useForgotPassword` reads a failed request with `readFailure` (`shared/failures`): `tooManyRequests` and `invalid` have their own text, any other kind → "Something went wrong".
- The email rule comes from `emailProblem` in `@/shared/utils`. Form controls come from `@/shared/components`.
- CANCEL and "Back to sign in" lead to `/sign-in`. The mail link opens [reset-password](../reset-password/README.md).
- Texts: `messages/en.json` and `pl.json` (namespace `forgotPassword`).
- Tests: component tests next to the code, mocked GraphQL through `renderWithProviders`; E2E in [`e2e/forgot-password`](../../../../e2e/forgot-password).

Docs: [forgot password page](../../../../docs/pages/04-forgot-password-page.md) · [backend auth module](../../../../backend/src/modules/auth/README.md)
