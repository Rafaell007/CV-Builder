# i18n

Languages with [next-intl](https://next-intl.dev): `en` and `pl`, both fully translated (PLAN D27). The language is the first URL segment (`/en/users`, `/pl/users`); the `locale` cookie remembers the last one for a year (PLAN D32).

## Exports

- `routing`: languages, default `en`, `localePrefix: "always"`, the `locale` cookie.
- `Link`, `redirect`, `useRouter`, `usePathname`, `getPathname`: Next.js navigation that keeps the current language. Use them instead of `next/link` and `next/navigation` for app links.
- `useLanguage()`: `{ language, languages, setLanguage }` for the language selector (Settings, S4.4).
- `splitLocale(pathname)`: `"/pl/users"` → `{ locale: "pl", path: "/users" }`.
- `messages/en.json`, `pl.json`: the `common` namespace (texts shared by unrelated features).

The proxy and `shared/session` import `@/shared/i18n/routing` and `@/shared/i18n/utils` directly, not this entry: its navigation loads the request config (`next/root-params`), which the proxy cannot import.

The request config is `src/i18n/request.ts`. next-intl finds it by that path, so it is not a folder, and its test `src/i18n/request.test.ts` stays beside it (an exception to the folder rule of `frontend/AGENTS.md`). The test checks that a known language gives its messages and an unknown one gives a 404.

## How a language change works

1. `setLanguage("pl")` opens the same page under the new language: `/en/settings` → `/pl/settings`.
2. The proxy (`src/server/session/handleRequest`) runs next-intl's middleware: it saves `pl` in the `locale` cookie, then the session rules run on the path without the language. Their redirects keep it (`/pl/sign-in`).
3. Next.js serves the Polish build of the page; texts come from the `pl` messages.
4. A link without a language (`/users`) is redirected to the saved one (`/pl/users`).

## Translating a component

- Client or non-async component: `const t = useTranslations("users"); t("actions.menu", { name })`.
- Async Server Component: `const t = await getTranslations("users")` from `next-intl/server`.
- Keys are typed from the English files (`src/i18n/next-intl.d.ts`), so a wrong key fails typecheck.

## Adding messages for a feature

1. Create `features/<feature>/messages/en.json` and `pl.json` with the same keys.
2. Register the folder in `src/i18n/loadMessages/loadMessages.ts` (type + both loaders). Its namespace is the feature name.
3. The `loadMessages` test fails if the two languages have different keys.

`loadMessages` imports each `messages/<lang>.json` directly (an allowed exception to the `index.ts` rule), so a request loads only its own language. An `index.ts` would make the server load every language on each render.

## Where the rest lives

- `src/i18n/request.ts`: next-intl's request config (its default path): the locale from the `[locale]` segment via `next/root-params`, unknown ones are a 404.
- `app/[locale]/layout.tsx`: `<html lang>`, `NextIntlClientProvider`, one static build per language (`generateStaticParams`).
- Tests: `renderWithProviders(ui, { locale: "pl" })`. Storybook: the Language toolbar or `globals: { locale: "pl" }`.

Docs: [routing](https://next-intl.dev/docs/routing/configuration) · [middleware](https://next-intl.dev/docs/routing/middleware) · [navigation](https://next-intl.dev/docs/routing/navigation) · [root params](https://next-intl.dev/blog/nextjs-root-params) · [messages](https://next-intl.dev/docs/usage/configuration#messages) · [TypeScript](https://next-intl.dev/docs/workflows/typescript)
