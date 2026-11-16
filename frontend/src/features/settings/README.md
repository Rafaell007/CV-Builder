# Settings

The `/settings` page (PLAN S4.4, KAN-94): the theme, the language and a password change for the signed-in user. Admin and User see the same page.

- Exports: `SettingsPage` (the whole page content; `app/[locale]/(app)/settings/page.tsx` only renders it).
- Theme and language stay in the browser: `usePreferences()` (`@/shared/preferences`, cookie, D5) and `useLanguage()` (`@/shared/i18n`, URL and cookie, D32). No backend request, so no loading state (AC-50). Only the supported languages are offered: `en`, `pl` (D27), each in its own name.
- Password change: the backend `changePassword(input: { currentPassword, newPassword })` mutation (see the [backend auth module](../../../../backend/src/modules/auth/README.md)). The confirm field is checked only in the frontend. After a change, the other sessions end and this one keeps working with new cookies.
- Texts: `messages/en.json` and `pl.json` (namespace `settings`).
- Status: scaffold only (header). The preferences, the form and the layout come in the next KAN-94 steps.

Docs: [settings page](../../../../docs/pages/15-settings-page.md)
