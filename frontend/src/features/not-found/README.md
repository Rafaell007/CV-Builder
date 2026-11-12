# Not found

The 404 screen: "Hmm...", a two-line message and GO BACK (S4.1, KAN-93). GO BACK goes to the previous page; when the tab has none (link opened in a new tab or typed in), it goes to `/`, which redirects to `/users`.

- Exports: `NotFoundScreen` (client component; texts come as props, because `app/global-not-found.tsx` has no language).
- `useGoBack` (inside the feature): uses `next/navigation`, not `@/shared/i18n`, so it also works without a language.
- Texts: `messages/` (`notFound` namespace), used by `app/[locale]/not-found.tsx`; `app/global-not-found.tsx` has the English texts inline.
- Used by: `app/[locale]/not-found.tsx` (unknown paths inside a language, via `[...rest]`) and `app/global-not-found.tsx` (paths without a language).
- Docs: [docs/pages/08-not-found-page.md](../../../../docs/pages/08-not-found-page.md); values in `docs/design-tokens.md` › Not found.
