import type { SVGProps } from "react";

// Every icon accepts normal <svg> props (className, aria-*), but draws its own path.
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;
