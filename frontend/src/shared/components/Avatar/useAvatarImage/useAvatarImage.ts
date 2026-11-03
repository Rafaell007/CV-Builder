import { useState } from "react";

/** Tells if the image can be shown. A failed load switches to the initials until `src` changes. */
export function useAvatarImage(src: string | null | undefined) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return {
    showImage: Boolean(src) && src !== failedSrc,
    onError: () => setFailedSrc(src ?? null),
  };
}
