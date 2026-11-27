import type { ReactNode } from "react";
import type { IconProps } from "./icons.types";

// 24×24 frame like Figma's icon layers; `currentColor` takes the colour of the parent's text.
// Decorative by default: the button or field around it carries the accessible name.
export function SvgIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}
