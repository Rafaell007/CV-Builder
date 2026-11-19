/** The texts of one catalog page in `messages/` (namespace `catalogs`). Both have the same keys, so a shared part takes either one. */
export type CatalogNamespace = "catalogs.departments" | "catalogs.positions";

/** What a shared catalog part needs from one row: the id and the name. Departments and positions both have this shape. */
export interface CatalogItem {
  id: string;
  name: string;
}

/** What the one-field name form (Create and Update) holds while the user types. */
export interface CatalogNameFormValues {
  name: string;
}
