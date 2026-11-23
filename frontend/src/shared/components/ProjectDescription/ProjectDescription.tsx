import { useClampedText } from "./useClampedText";
import styles from "./ProjectDescription.module.css";

export interface ProjectDescriptionProps {
  text: string;
}

/**
 * The description of a project. On a tablet the CSS cuts it after three lines and ends the last line with
 * an ellipsis. When it is cut, a click on the paragraph shows all of it, and a second click cuts it again.
 * When nothing is cut (a short text, or a desktop), it is plain text: no pointer cursor, no button role.
 */
export function ProjectDescription({ text }: ProjectDescriptionProps) {
  const { ref, expanded, toggleable, toggle, onKeyDown } = useClampedText(text);

  return (
    <p
      ref={ref}
      className={styles.description}
      data-expanded={expanded ? "" : undefined}
      data-toggleable={toggleable ? "" : undefined}
      role={toggleable ? "button" : undefined}
      tabIndex={toggleable ? 0 : undefined}
      aria-expanded={toggleable ? expanded : undefined}
      onClick={toggleable ? toggle : undefined}
      onKeyDown={toggleable ? onKeyDown : undefined}
    >
      {text}
    </p>
  );
}
