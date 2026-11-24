# Sign in

The `/sign-in` page (PLAN S3.4, KAN-87): tabs, welcome text and the email + password form.

- Exports: `SignIn` (the whole page content; the route only renders it).
- Tabs: the shared `AuthTabs` (`@/shared/components/AuthTabs`), shared with the sign-up page.
- `components/SignInForm`: the form. `useSignInForm` holds the form state and the Zod rules (`utils`), `useSignIn` sends the `SignIn` mutation and opens `/users`.
- Errors: `UNAUTHENTICATED` shows "Invalid email or password" (the backend does not say which one was wrong); anything else, a throttled request too, shows "Something went wrong". Typed values stay in both cases. `useSignIn` reads the failure with `readFailure` (`shared/failures`, kind `unauthenticated`).
- The mutation is named `SignIn`, so the session link never tries to refresh the session for it ([session](../../shared/session/README.md)).
- Texts: `messages/` (`signIn` namespace, `en` and `pl`).
- Used by: `app/[locale]/(auth)/sign-in/page.tsx`. A signed-in user never sees the page: the proxy redirects to `/users`.
- To do (from KAN-92): after a good password reset, the reset-password page redirects here, but this page shows no "password changed" message. Add one when this page is next picked up (docs AC-22 of the reset password page).
- Docs: [docs/pages/02-sign-in-page.md](../../../../docs/pages/02-sign-in-page.md). E2E: `e2e/auth/sign-in.spec.ts`.
