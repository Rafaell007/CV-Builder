# Verification

The email verification page `/verify-email` (PLAN S3.6, KAN-90): the user types the 6-digit code, CONFIRM sends `verifyEmail`, RESEND CODE sends `resendVerificationCode` and runs a 60 s timer, LATER goes to `/users`.

- Exports: `VerifyEmail` (Client Component, the whole page).
- Logic: `useEmailVerification` (code, CONFIRM, redirects) and `useResendCode` (RESEND and the timer). `utils/` has the code check and the mapping of the backend `extensions.reason` to a message. The backend decides if a code is valid; the client only checks the format.
- A verified user is sent to `/users`; the same happens after a successful CONFIRM.
- Used by: `app/(auth)/verify-email/page.tsx`.

**Draft status:** `components/OtpFieldStub` stands in for the shared `OtpField` from S1.1b (KAN-78) and the buttons are plain elements until the S1.1a kit exists. When KAN-78 lands, import `OtpField` in `VerifyEmail.tsx`, check its props against `OtpFieldProps`, and delete the stub. Add the Zod/React Hook Form helpers then if wanted.

Tests: component tests next to the code, stories in `VerifyEmail/VerifyEmail.stories.tsx` (run as tests), and the browser spec `e2e/verification/verification.spec.ts`. The spec creates an unverified account with `signUp` (needs KAN-88 on the branch) and reads the code from Mailpit. Its `codeField` helper changes when the six-box OtpField arrives.

Docs: [verification page](../../../../docs/pages/06-verification-page.md) · backend: [auth module](../../../../backend/src/modules/auth/README.md)

## Before the pull request (delete this section when every box is ticked)

KAN-90 is a draft on mocked inputs. Read this list before the last commit.

- [ ] **KAN-88 is merged into `development`.** The E2E spec creates its account with `signUp`, which exists only on the KAN-88 branch. Merge `development` into this branch, then run `pnpm test:e2e` (needs Docker). `e2e/support/mailpit.ts` is the same file as in KAN-88.
- [ ] **KAN-78 (S1.1b) is merged.** Replace the import in `VerifyEmail/VerifyEmail.tsx`, compare the real props with `OtpFieldProps`, delete `components/OtpFieldStub.tsx` and its stylesheet, and update the `codeField` helper in `e2e/verification/verification.spec.ts` for the six-box field (paste and auto-advance).
- [ ] **S1.1a (Button) is merged.** The buttons and the LATER link are plain elements here. Replace them with the shared ones.
- [ ] **Red text in dark theme.** LATER and RESEND CODE use the normal text colour, because red text has a contrast of 2.5:1 on the dark background (the check needs 4.5:1). This differs from Figma. Ask the designer, or let the shared Button decide.
- [ ] **Zod and React Hook Form.** The 6-digit check is a small function in `utils/`. If KAN-78 adds the form helpers, decide whether to move the check into a Zod schema.
- [ ] **Texts are plain English.** Move them to `messages/` when i18n (S0.6) exists.
- [ ] **Look at the page by hand.** Run `pnpm dev`, open `/verify-email` and compare it with `docs/images/06-verification-page.jpg`, in light and dark theme. Nobody has done this yet.
- [ ] **Verified users.** The page redirects a verified user on the client. Check that the proxy from S3.2 does the same on the server; if it does, the client check is only a fallback.
- [ ] **`PLAN.md`.** Tick S3.6 when all boxes above are done, and add the progress-log line.

Known limits (not bugs): the resend timer shows 60 s even if the backend limit changes; the backend decides, and its answer restarts the timer. The E2E spec cannot test a successful resend, because the backend allows one new code per 60 s.
