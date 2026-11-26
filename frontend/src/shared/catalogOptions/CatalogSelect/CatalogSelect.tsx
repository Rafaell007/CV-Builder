import type { Ref } from "react";
import { Button, Select } from "@/shared/components";
import type { UseCatalogOptionsResult } from "../catalogOptions.types";
import styles from "./CatalogSelect.module.css";

export interface CatalogSelectProps {
  /** On the trigger, so React Hook Form can focus the field (`field.ref`). */
  ref?: Ref<HTMLButtonElement>;
  name?: string;
  label: string;
  /** The options hook's result (`useDepartmentOptions`, `useSuspensePositionOptions`, …). */
  catalog: UseCatalogOptionsResult;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  /** Shows the value but never opens (another employee's profile). */
  readOnly?: boolean;
  /** Default true. False on a read-only form, where nothing can be filled in. */
  required?: boolean;
  /** Helper text while the options load. */
  loadingText: string;
  /** The error when the options failed to load. */
  failedText: string;
  /** The button that loads the options again. */
  retryLabel: string;
}

/** A Department or Position select (required by default): disabled while its options load, an error and Retry when they failed. */
export function CatalogSelect({
  catalog,
  required = true,
  error,
  loadingText,
  failedText,
  retryLabel,
  ...selectProps
}: CatalogSelectProps) {
  const options = (catalog.options ?? []).map(({ id, name }) => ({ value: id, label: name }));

  return (
    <div className={styles.catalogSelect}>
      <Select
        {...selectProps}
        options={options}
        required={required}
        disabled={catalog.loading || catalog.failed}
        helperText={catalog.loading ? loadingText : undefined}
        error={catalog.failed ? failedText : error}
      />
      {catalog.failed && (
        <Button variant="secondary" onClick={catalog.retry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
