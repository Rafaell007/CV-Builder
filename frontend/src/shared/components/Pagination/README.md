# Pagination

Page buttons for a backend list: previous, next, page numbers and `…` for hidden pages (page 5 of 10 → `1 … 4 5 6 … 10`).

- **Props:** `page` (starts at 1), `total` (the `total` of the list response), `pageSize` (default `DEFAULT_PAGE_SIZE` = 10, PLAN D19), `onPageChange`, optional `labels`.
- Renders nothing when all rows fit on one page. The current page has `aria-current="page"`.
- The backend default page size is 20, so a list query must send `page: { number, size: DEFAULT_PAGE_SIZE }`.
- The page resets to 1 when search or sort changes; that is the job of the page, not of this component.
- **Exports:** `Pagination`, `DEFAULT_PAGE_SIZE`, `getPageCount`.

## Known issues

- **Page size 10 against backend default 20.** If a list query forgets `page: { number, size: DEFAULT_PAGE_SIZE }`, the backend returns 20 rows and the page numbers are wrong. No list page exists yet, so nothing checks this. The first list page (Users) must send the size, and a test should cover it.
- **English texts only.** The defaults of `labels` are English (S0.6 i18n was missing). Pages must pass translated `labels`. The arrows `‹` and `›` are fixed characters and have the translated `aria-label`.
- **Out-of-range page.** If `page` is bigger than the page count (for example after a delete on the last page), the component shows the last page as current but does not call `onPageChange`. The page must correct its own state, or the list query asks for an empty page.
- **No page-size selector and no "go to page" field.** They are not in the designs, so they are not built.

Used by: every list page, under a [DataTable](../DataTable/README.md). Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md) (Pagination).
