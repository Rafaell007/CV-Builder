# SearchField

Search input with a debounced `onSearch`, for the list pages' headers (users, CVs, catalogs).

- Export: `SearchField` (props: `<input>` props + `label` (accessible name; there is no visible label), `onSearch`, `debounceMs` (default 300)).
- Uncontrolled: pass the current search (e.g. from the URL) as `defaultValue`. `onSearch` fires 300ms after typing stops, at once on Enter (not while an input method is composing, and a form around the field is not submitted), and with `""` when cleared.
- The page owns the rest: running the query on the backend and going back to page 1 when the search changes ([10-users-page › Search](../../../../../docs/pages/10-users-page.md)).
- `useDebouncedCallback` (inside this folder) does the delay; move it to `shared/hooks/` when another feature needs it.
