import styles from "./ThemeSample.module.css";

/** Storybook-only sample: a few design tokens that change with the light/dark theme. */
export function ThemeSample() {
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>CV Builder</h1>
      <p className={styles.body}>Body text on the theme background.</p>
      <p className={styles.secondary}>Secondary text.</p>
      <span className={styles.primary}>Primary</span>
    </div>
  );
}
