import {
  ContactPageIcon,
  DomainIcon,
  FolderCopyIcon,
  PeopleIcon,
  TranslateIcon,
  TrendingUpIcon,
  WorkOutlineIcon,
} from "@/shared/components/icons";
import type { NavItem } from "./navigation.types";

export const USER_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/users", labelKey: "employees", icon: PeopleIcon },
  { href: "/skills", labelKey: "skills", icon: TrendingUpIcon },
  { href: "/languages", labelKey: "languages", icon: TranslateIcon },
  { href: "/cvs", labelKey: "cvs", icon: ContactPageIcon },
];

export const ADMIN_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/users", labelKey: "employees", icon: PeopleIcon },
  { href: "/admin/skills", labelKey: "skills", icon: TrendingUpIcon },
  { href: "/admin/languages", labelKey: "languages", icon: TranslateIcon },
  { href: "/cvs", labelKey: "cvs", icon: ContactPageIcon },
];

// Shown only to admins, below a divider line.
export const ADMIN_EXTRA_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/admin/departments", labelKey: "departments", icon: DomainIcon },
  { href: "/admin/positions", labelKey: "positions", icon: WorkOutlineIcon },
  { href: "/admin/projects", labelKey: "projects", icon: FolderCopyIcon },
];
