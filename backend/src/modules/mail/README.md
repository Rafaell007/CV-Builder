# Mail module

Sends the application's emails with Nodemailer. Locally, Mailpit catches them: open http://localhost:8025 (`docker compose up -d`).

- **Exports:** `MailModule`, `MailService`.
- **`MailService`:** `sendVerificationCode(to, code)` and `sendPasswordReset(to, token)`. Both reject when the SMTP server fails, so the caller decides what to do. Neither logs the content, because it holds codes and reset links.
- **Templates:** `templates/` holds one pure function per mail. Each returns `{ subject, text, html }`. The code is valid for 10 minutes, the reset link for 1 hour (D20). The reset link is `FRONTEND_URL/reset-password?token=...`.
- **Config:** `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (see `.env.example`). The defaults reach Mailpit. `SMTP_USER` and `SMTP_PASS` are used only when both are set.
- **Used by:** nothing yet. Sign-up (S3.5), verification (S3.6) and forgot password (S3.7) will import `MailModule`.
- **Tests:** `*.spec.ts` use a mocked transport. `backend/test/mail.int-spec.ts` sends real mail to Mailpit and reads it back from the Mailpit API (needs `docker compose up -d`; CI starts Mailpit as a service).
- **Docs:** [verification page](../../../../docs/pages/06-verification-page.md) · [forgot-password page](../../../../docs/pages/04-forgot-password-page.md) · [PLAN.md §9 S3.3](../../../../PLAN.md)
