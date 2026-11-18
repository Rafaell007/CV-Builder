import styles from "./CvPreviewHeader.module.css";

export interface CvPreviewHeaderProps {
  fullName: string | null;
  position: string | null;
}

/** The top of the CV document: the full name and the position of the CV owner. A missing value is not shown. */
export function CvPreviewHeader({ fullName, position }: CvPreviewHeaderProps) {
  if (!fullName && !position) return null;

  return (
    <header className={styles.header}>
      {fullName ? <h2 className={styles.name}>{fullName}</h2> : null}
      {position ? <p className={styles.position}>{position}</p> : null}
    </header>
  );
}
