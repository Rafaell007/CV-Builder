import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "chevron_right"
export function ChevronRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </SvgIcon>
  );
}
