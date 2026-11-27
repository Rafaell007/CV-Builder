import type { IconProps } from "./icons.types";
import { SvgIcon } from "./SvgIcon";

// Material "file_upload": an arrow over an open tray (avatar upload). Figma draws it in a 35×35 frame, so the
// caller passes `width={35} height={35}`: the 16×16 glyph then becomes Figma's 23×23 vector.
export function FileUploadIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5-5 5z" />
    </SvgIcon>
  );
}
