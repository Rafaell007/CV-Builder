# Pagination

The shared building blocks of every list query (PLAN.md §3).

- **Exports:** `ListArgs` (`search`, `sort`, `page`), `PageInput`, `SortInput`, `SortDirection`, `Paginated(Item)` (output `{ items, total }`), `toSkipTake`, `resolveSort`.
- **Limits:** page size 10 by default (the only default: every list query and the frontend use it), 100 at most. Search up to 100 characters, trimmed.
- **`sort: null`:** the argument is nullable, so a client may send `null`. `resolveSort` treats `null` and `undefined` like no sort and returns the default. (Until 2026-11-12 `null` threw a `TypeError` and the client got `INTERNAL_SERVER_ERROR`.) `search: null` is the same as no search.
- **Used by:** every list query. Example: [backend README](../../../README.md#1-make-a-list-query).
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)

## Contract changes (2026-11-12, KAN-128 PR)

These two changes touch `schema.gql` and every list query. The frontend side must know about them.

- **Default page size 20 → 10.** `PageInput.size` now has the default 10 (`size: Int! = 10`). The `projects` query shows it as `page: PageInput! = {number: 1, size: 10}`. A client that sent no `size` now gets 10 rows, not 20. The `cvs` query already had 10, so its own override (`CVS_PAGE_SIZE`) was removed: one default for all lists.
- **`sort: null` is accepted** and means no sort (see above). Before, it returned `INTERNAL_SERVER_ERROR`. The schema did not change for this fix, only the behaviour.
