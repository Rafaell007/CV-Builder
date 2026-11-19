"use client";

import { useTranslations } from "next-intl";
import {
  ListPage,
  PageState,
  Pagination,
  SearchField,
  type PageStateLabels,
} from "@/shared/components";
import { useCurrentUser } from "@/shared/currentUser";
import { useRouter } from "@/shared/i18n";
import { useListState } from "@/shared/lists";
import { CreateCvModal } from "./components/CreateCvModal";
import { CvsTable } from "./components/CvsTable";
import { DeleteCvModal } from "./components/DeleteCvModal";
import { UpdateCvModal } from "./components/UpdateCvModal";
import { DEFAULT_CVS_SORT, SEARCH_MAX_LENGTH } from "./cvs.constants";
import type { CvListItem } from "./cvs.types";
import { toCvOpenPath, toCvsVariables, withScope } from "./utils";
import { useCreateCvForm } from "./useCreateCvForm";
import { useCvs } from "./useCvs";
import { useDeleteCv } from "./useDeleteCv";
import { useUpdateCvForm } from "./useUpdateCvForm";
import styles from "./Cvs.module.css";

export interface CvsProps {
  /** Shows the CVs of this user only (the User CVs tab). Without it the backend decides by the role of the signed-in user. */
  userId?: string;
  /** Called with the CV on View and on a row click. Without it, the page opens the CV Preview page. */
  onView?: (cv: CvListItem) => void;
}

/**
 * Content of the `/cvs` page under its `PageHeader`: the shared `ListPage` with search, the sortable list of CVs and
 * the page buttons, with the loading, empty, no results and error states. The backend searches, sorts, cuts the pages
 * and decides which CVs the user may see.
 */
export function Cvs({ userId, onView }: CvsProps) {
  const t = useTranslations("cvs");
  const router = useRouter();
  const list = useListState(DEFAULT_CVS_SORT);
  const variables = toCvsVariables(list, userId);
  const { cvs, total, loading, failed, forbidden, retry } = useCvs(variables);
  const { user, isAdmin, loading: userLoading } = useCurrentUser();

  const creation = useCreateCvForm(userId);
  const editing = useUpdateCvForm(userId);
  const deletion = useDeleteCv({
    page: list.page,
    rowsOnPage: cvs.length,
    onPageChange: list.setPage,
    ...withScope(userId),
  });

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // "You have no CVs yet" is for a signed-in non-admin who has no CVs and did not search. An admin, a list of one
  // user (userId) and a search that matched nothing all show "No CVs found".
  const hasNoCvsYet =
    user !== null && !isAdmin && userId === undefined && variables.search === undefined;
  const emptyKind = hasNoCvsYet ? "empty" : "no-results";

  return (
    // The classes only set the ListPage CSS variables where the Figma CVs frames differ (see Cvs.module.css).
    <div className={`${styles.page} ${userId === undefined ? styles.allCvs : ""}`}>
      <ListPage
        search={
          <SearchField
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            maxLength={SEARCH_MAX_LENGTH}
            defaultValue={list.search}
            onSearch={list.setSearch}
          />
        }
        createLabel={t("button")}
        onCreate={creation.open}
        error={
          failed && !loading ? (
            <PageState
              kind="error"
              labels={{
                ...stateLabels,
                error: forbidden ? t("states.forbidden") : stateLabels.error,
              }}
              // Retry cannot help when the role is not allowed.
              {...(forbidden ? {} : { onRetry: retry })}
            />
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
        <CvsTable
          cvs={cvs}
          sort={list.sort}
          onSortChange={list.setSort}
          onView={onView ?? ((cv) => router.push(toCvOpenPath(cv.id, userId)))}
          onEdit={editing.open}
          onDelete={deletion.askToDelete}
          loading={loading}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          // The role decides the text, so wait for the user: no flash of the wrong text.
          emptyContent={
            <PageState kind={userLoading ? "loading" : emptyKind} labels={stateLabels} />
          }
        />
      </ListPage>
      <CreateCvModal creation={creation} />
      <UpdateCvModal update={editing} />
      <DeleteCvModal
        cv={deletion.cv}
        pending={deletion.pending}
        onConfirm={() => void deletion.confirm()}
        onCancel={deletion.cancel}
      />
    </div>
  );
}
