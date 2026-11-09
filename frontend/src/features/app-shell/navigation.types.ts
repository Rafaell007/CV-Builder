import type { ComponentType } from "react";
import type { IconProps } from "@/shared/components/icons";
import type appShellMessages from "./messages/en.json";

// Only keys that exist in the messages, so a typo fails the typecheck.
export type NavLabelKey = keyof typeof appShellMessages.nav;

// One link in the sidebar. The label is a message key; the component translates it.
export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: ComponentType<IconProps>;
};

// The sidebar links for one role. A divider line goes between the two lists.
export type NavItems = {
  mainItems: ReadonlyArray<NavItem>;
  extraItems: ReadonlyArray<NavItem>;
};
