import type * as i18n from "@/shared/i18n";

type Router = ReturnType<typeof i18n.useRouter>;

/**
 * Returns the `@/shared/i18n` module with `useRouter` replaced by a stub that has only the methods `getRouter`
 * returns. The real router needs the Next.js app router, which unit tests do not have. `getRouter` runs on every
 * `useRouter()` call, so it can read mocks declared later in the test file (`() => ({ push })`).
 *
 * Import it inside the mock factory: `vi.mock("@/shared/i18n", async (importOriginal) =>
 * (await import("@/shared/testing/withMockedRouter")).withMockedRouter(await importOriginal(), () => ({ push })))`.
 * Two rules, both because `renderWithProviders` imports `@/shared/i18n`, so the factory runs while the test
 * file is still loading its imports:
 * - Import it dynamically: a static import is not ready yet when the factory runs.
 * - It is not in the `@/shared/testing` index: importing that index inside the factory makes it wait for itself and hang.
 */
export function withMockedRouter(
  actual: typeof i18n,
  getRouter: () => Partial<Router>,
): typeof i18n {
  return { ...actual, useRouter: () => getRouter() as Router };
}
