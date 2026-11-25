// Public entry for the Department and Position options of the user forms. Client Components only.
export type { CatalogOption, UseCatalogOptionsResult } from "./catalogOptions.types";
export { useDepartmentOptions, usePositionOptions } from "./useCatalogOptions";
export {
  useSuspenseDepartmentOptions,
  useSuspensePositionOptions,
} from "./useSuspenseCatalogOptions";
