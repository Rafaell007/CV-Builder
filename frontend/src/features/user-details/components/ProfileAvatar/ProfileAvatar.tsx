import { useCallback, useRef } from "react";
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
 * When the focused button leaves the page (the photo was removed), focus moves to the photo, so a keyboard user
 * stays at the same place instead of starting again at the top of the page.
 */
export function ProfileAvatar({
  name,
  src,
  removeLabel,
  onRemove,
  disabled = false,
}: ProfileAvatarProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Stable, so React calls the cleanup only when the button leaves the page, not on every render. The cleanup
  // (React 19 ref cleanup) runs before the button is taken out of the page, so it still has focus then.
  const keepFocusOnRemoval = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return;
    return () => {
      if (document.activeElement === button) frameRef.current?.focus();
    };
  }, []);

  return (
    <div ref={frameRef} className={styles.frame} tabIndex={-1}>
      <Avatar name={name} src={src} size="large" retryImage={retryImageAfterRefresh} />
      {onRemove && (
        <button
          ref={keepFocusOnRemoval}
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
