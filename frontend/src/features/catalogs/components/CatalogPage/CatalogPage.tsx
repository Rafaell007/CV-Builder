import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import {
  ListPage,
  PageState,
  Pagination,
  SearchField,
  type DataTableColumn,
  type PageStateLabels,
} from "@/shared/components";
import type { UsePagedListResult, UseListStateResult } from "@/shared/lists";
import { CATALOG_SEARCH_MAX_LENGTH } from "../../catalogs.constants";
import type { CatalogItem, CatalogNamespace } from "../../catalogs.types";
import type { UseDeleteCatalogItemResult } from "../../useDeleteCatalogItem";
import { CatalogTable } from "../CatalogTable";
import { DeleteCatalogItemModal } from "../DeleteCatalogItemModal";

export interface CatalogPageProps<T extends CatalogItem> {
  /** Which catalog's texts to show: `catalogs.departments`, `catalogs.positions` or `catalogs.skills`. */
  namespace: CatalogNamespace;
  /** The search, sort and page the user chose (`useListState`). */
  list: UseListStateResult;
  /** One page of the catalog from the backend (`useDepartments`, `usePositions`, `useSkills`). */
  query: UsePagedListResult<T>;
  /** More table columns after Name (Skills: Type, Category). */
  extraColumns?: DataTableColumn<T>[];
  /** Called when the user clicks the create button: opens the catalog's Create modal. */
  onCreate: () => void;
  /** Called with the item when the user selects Edit in its row menu: opens the catalog's Update modal. */
  onEdit: (item: T) => void;
  deletion: UseDeleteCatalogItemResult;
  /** The catalog's own Create and Update modals (Departments, Positions: `NameFormModal`; Skills: `SkillFormModal`). */
  modals: ReactNode;
}

/**
 * The content of a catalog page under its `PageHeader` (Departments, Positions): the shared `ListPage` with search,
 * the sortable table and the page buttons, with the loading, empty, no results and error states, and the Delete modal.
 * Each catalog passes its own Create and Update modals in `modals`. The backend searches, sorts and cuts the pages.
 */
export function CatalogPage<T extends CatalogItem>({
  namespace,
  list,
  query,
  extraColumns = [],
  onCreate,
  onEdit,
  deletion,
  modals,
}: CatalogPageProps<T>) {
  const t = useTranslations(namespace);
  const { items, total, loading, failed, retry } = query;

  // The page the user left by deleting its only row: while the list still shows it, that empty page is a pass-through,
  // not a result. Derived from `list.page`, so it ends by itself when the page changes.
  const [leavingPage, setLeavingPage] = useState<number | null>(null);
  const isLeavingPage = leavingPage === list.page;

  async function handleConfirmDelete() {
    // Read before the request: the item leaves the list while it runs.
    const wasLastRowOfPage = items.length === 1 && list.page > 1;
    if (wasLastRowOfPage) setLeavingPage(list.page);
    const deleted = await deletion.confirm();
    // The same page would now be empty, so go back one page.
    if (deleted && wasLastRowOfPage) list.setPage(list.page - 1);
    else setLeavingPage(null);
  }

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // A search that matched nothing is not the same as an empty catalog.
  const emptyKind = list.search.trim() === "" ? "empty" : "no-results";

  return (
    <>
      <ListPage
        search={
          <SearchField
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            maxLength={CATALOG_SEARCH_MAX_LENGTH}
            defaultValue={list.search}
            onSearch={list.setSearch}
          />
        }
        createLabel={t("button")}
        onCreate={onCreate}
        error={
          failed && !loading ? (
            <PageState kind="error" labels={stateLabels} onRetry={retry} />
          ) : undefined
        }
        pagination={
          <Pagination
            page={list.page}
            total={total}
            onPageChange={list.setPage}
            labels={{
              navigation: t("pagination.navigation"),
              previous: t("pagination.previous"),
              next: t("pagination.next"),
              page: (number) => t("pagination.page", { number }),
            }}
          />
        }
      >
        <CatalogTable
          namespace={namespace}
          items={items}
          sort={list.sort}
          onSortChange={list.setSort}
          extraColumns={extraColumns}
          onEdit={onEdit}
          onDelete={deletion.askToDelete}
          loading={loading || (isLeavingPage && items.length === 0)}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
        />
      </ListPage>
      {modals}
      <DeleteCatalogItemModal
        namespace={namespace}
        item={deletion.item}
        error={deletion.error}
        pending={deletion.pending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={deletion.cancel}
      />
    </>
  );
}
