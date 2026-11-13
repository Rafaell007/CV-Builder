"use client";

import { useTranslations } from "next-intl";
import {
  Button,
  PageState,
  Pagination,
  SearchField,
  type PageStateLabels,
} from "@/shared/components";
import { useRouter } from "@/shared/i18n";
import { CvsTable } from "./components/CvsTable";
import { SEARCH_MAX_LENGTH } from "./cvs.constants";
import type { CvListItem } from "./cvs.types";
import { toCvDetailsPath, toCvsVariables } from "./utils";
import { useCvs } from "./useCvs";
import { useCvsListState } from "./useCvsListState";
import styles from "./Cvs.module.css";

export interface CvsProps {
  /** Shows the CVs of this user only (the User CVs tab). Without it the backend decides by the role of the signed-in user. */
  userId?: string;
  /** Called with the CV on View and on a row click. Without it, the page opens the CV Details page. */
  onView?: (cv: CvListItem) => void;
  /** Called with the CV when the user selects Edit in its row menu. */
  onEdit?: (cv: CvListItem) => void;
  /** Called with the CV when the user selects Delete in its row menu. */
  onDelete?: (cv: CvListItem) => void;
  /** Called when the user presses CREATE CV. */
  onCreate?: () => void;
}

/**
 * Content of the `/cvs` page: search, the sortable list of CVs and the page buttons,
 * with the loading, empty, no results and error states. The backend searches, sorts, cuts the pages
 * and decides which CVs the user may see.
 */
export function Cvs({ userId, onView, onEdit, onDelete, onCreate }: CvsProps) {
  const t = useTranslations("cvs");
  const router = useRouter();
  const list = useCvsListState();
  const variables = toCvsVariables(list, userId);
  const { cvs, total, loading, failed, retry } = useCvs(variables);

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // A search that matched nothing is not the same as a user without CVs.
  const emptyKind = variables.search === undefined ? "empty" : "no-results";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      {/* Outside the error branch below: an error must not remove the typed search (the field is uncontrolled). */}
      <div className={styles.toolbar}>
        <SearchField
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          maxLength={SEARCH_MAX_LENGTH}
          defaultValue={list.search}
          onSearch={list.setSearch}
        />
        <Button onClick={onCreate}>{t("button")}</Button>
      </div>
      {failed && !loading ? (
        <PageState kind="error" labels={stateLabels} onRetry={retry} />
      ) : (
        <>
          <CvsTable
            cvs={cvs}
            sort={list.sort}
            onSortChange={list.setSort}
            onView={onView ?? ((cv) => router.push(toCvDetailsPath(cv.id)))}
            onEdit={(cv) => onEdit?.(cv)}
            onDelete={(cv) => onDelete?.(cv)}
            loading={loading}
            loadingContent={<PageState kind="loading" labels={stateLabels} />}
            emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
          />
          <div className={styles.pagination}>
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
          </div>
        </>
      )}
    </div>
  );
}
