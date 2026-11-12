# PageHeader

The sticky bar at the top of every signed-in page: the [Breadcrumbs](../Breadcrumbs/Breadcrumbs.tsx) and the page's `<h1>`.

- **Props:** `title` (page name), `breadcrumbs` (items, the last one is the current page), `breadcrumbsLabel` (translated name of the navigation).
- Figma shows no page title, so the `<h1>` is visually hidden: screen readers still get one heading per page.
- Each page renders its own `PageHeader`, because only the page knows its trail (for example the user's name).
- Server Components import it by folder: `@/shared/components/PageHeader`.
- **Exports:** `PageHeader`, type `PageHeaderProps`.

Used by: every page in `app/[locale]/(app)/`. Values: [docs/design-tokens.md](../../../../../docs/design-tokens.md) › App shell › Header and content.
