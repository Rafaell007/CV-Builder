# DataTable

Table for a backend list page. It only renders; the page owns the query state (`search`, `sort`, `page`) and passes the `items` of the response as `rows`.

- **Columns:** `DataTableColumn<Row>` = `{ id, header, cell(row), sortField? }`. A column with `sortField` gets a sort button; the field name is the one the backend accepts.
- **Sorting:** `sort` and `onSortChange` use the backend `SortInput` shape (`{ field, direction: "ASC" | "DESC" }`). Clicks cycle: none → ASC → DESC → none. The page resets to page 1 in `onSortChange`.
- **Row click:** `onRowClick`; rows are keyboard focusable (Enter or Space).
- **Row actions:** `renderRowActions(row)` renders a slot at the row end (button, menu). Clicks in it do not click the row.
- **Selection:** `selectable`, `selectedIds`, `onSelectionChange`. The header checkbox works on the rows of the current page; the selection of other pages stays.
- **States:** `loading` shows `loadingContent` in the body and keeps the header; `emptyContent` shows when there are no rows.
- **Texts:** the `labels` prop replaces the English defaults (a11y texts only; pass translated ones).

Used by: every list page (Users, CVs, …). Pair it with [Pagination](../Pagination/README.md). The Storybook story `Shared/DataTable → Sample` shows a table with mocked data. Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md).
