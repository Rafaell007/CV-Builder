# Testing

Helpers for component and hook tests (Vitest + React Testing Library, PLAN §11.1). Import them only from test files.

- `renderWithProviders(ui, { mocks, locale })`: renders inside the app's providers (`NextIntlClientProvider` with the real messages of `locale`, default `"en"`; `PreferencesProvider`; Apollo `MockedProvider` with the given `mocks`) and returns RTL's result plus `user`, a [user-event](https://testing-library.com/docs/user-event/intro) instance created before rendering. It imports `@/i18n/loadMessages` from the app layer: test helpers wrap the whole app, so they are the one exception to "shared never imports app code".
- Everything from `@testing-library/react` (`screen`, `within`, `act`, …) is re-exported, so a test needs one import.
- `withMockedRouter(actual, () => router)` (own entry `@/shared/testing/withMockedRouter`): returns the `@/shared/i18n` module with `useRouter` replaced by a stub that has only the methods you return (`() => ({ push })`). Use it in the mock factory: `vi.mock("@/shared/i18n", async (importOriginal) => (await import("@/shared/testing/withMockedRouter")).withMockedRouter(await importOriginal(), () => ({ push })))`. Import it **dynamically** and **not** from the `@/shared/testing` index: `renderWithProviders` imports `@/shared/i18n`, so a static import is not ready when the factory runs, and the index makes the factory wait for itself (the test hangs).

Global setup (jest-dom matchers, cleanup after each test) lives in `frontend/vitest.setup.ts`.

Docs: [RTL custom render](https://testing-library.com/docs/react-testing-library/setup#custom-render), [Apollo testing](https://www.apollographql.com/docs/react/development-testing/testing).

## Known issues (KAN-122 review, PR #99)

- Four tests still mock the router by hand, because they replace a different module and also stub `usePathname`: `SettingsPage.test.tsx` and `PreferencesFields.test.tsx` (`@/shared/i18n/navigation`), `useLanguage.test.tsx` (`../navigation`) and `useGoBack.test.ts` (`next/navigation`). Move them to a helper if a second stub for `usePathname` is needed.
