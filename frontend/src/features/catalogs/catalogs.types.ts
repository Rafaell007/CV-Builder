/**
 * The texts of one catalog page in `messages/` (namespace `catalogs`). All have the same keys (skills add a few for
 * their Type and Category, languages for ISO and Native name), so a shared part takes any of them.
 */
export type CatalogNamespace =
  "catalogs.departments" | "catalogs.positions" | "catalogs.skills" | "catalogs.languages";

/** What a shared catalog part needs from one row: the id and the name. Departments, positions, skills and languages all have this shape. */
export interface CatalogItem {
  id: string;
  name: string;
}

/** What the one-field name form (Create and Update) holds while the user types. */
export interface CatalogNameFormValues {
  name: string;
}
