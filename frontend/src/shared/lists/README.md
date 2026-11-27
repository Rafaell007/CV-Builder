# Lists

Shared logic for list pages where the backend searches, sorts and cuts the pages (PLAN D19: 10 rows a page).
Nothing here filters or sorts in the frontend.

- `ListState`: what the user chose: `search`, `sort` and `page`.
- `useListState(initialSort)`: holds that state. It starts with `initialListState(initialSort)`: no search,
  `initialSort` and page 1. A new search or a new sort goes back to page 1. The same search again, also with other
  spaces around it, keeps the page (the query sends the trimmed text). `initialSort` is read only on the first render.
- `firstPageVariables(sort)`: the variables of the first request of a list page (`toListVariables` of
  `initialListState`). A route prefetches them on the server with `PrefetchQuery` (`@/shared/apollo/server`, PLAN D6),
  so the page's first `useQuery` finds the answer in the cache. A test checks that `useListState` starts with them.
  The utils import `Pagination` from its folder, not the `shared/components` barrel, because Server Components call
  them.
- `toListVariables(state)`: the query variables (`ListVariables`). It always sends `page: { number, size: 10 }` and
  the sort, trims the search and leaves out an empty search. The page size 10 is one rule: the backend default
  (`DEFAULT_PAGE_SIZE` in `common/pagination`) and the frontend `DEFAULT_PAGE_SIZE` (`Pagination`) are both 10, and a
  test checks the size that is sent.
- `usePagedList(query, variables, selectPage)`: sends a list query and returns `items`, `total`, `loading`, `failed`
  and `retry`. `selectPage` picks `{ items, total }` out of the result (`PagedResult`), for example
  `(data) => data.projects`. `failed` hides the list, so a failed request never looks like an empty list. `total`
  keeps the last value while the next page loads, so the page buttons do not jump. `retry` sends the same request.
  A feature hook wraps it and names the rows (`useProjects` returns `projects`).
- Used by: the list pages (`features/projects`, `features/cvs`, `features/users`, `features/catalogs`) and their
  routes (`firstPageVariables` through each feature's first-page constant).
