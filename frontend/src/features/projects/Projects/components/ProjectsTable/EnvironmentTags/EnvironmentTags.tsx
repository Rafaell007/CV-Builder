import styles from "./EnvironmentTags.module.css";

export interface EnvironmentTagsProps {
  items: readonly { id: string; name: string }[];
  /** Accessible name of the list (for example "Environment"). */
  label: string;
}

/** The technologies of a project as tags. Long names break inside the tag and many tags wrap to new lines. */
export function EnvironmentTags({ items, label }: EnvironmentTagsProps) {
  if (items.length === 0) return null;

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={styles.tag}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
