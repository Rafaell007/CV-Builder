/**
 * The texts of one catalog page in `messages/` (namespace `catalogs`). All have the same keys (skills add a few for
 * their Type and Category), so a shared part takes any of them.
 */
export type CatalogNamespace = "catalogs.departments" | "catalogs.positions" | "catalogs.skills";

/** What a shared catalog part needs from one row: the id and the name. Departments, positions and skills all have this shape. */
export interface CatalogItem {
  id: string;
  name: string;
}

/** What the one-field name form (Create and Update) holds while the user types. */
export interface CatalogNameFormValues {
  name: string;
}
