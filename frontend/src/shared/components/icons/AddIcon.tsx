import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "add".
export function AddIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
    </SvgIcon>
  );
}
