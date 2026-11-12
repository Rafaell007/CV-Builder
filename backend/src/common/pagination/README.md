# Pagination

The shared building blocks of every list query (PLAN.md §3).

- **Exports:** `ListArgs` (`search`, `sort`, `page`), `PageInput`, `SortInput`, `SortDirection`, `Paginated(Item)` (output `{ items, total }`), `toSkipTake`, `resolveSort`.
- **Limits:** page size 20 by default, 100 at most. Search up to 100 characters, trimmed.
- **Known issue: `sort: null` crashes every list query.** `sort` is a nullable argument, so a client may send `null`. `resolveSort` in `pagination.utils.ts` checks `sort === undefined` only, so `null.field` throws a `TypeError` and the client gets `INTERNAL_SERVER_ERROR`. Found with `projects(page: {...}, sort: null)` on 2026-11-12; leaving `sort` out works, and `search: null` works. Fix: accept `null` in `resolveSort` (and type `ListArgs.sort` as `SortInput | null`), then add a test in `pagination.utils.spec.ts`. Until then the frontend leaves `sort` out when there is none (`frontend/src/features/projects/Projects/utils`).
- **Used by:** every list query. Example: [backend README](../../../README.md#1-make-a-list-query).
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)
