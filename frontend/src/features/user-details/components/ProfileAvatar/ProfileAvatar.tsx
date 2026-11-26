import { Avatar } from "@/shared/components/Avatar";
import { CloseIcon } from "@/shared/components/icons";
import { retryImageAfterRefresh } from "@/shared/session";
import styles from "./ProfileAvatar.module.css";

export interface ProfileAvatarProps {
  /** Full name: the image description and the source of the initials. */
  name: string;
  /** Image URL from the backend; without it the initials show. */
  src: string | null;
  /** Accessible name of the Remove button (e.g. "Remove avatar"). */
  removeLabel: string;
  /** Shows the Remove button; leave it out when there is no photo or the user may not edit it. */
  onRemove?: (() => void) | undefined;
  /** True while an upload or a removal runs. */
  disabled?: boolean;
}

/**
 * The 120px avatar of the Profile tab with Figma's "Remove image" button (Design system › Avatar Uploader): a red
 * round × in the top-right corner of the photo. It shows on hover or keyboard focus, always on touch screens.
 */
export function ProfileAvatar({
  name,
  src,
  removeLabel,
  onRemove,
  disabled = false,
}: ProfileAvatarProps) {
  return (
    <div className={styles.frame}>
      <Avatar name={name} src={src} size="large" retryImage={retryImageAfterRefresh} />
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
