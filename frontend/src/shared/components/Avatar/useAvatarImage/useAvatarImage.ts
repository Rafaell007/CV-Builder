import { useState } from "react";

/** Decides if an image that failed to load may load again (e.g. after a session refresh). */
export type RetryImage = (src: string) => Promise<boolean>;

/**
 * Tells if the image can be shown. A failed load switches to the initials until `src` changes. With `retryImage`,
 * the first failure of a `src` asks it first: on `true` the image loads once more (`imageKey` changes, so the
 * `<img>` is made again); a second failure, or `false`, shows the initials.
 */
export function useAvatarImage(src: string | null | undefined, retryImage?: RetryImage) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [retriedSrc, setRetriedSrc] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);

  function onError() {
    if (!src) return;
    if (!retryImage || retriedSrc === src) {
      setFailedSrc(src);
      return;
    }
    setRetriedSrc(src);
    void retryImage(src).then((retry) => {
      if (retry) setImageKey((key) => key + 1);
      else setFailedSrc(src);
    });
  }

  return {
    showImage: Boolean(src) && src !== failedSrc,
    onError,
    imageKey,
  };
}
