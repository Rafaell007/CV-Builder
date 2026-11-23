import { CATALOG_SORT_FIELDS } from "../../catalogs.constants";

/** Backend sort fields of the `languages` query: the name (like every catalog) and the ISO code. */
export const LANGUAGE_SORT_FIELDS = {
  ...CATALOG_SORT_FIELDS,
  iso: "iso",
} as const;
