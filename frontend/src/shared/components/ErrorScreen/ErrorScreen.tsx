import type { ReactNode } from "react";
import { SadMonitorIllustration } from "../illustrations";
import styles from "./ErrorScreen.module.css";

export interface ErrorScreenProps {
  title: string;
  /** A node, so the caller can add Figma's line break. */
  message: ReactNode;
  /** Puts the heading and the message in a `role="alert"` region: read out as soon as the screen appears. */
  announce?: boolean;
  /** The action under the message, for example a RETRY button. */
  children?: ReactNode;
}

/** The content of a full-screen error: the sad monitor, "Oops", a message and an optional action. */
export function ErrorScreen({ title, message, announce = false, children }: ErrorScreenProps) {
  const text = (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
    </>
  );

  return (
    <div className={styles.content}>
      <SadMonitorIllustration />
      {announce ? <div role="alert">{text}</div> : text}
      {children}
    </div>
  );
}
