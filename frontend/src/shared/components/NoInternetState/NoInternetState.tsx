import type { ReactNode } from "react";
import { Button } from "../Button";
import { SadMonitorIllustration } from "../illustrations";
import styles from "./NoInternetState.module.css";

export interface NoInternetStateProps {
  title: string;
  /** A node, so the caller can add Figma's line break (for example with next-intl `t.rich`). */
  message: ReactNode;
  retryLabel: string;
  /** Repeats the failed request. */
  onRetry: () => void;
}

/** Full-screen error shown when the app cannot reach the server; RETRY repeats the request. */
export function NoInternetState({ title, message, retryLabel, onRetry }: NoInternetStateProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <SadMonitorIllustration />
        {/* Heading and message are read out as soon as the screen appears. */}
        <div role="alert">
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.message}>{message}</p>
        </div>
        <Button className={styles.retry} onClick={onRetry}>
          {retryLabel}
        </Button>
      </div>
    </div>
  );
}
