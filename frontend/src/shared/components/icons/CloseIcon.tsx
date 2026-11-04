import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "close", scaled around the centre from 14×14 to Figma's 12×12 cross (modal and toast close).
export function CloseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 7.21 16.79 6 12 10.79 7.21 6 6 7.21 10.79 12 6 16.79 7.21 18 12 13.21 16.79 18 18 16.79 13.21 12z" />
    </SvgIcon>
  );
}
