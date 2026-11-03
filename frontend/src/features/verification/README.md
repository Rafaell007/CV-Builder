# Verification

The email verification page `/verify-email` (PLAN S3.6, KAN-90): the user types the 6-digit code, CONFIRM sends `verifyEmail`, RESEND CODE sends `resendVerificationCode` and runs a 60 s timer, LATER goes to `/users`.

- Exports: `VerifyEmail` (Client Component, the whole page).
- Logic: `useEmailVerification` (code, CONFIRM, redirects) and `useResendCode` (RESEND and the timer). `utils/` has the code check and the mapping of the backend `extensions.reason` to a message. The backend decides if a code is valid; the client only checks the format.
- A verified user is sent to `/users`; the same happens after a successful CONFIRM.
- Used by: `app/(auth)/verify-email/page.tsx`.

**Draft status:** `components/OtpFieldStub` stands in for the shared `OtpField` from S1.1b (KAN-78) and the buttons are plain elements until the S1.1a kit exists. When KAN-78 lands, import `OtpField` in `VerifyEmail.tsx`, check its props against `OtpFieldProps`, and delete the stub. Add the Zod/React Hook Form helpers then if wanted.

Tests: component tests next to the code, stories in `VerifyEmail/VerifyEmail.stories.tsx` (run as tests), and the browser spec `e2e/verification/verification.spec.ts`. The spec creates an unverified account with `signUp` (needs KAN-88 on the branch) and reads the code from Mailpit. Its `codeField` helper changes when the six-box OtpField arrives.

Docs: [verification page](../../../../docs/pages/06-verification-page.md) · backend: [auth module](../../../../backend/src/modules/auth/README.md)
