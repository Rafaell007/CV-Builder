# Sign up

The `/sign-up` page (PLAN S3.5, KAN-88): email, password and confirm password, validation, a loading state, and a redirect to `/verify-email` after the backend created the account, mailed the first code and signed the user in.

- Exports: `SignUpPage` (Server Component; `app/[locale]/(auth)/sign-up/page.tsx` renders it and sets the translated page title).
- `components/SignUpForm`: the form. `useSignUp` holds the state: a field shows its error after it was left or after a submit; the values stay when the request fails; the button stays locked until the page changes, so a request cannot be sent twice. `utils/` has `validateSignUp` (same rule as the backend `SignUpInput`: 8 to 128 characters, a letter and a digit, PLAN D33) and `toSignUpFailure` (`CONFLICT` with `reason: EMAIL_TAKEN` → "An account with this email already exists" under the email field). Both return message keys; `useSignUp` translates them.
- Tabs: the shared `AuthTabs` (`@/shared/components/AuthTabs`), shared with the sign-in page.
- Form controls (`TextField`, `PasswordField`, `Button`) come from the shared UI kit, `@/shared/components` (S1.1).
- Signed-in users never see this page: `src/proxy.ts` sends them to `/users` ([session README](../../shared/session/README.md)).
- Texts: `messages/en.json` and `pl.json` (namespace `signUp`). Links and the redirect use `Link` and `useRouter` from `@/shared/i18n`, so they keep the language.
- Tests: component tests next to the code, mocked GraphQL through `renderWithProviders`; E2E in [`e2e/sign-up`](../../../../e2e/sign-up).

Docs: [sign-up page](../../../../docs/pages/03-sign-up-page.md) · [backend auth module](../../../../backend/src/modules/auth/README.md)
