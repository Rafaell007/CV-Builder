import { Button } from "../Button";
import styles from "./SelectionToolbar.module.css";

export interface SelectionToolbarProps {
  /** Selected items; at 0 the badge is hidden and Remove is disabled. */
  count: number;
  /** Remove button text, e.g. "Remove". Callers pass translated texts, as for every text below. */
  removeLabel: string;
  cancelLabel: string;
  /** Opens the confirm step; the caller removes the items. */
  onRemove: () => void;
  /** Leaves selection mode. */
  onCancel: () => void;
}

/** Bar at the bottom of the page in selection mode: CANCEL and REMOVE with the selected count. */
export function SelectionToolbar({
  count,
  removeLabel,
  cancelLabel,
  onRemove,
  onCancel,
}: SelectionToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <Button variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {/* The count is part of the button's name ("Remove 3"), read from the visible text. The space keeps
          "Remove 3" apart for screen readers; a flex container does not render it. */}
      <Button onClick={onRemove} disabled={count === 0}>
        {removeLabel}
        {count > 0 && (
          <>
            {" "}
            <span className={styles.badge}>{count}</span>
          </>
        )}
      </Button>
    </div>
  );
}
