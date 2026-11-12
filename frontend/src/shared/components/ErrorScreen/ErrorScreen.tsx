import type { ReactNode } from "react";
import { Button } from "../Button";
import { SadMonitorIllustration } from "../illustrations";
import styles from "./ErrorScreen.module.css";

export interface ErrorScreenAction {
  label: string;
  onClick: () => void;
}

export interface ErrorScreenProps {
  title: string;
  message: ReactNode;
  action?: ErrorScreenAction;
  // true = screen readers read the title and message as soon as the screen appears.
  announce?: boolean;
}

/** Full-screen error: sad monitor, title, message and an optional button. */
export function ErrorScreen({ title, message, action, announce = false }: ErrorScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <SadMonitorIllustration />
        {/* undefined = React leaves the role attribute out */}
        <div role={announce ? "alert" : undefined}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.message}>{message}</p>
        </div>
        {action && (
          <Button className={styles.action} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
