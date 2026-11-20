import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DataTable, Menu, type DataTableColumn, type SortState } from "@/shared/components";
import { CATALOG_SORT_FIELDS } from "../../catalogs.constants";
import type { CatalogItem, CatalogNamespace } from "../../catalogs.types";
import styles from "./CatalogTable.module.css";

export interface CatalogTableProps<T extends CatalogItem> {
  /** Which catalog's texts to show: `catalogs.departments` or `catalogs.positions`. */
  namespace: CatalogNamespace;
  items: readonly T[];
  /** The backend sort. The table only shows it and reports a click on a header. */
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
  /** More columns after Name (Skills: Type, Category). Departments and Positions have none. */
  extraColumns?: DataTableColumn<T>[];
  /** Called with the item when the user selects Edit in its row menu. */
  onEdit: (item: T) => void;
  /** Called with the item when the user selects Delete in its row menu. */
  onDelete: (item: T) => void;
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/** One catalog as a table: the name, sorted on the backend, and a row menu with Edit and Delete. */
export function CatalogTable<T extends CatalogItem>({
  namespace,
  items,
  sort,
  onSortChange,
  extraColumns = [],
  onEdit,
  onDelete,
  loading,
  loadingContent,
  emptyContent,
}: CatalogTableProps<T>) {
  const t = useTranslations(namespace);

  const columns: DataTableColumn<T>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortField: CATALOG_SORT_FIELDS.name,
      cell: (item) => <span className={styles.name}>{item.name}</span>,
    },
    ...extraColumns,
  ];

  return (
    <DataTable
      label={t("table")}
      columns={columns}
      rows={items}
      getRowId={(item) => item.id}
      sort={sort}
      onSortChange={onSortChange}
      renderRowActions={(item) => (
        <Menu
          label={t("actions.menu", { name: item.name })}
          items={[
            { label: t("actions.edit"), onSelect: () => onEdit(item) },
            { label: t("actions.delete"), onSelect: () => onDelete(item), destructive: true },
          ]}
        />
      )}
      labels={{ actions: t("actions.column") }}
      loading={loading}
      loadingContent={loadingContent}
      emptyContent={emptyContent}
    />
  );
}
