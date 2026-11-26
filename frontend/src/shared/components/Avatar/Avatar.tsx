import { useAvatarImage, type RetryImage } from "./useAvatarImage";
import { getInitials } from "./utils";
import styles from "./Avatar.module.css";

export type AvatarSize = "small" | "medium" | "large";

export interface AvatarProps {
  /** Full name: the image description and the source of the initials. */
  name: string;
  /** Image URL from the backend. Without it, or when it fails to load, the initials show. */
  src?: string | null;
  size?: AvatarSize;
  /**
   * Called once when `src` fails to load; `true` loads it again. E.g. `retryImageAfterRefresh` from
   * `@/shared/session` for backend images behind the session cookie.
   */
  retryImage?: RetryImage;
}

/** Round user picture, or the initials of the user when there is no picture. */
export function Avatar({ name, src, size = "medium", retryImage }: AvatarProps) {
  const { showImage, onError, imageKey } = useAvatarImage(src, retryImage);

  return (
    <span className={`${styles.avatar} ${styles[size]}`} role="img" aria-label={name}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- the URL comes from the backend, host unknown
        <img
          key={imageKey}
          className={styles.image}
          src={src ?? undefined}
          alt=""
          onError={onError}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
