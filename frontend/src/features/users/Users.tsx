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
import { toListVariables, useListState } from "@/shared/lists";
import { CreateUserModal } from "./components/CreateUserModal";
import { DeleteUserModal } from "./components/DeleteUserModal";
import { UpdateUserModal } from "./components/UpdateUserModal";
import { UsersTable } from "./components/UsersTable";
import { useCreateUserForm } from "./useCreateUserForm";
import { useDeleteUser } from "./useDeleteUser";
import { useUpdateUserForm } from "./useUpdateUserForm";
import { DEFAULT_USERS_SORT, SEARCH_MAX_LENGTH } from "./users.constants";
import type { UserListItem } from "./users.types";
import { useUsers } from "./useUsers";
import { toUserProfilePath } from "./utils";
import styles from "./Users.module.css";

/**
 * Content of the `/users` page (Employees) under its `PageHeader`: the shared `ListPage` with search, the sortable
 * list of users and the page buttons, with the loading, empty, no results and error states. The backend searches,
 * sorts and cuts the pages. Both roles see the list; only an admin gets CREATE USER and the row menu. The page loads
 * in the browser, like the other list pages, because the role is known only there (PLAN D6 asks for SSR; see README).
 */
export function Users() {
  const t = useTranslations("users");
  const router = useRouter();
  const list = useListState(DEFAULT_USERS_SORT);
  const variables = toListVariables(list);
  const { users, total, loading, failed, retry } = useUsers(variables);
  const creation = useCreateUserForm();
  const editing = useUpdateUserForm();
  const deletion = useDeleteUser();
  const { user: currentUser, isAdmin, loading: userLoading } = useCurrentUser();

  // A page after the first one came back empty: its last rows left the list. That happens after a delete, after a
  // delete of a user that was already gone (NOT_FOUND reloads the list) and after an update that moves the user out of
  // the search. Go back one page. It runs during render (React: "adjusting state when data changes"), so the empty
  // page is never painted; the next render loads the page before, so the condition is false again.
  if (!loading && !failed && users.length === 0 && list.page > 1) {
    list.setPage(list.page - 1);
  }

  const openProfile = (user: UserListItem) => router.push(toUserProfilePath(user.id));

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // A search that matched nothing is not the same as a list without users.
  const emptyKind = variables.search === undefined ? "empty" : "no-results";

  return (
    // The class only sets the ListPage CSS variables where the Figma Users frames differ (see Users.module.css).
    <div className={styles.page}>
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
        // CREATE USER is for an admin only; the backend refuses createUser to anyone else.
        {...(isAdmin ? { createLabel: t("button"), onCreate: creation.open } : {})}
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
        <UsersTable
          users={users}
          sort={list.sort}
          onSortChange={list.setSort}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id ?? ""}
          onView={openProfile}
          onUpdate={editing.open}
          onDelete={deletion.askToDelete}
          // The role decides the row actions, so wait for the user: an admin never sees the employee arrows first.
          loading={loading || userLoading}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
        />
      </ListPage>
      {isAdmin && (
        <>
          <CreateUserModal creation={creation} />
          <UpdateUserModal editing={editing} currentUserId={currentUser?.id ?? ""} />
          <DeleteUserModal
            user={deletion.user}
            pending={deletion.pending}
            onConfirm={() => void deletion.confirm()}
            onCancel={deletion.cancel}
          />
        </>
      )}
    </div>
  );
}
