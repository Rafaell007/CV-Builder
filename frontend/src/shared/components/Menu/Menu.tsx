import { DropdownMenu } from "radix-ui";
import styles from "./Menu.module.css";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Draws the item in the error colour, for actions like Delete. */
  destructive?: boolean;
}

export interface MenuProps {
  items: ReadonlyArray<MenuItem>;
  /** Accessible name of the three-dot button. Callers pass a translated text. */
  label?: string;
}

/**
 * Three-dot row actions. Radix keeps one menu open at a time and closes it on Escape,
 * on a click outside and after an item is selected.
 */
export function Menu({ items, label = "Actions" }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={styles.trigger} aria-label={label}>
        <span aria-hidden="true">⋮</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} align="end" sideOffset={4}>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className={`${styles.item} ${item.destructive ? styles.destructive : ""}`}
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
