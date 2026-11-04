import styles from "./MultiSelect.module.css";

// The checkbox drawn in an option row: 20×20, 1px border, a 13.33×9.17 check with a 2px stroke (Figma).
// Decorative: the row's aria-selected tells screen readers whether it is chosen. Takes the row's text colour.
export function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className={styles.checkbox}
    >
      <rect x="0.5" y="0.5" width="19" height="19" fill="none" stroke="currentColor" />
      {checked && (
        <path
          d="M3.33 9.58l4.17 4.17 9.17-9.17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
