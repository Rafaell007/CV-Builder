# PageState

What a list page shows instead of its content: a loading skeleton, an empty list, a search without results, or a failed request with a retry button.

- **Props:** `kind` (`loading` | `empty` | `no-results` | `error`), `onRetry`, `rows` (skeleton rows, default 5), optional `labels` (per page text, for example `No users found`).
- `empty` (no data exists) and `no-results` (the search matched nothing) are different states. Neither is an error. Only `error` is an alert.
- `onRetry` must repeat the failed GraphQL request (`refetch`). Keep the search, sort and page state in the page; this component does not touch them.
- The skeleton stops pulsing when the user prefers reduced motion.
- **Exports:** `PageState`, types `PageStateKind`, `PageStateLabels`, `PageStateProps`.

Used by: every list page, in place of a [DataTable](../DataTable/README.md). Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md) (Loading, Empty and Error State).
