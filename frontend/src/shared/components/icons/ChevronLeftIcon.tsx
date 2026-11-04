import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "chevron_left"
export function ChevronLeftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </SvgIcon>
  );
}
