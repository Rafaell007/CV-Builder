import type { ReactNode } from "react";
import { Button } from "../Button";
import { ErrorScreen } from "../ErrorScreen";
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
      <ErrorScreen title={title} message={message} announce>
        <Button className={styles.retry} onClick={onRetry}>
          {retryLabel}
        </Button>
      </ErrorScreen>
    </div>
  );
}
