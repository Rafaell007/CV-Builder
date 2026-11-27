import { CATALOG_SORT_FIELDS } from "../../catalogs.constants";

/** Backend sort fields of the `languages` query: the name (like every catalog) and the ISO code. */
export const LANGUAGE_SORT_FIELDS = {
  ...CATALOG_SORT_FIELDS,
  iso: "iso",
} as const;

/** The longest ISO code the form and the backend allow. */
export const MAX_LANGUAGE_ISO_LENGTH = 5;

/** An ISO code as the backend accepts it: uppercase letters A-Z with one optional hyphen inside ("EN", "PT-BR"). */
export const LANGUAGE_ISO_PATTERN = /^[A-Z]+(-[A-Z]+)?$/;

/** `extensions.reason` of a `CONFLICT` when the ISO code is taken (without it, the name is taken). */
export const ISO_TAKEN_REASON = "ISO_TAKEN";
