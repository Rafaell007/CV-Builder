import styles from "./ResponsibilityTags.module.css";

export interface ResponsibilityTagsProps {
  /** One tag per item. Nothing is drawn for an empty list. */
  items: readonly string[];
  /** Accessible name of the list (for example "Responsibilities"). */
  label: string;
}

/** The responsibilities of a CV project as filled tags under its row. A long text breaks inside the tag. */
export function ResponsibilityTags({ items, label }: ResponsibilityTagsProps) {
  if (items.length === 0) return null;

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item, index) => (
        // The same sentence can be typed twice, so the position is part of the key. The list is read-only.
        <li key={`${index}-${item}`} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}
