# Lists

Shared logic for list pages where the backend searches, sorts and cuts the pages (PLAN D19: 10 rows a page).
Nothing here filters or sorts in the frontend.

- `ListState`: what the user chose: `search`, `sort` and `page`.
- `useListState(initialSort)`: holds that state. It starts with no search, `initialSort` and page 1. A new search or a
  new sort goes back to page 1. The same search again, also with other spaces around it, keeps the page (the query
  sends the trimmed text). `initialSort` is read only on the first render.
- Used by: `features/projects` (and the Departments and Positions pages, KAN-96).
