# Pagination

Page buttons for a backend list: previous, next, page numbers and `…` for hidden pages (page 5 of 10 → `1 … 4 5 6 … 10`).

- **Props:** `page` (starts at 1), `total` (the `total` of the list response), `pageSize` (default `DEFAULT_PAGE_SIZE` = 10, PLAN D19), `onPageChange`, optional `labels`.
- Renders nothing when all rows fit on one page. The current page has `aria-current="page"`.
- The backend default page size is 20, so a list query must send `page: { number, size: DEFAULT_PAGE_SIZE }`.
- The page resets to 1 when search or sort changes; that is the job of the page, not of this component.
- **Exports:** `Pagination`, `DEFAULT_PAGE_SIZE`, `getPageCount`.

Used by: every list page, under a [DataTable](../DataTable/README.md). Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md) (Pagination).
