import { useAvatarImage } from "./useAvatarImage";
import { getInitials } from "./utils";
import styles from "./Avatar.module.css";

export type AvatarSize = "small" | "medium" | "large";

export interface AvatarProps {
  /** Full name: the image description and the source of the initials. */
  name: string;
  /** Image URL from the backend. Without it, or when it fails to load, the initials show. */
  src?: string | null;
  size?: AvatarSize;
}

/** Round user picture, or the initials of the user when there is no picture. */
export function Avatar({ name, src, size = "medium" }: AvatarProps) {
  const { showImage, onError } = useAvatarImage(src);

  return (
    <span className={`${styles.avatar} ${styles[size]}`} role="img" aria-label={name}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- the URL comes from the backend, host unknown
        <img className={styles.image} src={src ?? undefined} alt="" onError={onError} />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
