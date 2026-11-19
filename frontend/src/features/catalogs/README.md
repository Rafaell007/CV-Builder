# Catalogs

The `/admin/departments` and `/admin/positions` pages (PLAN S5.1, S5.2, KAN-96): the global lists of departments and positions, for Admin users. Each page lists, searches, sorts and pages on the backend, and creates, updates and deletes one item with a name only.

- Texts: `messages/en.json`, `pl.json` (namespace `catalogs`). `departments` and `positions` have the same keys, so the shared parts take the namespace `catalogs.departments` or `catalogs.positions` and work for both.
- Planned layout (KAN-96 steps 6–10):
  - `components/Departments/`, `components/Positions/`: each page on the shared `ListPage`, `DataTable` and `@/shared/lists`, with its hooks and `.graphql` files.
  - `components/NameFormModal/`: the one-field form modal for create and update, used by both pages.
  - `utils/`: the mapping of backend errors to texts (a `CONFLICT` on create or update = the name exists; on delete = the item is in use).
  - `catalogs.constants.ts`: the name limit (100 characters, as the backend).
- Used by: the routes `app/[locale]/(app)/admin/departments` and `admin/positions`.
- Docs: [25-departments-page.md](../../../../docs/pages/25-departments-page.md), [26-positions-page.md](../../../../docs/pages/26-positions-page.md).
