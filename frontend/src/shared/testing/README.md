# Testing

Helpers for component and hook tests (Vitest + React Testing Library, PLAN §11.1). Import them only from test files.

- `renderWithProviders(ui, { mocks })`: renders inside the app's providers (`PreferencesProvider`, Apollo `MockedProvider` with the given `mocks`) and returns RTL's result plus `user`, a [user-event](https://testing-library.com/docs/user-event/intro) instance created before rendering. The next-intl provider is added here in S0.6.
- Everything from `@testing-library/react` (`screen`, `within`, `act`, …) is re-exported, so a test needs one import.

Global setup (jest-dom matchers, cleanup after each test) lives in `frontend/vitest.setup.ts`.

Docs: [RTL custom render](https://testing-library.com/docs/react-testing-library/setup#custom-render), [Apollo testing](https://www.apollographql.com/docs/react/development-testing/testing).
