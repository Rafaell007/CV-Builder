# DataTable

Table for a backend list page. It only renders; the page owns the query state (`search`, `sort`, `page`) and passes the `items` of the response as `rows`.

- **Columns:** `DataTableColumn<Row>` = `{ id, header, cell(row), sortField? }`. A column with `sortField` gets a sort button; the field name is the one the backend accepts.
- **Sorting:** `sort` and `onSortChange` use the backend `SortInput` shape (`{ field, direction: "ASC" | "DESC" }`). Clicks cycle: ASC → DESC → ASC (a new column starts at ASC; there is no "no sort" state, so the page passes the order it starts with, for example name ASC). The page resets to page 1 in `onSortChange`.
- **Hide a column:** `hideBelow` on a column (pixels). The column (header and cells) is left out when the window is narrower than that: `hideBelow: 1024` shows it from 1024px. CSS media queries cannot read a variable, so the table reads `window.innerWidth` and listens to `resize` (`useVisibleColumns`). The server renders every column, so a narrow screen shows the column for a moment until React takes over. Hidden columns do not count for the width of the detail line.
- **Detail line:** `renderRowDetail(row)` draws a second row under each row, as wide as the table (`colSpan`). Return `null` for a row without it. The detail row is a separate `tr`, so a page that finds a row by its text finds the main row without the detail text. The row click and the row hover apply to the main row only.
- **Row click:** `onRowClick`; rows are keyboard focusable (Enter or Space).
- **Row actions:** `renderRowActions(row)` renders a slot at the row end (button, menu). Clicks in it do not click the row.
- **Selection:** `selectable`, `selectedIds`, `onSelectionChange`. The header checkbox works on the rows of the current page; the selection of other pages stays.
- **States:** `loading` shows `loadingContent` in the body and keeps the header; `emptyContent` shows when there are no rows.
- **Texts:** the `labels` prop replaces the English defaults (a11y texts only; pass translated ones).

## Known issues

- **English texts only.** The defaults of `labels` (`Actions`, `Select all rows`, `Select row <id>`) are English because i18n (S0.6) was not in place when this was built. Every page must pass translated `labels`. The `loadingContent` and `emptyContent` slots are also the page's job.
- **Selection is not cleared by the table.** `selectedIds` stays when the page changes, and also when search or sort changes. The page decides when to clear it (for example after a delete or a new search). Rows that are no longer in the result stay in `selectedIds` until the page removes them.
- **Row click is not a link.** A clickable row has `tabIndex` but no link or button role. If a row opens a detail page, think about adding a real link in one cell for screen readers.
- **No "no sort" state (KAN-102).** A header click goes ASC → DESC → ASC, and `onSortChange` always gets a `SortState`. Only the Projects page uses the table today. When the Users or CVs page is built, check that it does not need to clear the sort. If it does, bring back `undefined` in `getNextSort` and `onSortChange` as an option.
- **Lookups are plain arrays.** `toggleId` and `getSelectAllState` in `utils/selection.utils.ts` use `includes()`. This is fine for 10 rows per page. Use a `Set` if the page size grows a lot. The row check in `DataTable.tsx` already uses a `Set`.

Used by: every list page (Users, CVs, …). Pair it with [Pagination](../Pagination/README.md). The Storybook story `Shared/DataTable → Sample` shows a table with mocked data. Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md).
