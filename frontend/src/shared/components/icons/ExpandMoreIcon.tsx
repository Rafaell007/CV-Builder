import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "expand_more": Figma's select chevron (chevron-right, 7.41×12, turned to point down).
export function ExpandMoreIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </SvgIcon>
  );
}
