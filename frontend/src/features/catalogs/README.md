# Catalogs

The `/admin/departments` and `/admin/positions` pages (PLAN S5.1, S5.2, KAN-96): the global lists of departments and positions, for Admin users. Each page lists, searches, sorts and pages on the backend, and creates, updates and deletes one item with a name only.

- Exports (`index.ts`): `Departments`, `Positions` (the page bodies).
- Texts: `messages/en.json`, `pl.json` (namespace `catalogs`). `departments` and `positions` have the same keys, so the shared parts take the namespace `catalogs.departments` or `catalogs.positions` (`CatalogNamespace`) and work for both.
- Shared by both catalogs (everything except the GraphQL wiring):
  - `catalogs.types.ts`: `CatalogNamespace`, `CatalogItem` (`id`, `name`), `CatalogNameFormValues`.
  - `catalogs.constants.ts`: `CATALOG_SORT_FIELDS`, `DEFAULT_CATALOG_SORT` (name ascending; the backend sorts by name only), `MAX_CATALOG_NAME_LENGTH` (100, as the backend), `CATALOG_SEARCH_MAX_LENGTH`.
  - `utils/`: `catalogNameSchema` (the name rules) and `isCatalogConflict` (a `CONFLICT` error: on create or update the name exists; on delete the item is in use).
  - Hooks: `useCatalogNameForm` (the form), `useCreateCatalogItemForm(ns, create)`, `useUpdateCatalogItemForm(ns, update)`, `useDeleteCatalogItem(ns, remove)`: they take the catalog's mutation function and show the toasts and error texts. Save is enabled only when the trimmed name differs from the original (`hasChanged`). A delete of an item in use keeps the confirmation open and shows the "in use" text inside it (`error`); other delete failures close it and show a toast.
  - Components: `CatalogTable` (the Name column, optional `extraColumns` and the row menu), `NameFormModal` (one-field modal, kind `create` or `update`), `DeleteCatalogItemModal`, `CatalogPage` (`ListPage` + table + the Delete modal; each catalog passes its Create/Update modals in `modals` and opens them via `onCreate`/`onEdit`; after the only row of a later page is deleted it goes back one page, and shows the loading state, not the empty state, in between).
- Per catalog (`components/Departments/`, `components/Positions/`, the same shape): `useDepartments` / `usePositions` (the list query through the shared `usePagedList`), `useCreateX`, `useUpdateX`, `useDeleteX` (each with its `.graphql` file), and `X.tsx`, which passes them to `CatalogPage`. Test data: `x.mocks.ts`, thin files over the shared factory `createCatalogMocks` (`catalogs.mocks.ts`, with its test).
- Used by: the routes `app/[locale]/(app)/admin/departments` and `admin/positions` (`PageHeader` + the page). E2E: `e2e/catalogs/`.
- Docs: [25-departments-page.md](../../../../docs/pages/25-departments-page.md), [26-positions-page.md](../../../../docs/pages/26-positions-page.md).
