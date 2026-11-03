import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonLinkProps = {
  href: string;
  variant?: "primary" | "text";
  children: ReactNode;
};

// A link that looks like a Button, for navigation (a link, not a button, is what screen readers expect).
export function ButtonLink({ href, variant = "text", children }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${styles.button} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
