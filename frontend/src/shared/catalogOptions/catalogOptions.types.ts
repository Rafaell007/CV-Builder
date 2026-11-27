/** One option of the Department or Position select. */
export type CatalogOption = { id: string; name: string };

/** What both options hooks return, so a select can show the options, a loading state, or an error with Retry. */
export type UseCatalogOptionsResult = {
  /** Every item of the catalog, by name. `undefined` while loading, after a failure and while disabled. */
  options: readonly CatalogOption[] | undefined;
  loading: boolean;
  /** True when the request failed. */
  failed: boolean;
  /** Sends the request again. */
  retry: () => void;
};
