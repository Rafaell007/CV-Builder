// Public entry for the Department and Position options (and their select) of the user forms. Client Components only.
export { CatalogSelect } from "./CatalogSelect";
export type { CatalogSelectProps } from "./CatalogSelect";
export type { CatalogOption, UseCatalogOptionsResult } from "./catalogOptions.types";
export { useDepartmentOptions, usePositionOptions } from "./useCatalogOptions";
export {
  useSuspenseDepartmentOptions,
  useSuspensePositionOptions,
} from "./useSuspenseCatalogOptions";
