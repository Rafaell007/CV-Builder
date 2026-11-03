# Testing

Helpers for component and hook tests (Vitest + React Testing Library, PLAN §11.1). Import them only from test files.

- `renderWithProviders(ui, { mocks, locale })`: renders inside the app's providers (`NextIntlClientProvider` with the real messages of `locale`, default `"en"`; `PreferencesProvider`; Apollo `MockedProvider` with the given `mocks`) and returns RTL's result plus `user`, a [user-event](https://testing-library.com/docs/user-event/intro) instance created before rendering. It imports `@/i18n/loadMessages` from the app layer: test helpers wrap the whole app, so they are the one exception to "shared never imports app code".
- Everything from `@testing-library/react` (`screen`, `within`, `act`, …) is re-exported, so a test needs one import.

Global setup (jest-dom matchers, cleanup after each test) lives in `frontend/vitest.setup.ts`.

Docs: [RTL custom render](https://testing-library.com/docs/react-testing-library/setup#custom-render), [Apollo testing](https://www.apollographql.com/docs/react/development-testing/testing).
