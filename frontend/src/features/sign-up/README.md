# Sign up

The `/sign-up` page (PLAN S3.5, KAN-88): email, password and confirm password, validation, a loading state, and a redirect to `/verify-email` after the backend created the account, mailed the first code and signed the user in.

- Exports: `SignUpPage` (Server Component; `app/(auth)/sign-up/page.tsx` renders it).
- `components/SignUpForm`: the form. `useSignUp` holds the state: a field shows its error after it was left or after a submit; the values stay when the request fails; the button stays locked until the page changes, so a request cannot be sent twice. `utils/` has the messages, `validateSignUp` (same rule as the backend `SignUpInput`: 8 to 128 characters, a letter and a digit, PLAN D33) and `toSignUpFailure` (`CONFLICT` → "An account with this email already exists" under the email field).
- `components/AuthTabs`: the SIGN IN / SIGN UP links. The sign-in page (S3.4) will reuse them.
- `SignUpForm/components/{Button,TextField,PasswordField}`: the minimum form controls this page needs. They move to the shared UI kit when S1.1 is built, and the sign-in page will use them too.
- Signed-in users never see this page: `src/proxy.ts` sends them to `/users` ([session README](../../shared/session/README.md)). The messages are English text until i18n (S0.6).
- Tests: component tests next to the code, mocked GraphQL through `renderWithProviders`; E2E in [`e2e/sign-up`](../../../../e2e/sign-up).

Docs: [sign-up page](../../../../docs/pages/03-sign-up-page.md) · [backend auth module](../../../../backend/src/modules/auth/README.md)
