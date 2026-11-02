# Pagination

The shared building blocks of every list query (PLAN.md §3).

- **Exports:** `ListArgs` (`search`, `sort`, `page`), `PageInput`, `SortInput`, `SortDirection`, `Paginated(Item)` (output `{ items, total }`), `toSkipTake`, `resolveSort`.
- **Limits:** page size 20 by default, 100 at most. Search up to 100 characters, trimmed.
- **Used by:** every list query. Example: [backend README](../../../README.md#1-make-a-list-query).
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)
