import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ListPage,
  PageState,
  Pagination,
  SearchField,
  type PageStateLabels,
} from "@/shared/components";
import type { UsePagedListResult, UseListStateResult } from "@/shared/lists";
import { CATALOG_SEARCH_MAX_LENGTH } from "../../catalogs.constants";
import type { CatalogItem, CatalogNamespace } from "../../catalogs.types";
import type { UseCreateCatalogItemFormResult } from "../../useCreateCatalogItemForm";
import type { UseDeleteCatalogItemResult } from "../../useDeleteCatalogItem";
import type { UseUpdateCatalogItemFormResult } from "../../useUpdateCatalogItemForm";
import { CatalogTable } from "../CatalogTable";
import { DeleteCatalogItemModal } from "../DeleteCatalogItemModal";
import { NameFormModal } from "../NameFormModal";

export interface CatalogPageProps {
  /** Which catalog's texts to show: `catalogs.departments` or `catalogs.positions`. */
  namespace: CatalogNamespace;
  /** The search, sort and page the user chose (`useListState`). */
  list: UseListStateResult;
  /** One page of the catalog from the backend (`useDepartments`, `usePositions`). */
  query: UsePagedListResult<CatalogItem>;
  creation: UseCreateCatalogItemFormResult;
  editing: UseUpdateCatalogItemFormResult;
  deletion: UseDeleteCatalogItemResult;
}

/**
 * The content of a catalog page under its `PageHeader` (Departments, Positions): the shared `ListPage` with search,
 * the sortable table and the page buttons, with the loading, empty, no results and error states, and the Create,
 * Update and Delete modals. The backend searches, sorts and cuts the pages.
 */
export function CatalogPage({
  namespace,
  list,
  query,
  creation,
  editing,
  deletion,
}: CatalogPageProps) {
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
        onCreate={creation.open}
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
          onEdit={editing.open}
          onDelete={deletion.askToDelete}
          loading={loading || (isLeavingPage && items.length === 0)}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
        />
      </ListPage>
      <NameFormModal namespace={namespace} kind="create" nameForm={creation} />
      <NameFormModal namespace={namespace} kind="update" nameForm={editing} />
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
