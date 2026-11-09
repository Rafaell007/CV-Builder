import type { ComponentType } from "react";
import type { IconProps } from "@/shared/components/icons";

export type NavItems = {
  mainItems: ReadonlyArray<NavItem>;
  extraItems: ReadonlyArray<NavItem>;
};

export type NavItem = {
  href: string;
  labelKey: string;
  icon: ComponentType<IconProps>;
};
