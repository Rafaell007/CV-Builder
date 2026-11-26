import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Avatar,
  ChevronRightIcon,
  DataTable,
  Menu,
  type DataTableColumn,
  type SortState,
} from "@/shared/components";
import { DESKTOP_MIN_WIDTH } from "@/shared/constants";
import { Link } from "@/shared/i18n";
import { USER_SORT_FIELDS } from "../../users.constants";
import type { UserListItem } from "../../users.types";
import { getUserDisplayName } from "@/shared/utils";
import { toUserProfilePath } from "../../utils";
import styles from "./UsersTable.module.css";

export interface UsersTableProps {
  users: readonly UserListItem[];
  /** The backend sort. The table only shows it and reports a click on a header. */
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
  /** True: each row has the View / Update / Delete menu. False: each row has an arrow to the profile. */
  isAdmin: boolean;
  /** The signed-in user. An admin cannot delete themself, so Delete is disabled in their own row. */
  currentUserId: string;
  /** Called with the user when the row is clicked, or View is selected in its menu. */
  onView: (user: UserListItem) => void;
  /** Called with the user when Update is selected in its row menu (admin only). */
  onUpdate: (user: UserListItem) => void;
  /** Called with the user when Delete is selected in its row menu (admin only). */
  onDelete: (user: UserListItem) => void;
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/**
 * The users as a table: avatar (initials), first name, last name, email, department and position. Email and Position
 * are hidden on a tablet, as in Figma. First Name, Last Name, Department and Position sort on the backend; the table
 * never sorts the rows it holds. A click on a row opens the profile, for both roles.
 */
export function UsersTable({
  users,
  sort,
  onSortChange,
  isAdmin,
  currentUserId,
  onView,
  onUpdate,
  onDelete,
  loading,
  loadingContent,
  emptyContent,
}: UsersTableProps) {
  const t = useTranslations("users");

  // A user who signed up has no name, department or position yet: a dash, with a text for screen readers.
  const renderText = (value: string | null | undefined): ReactNode =>
    value ? (
      <span className={styles.text}>{value}</span>
    ) : (
      <span role="img" aria-label={t("missing")}>
        &mdash;
      </span>
    );

  const columns: DataTableColumn<UserListItem>[] = [
    {
      // No header text on screen (Figma); screen readers still get one. The initials repeat the name of the next
      // columns, so screen readers skip them.
      id: "avatar",
      header: t("columns.avatar"),
      hideHeader: true,
      cell: (user) => (
        <span className={styles.avatar} aria-hidden="true">
          <Avatar name={getUserDisplayName(user)} src={user.avatarUrl ?? null} />
        </span>
      ),
    },
    {
      id: "firstName",
      header: t("columns.firstName"),
      sortField: USER_SORT_FIELDS.firstName,
      cell: (user) => renderText(user.firstName),
    },
    {
      id: "lastName",
      header: t("columns.lastName"),
      sortField: USER_SORT_FIELDS.lastName,
      cell: (user) => renderText(user.lastName),
    },
    {
      id: "email",
      header: t("columns.email"),
      hideBelow: DESKTOP_MIN_WIDTH,
      cell: (user) => renderText(user.email),
    },
    {
      id: "department",
      header: t("columns.department"),
      sortField: USER_SORT_FIELDS.department,
      cell: (user) => renderText(user.department?.name),
    },
    {
      id: "position",
      header: t("columns.position"),
      sortField: USER_SORT_FIELDS.position,
      hideBelow: DESKTOP_MIN_WIDTH,
      cell: (user) => renderText(user.position?.name),
    },
  ];

  const renderActions = (user: UserListItem): ReactNode => {
    const name = getUserDisplayName(user);
    if (!isAdmin) {
      // A real link: it opens a page, so Ctrl+click and screen readers treat it as one.
      return (
        <Link
          href={toUserProfilePath(user.id)}
          className={styles.profileLink}
          aria-label={t("actions.openProfile", { name })}
        >
          <ChevronRightIcon />
        </Link>
      );
    }
    return (
      <Menu
        label={t("actions.menu", { name })}
        items={[
          { label: t("actions.view"), onSelect: () => onView(user) },
          { label: t("actions.update"), onSelect: () => onUpdate(user) },
          {
            label: t("actions.delete"),
            onSelect: () => onDelete(user),
            destructive: true,
            // The backend refuses it too (SELF_DELETE).
            disabled: user.id === currentUserId,
          },
        ]}
      />
    );
  };

  return (
    <DataTable
      label={t("table")}
      columns={columns}
      rows={users}
      getRowId={(user) => user.id}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onView}
      renderRowActions={renderActions}
      labels={{ actions: t("actions.column") }}
      loading={loading}
      loadingContent={loadingContent}
      emptyContent={emptyContent}
    />
  );
}
