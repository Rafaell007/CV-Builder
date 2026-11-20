# Testing

Helpers for component and hook tests (Vitest + React Testing Library, PLAN §11.1). Import them only from test files.

- `renderWithProviders(ui, { mocks, locale })`: renders inside the app's providers (`NextIntlClientProvider` with the real messages of `locale`, default `"en"`; `PreferencesProvider`; Apollo `MockedProvider` with the given `mocks`) and returns RTL's result plus `user`, a [user-event](https://testing-library.com/docs/user-event/intro) instance created before rendering. It imports `@/i18n/loadMessages` from the app layer: test helpers wrap the whole app, so they are the one exception to "shared never imports app code".
- Everything from `@testing-library/react` (`screen`, `within`, `act`, …) is re-exported, so a test needs one import.

## Known issues (KAN-122 review, PR #99)

- The `vi.mock(import("@/shared/i18n"), …)` block that replaces `useRouter` is copied into about 15 test files (for example `SignIn.test.tsx`, `SignUpPage.test.tsx`, `SettingsPage.test.tsx`). Some copies use a different stub. If the form hooks use other router methods, every copy needs its own edit. When a helper is added here (for example `withMockedRouter(actual)` called from inside the `vi.mock` factory), move all copies to it in one change.

Global setup (jest-dom matchers, cleanup after each test) lives in `frontend/vitest.setup.ts`.

Docs: [RTL custom render](https://testing-library.com/docs/react-testing-library/setup#custom-render), [Apollo testing](https://www.apollographql.com/docs/react/development-testing/testing).
