# Pagination

The shared building blocks of every list query (PLAN.md §3).

- **Exports:** `ListArgs` (`search`, `sort`, `page`), `PageInput`, `SortInput`, `SortDirection`, `Paginated(Item)` (output `{ items, total }`), `toSkipTake`, `resolveSort`.
- **Limits:** page size 20 by default, 100 at most. Search up to 100 characters, trimmed.
- **`sort: null`:** the argument is nullable, so a client may send `null`. `resolveSort` treats `null` and `undefined` like no sort and returns the default. (Until 2026-11-12 `null` threw a `TypeError` and the client got `INTERNAL_SERVER_ERROR`.) `search: null` is the same as no search.
- **Used by:** every list query. Example: [backend README](../../../README.md#1-make-a-list-query).
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)
