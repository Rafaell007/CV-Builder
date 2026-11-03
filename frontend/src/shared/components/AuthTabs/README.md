# AuthTabs

The SIGN IN / SIGN UP links at the top of the two auth pages. Texts come in through props, so each page passes its own translations.

- Exports: `AuthTabs`, `AuthTabsProps`.
- Import it from `@/shared/components/AuthTabs`, not from the `@/shared/components` barrel. It has no hooks, so it works in a Server Component page, but the barrel also loads components that need a Client Component (Avatar, Menu, ...) and the build fails.
- Used by: `features/sign-in`, `features/sign-up`.
- Docs: [sign-in](../../../../../docs/pages/02-sign-in-page.md).
