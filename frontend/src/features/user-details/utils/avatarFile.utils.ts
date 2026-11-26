import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from "../user-details.constants";

/** Why a chosen file cannot be an avatar, or `"ok"`. */
export type AvatarFileCheck = "ok" | "wrongType" | "tooLarge";

/**
 * A quick check of a chosen file before it is sent, so the user sees the error at once (AC-19, AC-20). It reads only
 * the type the browser gives (from the file name) and the size; the backend checks the real content again. An empty
 * type means the browser does not know it (e.g. `.jfif`, or an extension the system has no type for): such a file
 * is sent, and the backend decides by the content (415 when it is not an image).
 */
export function checkAvatarFile(file: Pick<File, "type" | "size">): AvatarFileCheck {
  const knownType = file.type !== "";
  if (knownType && !(AVATAR_MIME_TYPES as readonly string[]).includes(file.type))
    return "wrongType";
  if (file.size > AVATAR_MAX_BYTES) return "tooLarge";
  return "ok";
}
