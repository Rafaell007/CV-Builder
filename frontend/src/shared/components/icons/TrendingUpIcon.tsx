import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "trending_up"
export function TrendingUpIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
    </SvgIcon>
  );
}
