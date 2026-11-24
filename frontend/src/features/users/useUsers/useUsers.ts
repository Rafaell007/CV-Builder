"use client";

import { UsersDocument, type UsersQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { UserListItem } from "../users.types";

export type UseUsersResult = Omit<UsePagedListResult<UserListItem>, "items"> & {
  /** The rows of the current page, as the backend returned them. */
  users: readonly UserListItem[];
};

/** Loads one page of users with the `Users` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useUsers(variables: UsersQueryVariables): UseUsersResult {
  const { items, ...list } = usePagedList(UsersDocument, variables, (data) => data.users);
  return { users: items, ...list };
}
