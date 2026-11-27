import { redirectToSignIn, refreshSession } from "@/shared/session";

/** The multipart field the backend reads the image from (`AVATAR_FILE_FIELD` there). */
const FILE_FIELD = "file";

/**
 * One request to `/api/users/:id/avatar` (PLAN D11): `POST` with the file as multipart, or `DELETE` without a body.
 * The browser calls the frontend's own `/api`, and the Next.js rewrite passes it on with the cookies (D8).
 * Resolves with the HTTP status, or `null` when there is no answer (offline, server down).
 *
 * An expired access token (401) refreshes the session and sends the request once more, like the Apollo session link.
 * When the session is over, the browser goes to sign-in and the promise never settles, so the caller stays busy and
 * no error flashes before the page leaves. A refresh without an answer does not end the session: the 401 comes back.
 */
export async function requestAvatar(
  userId: string,
  method: "POST" | "DELETE",
  file?: File,
): Promise<number | null> {
  const first = await send(userId, method, file);
  if (first !== 401) return first;

  const refresh = await refreshSession();
  if (refresh === "failed") return first;

  const second = refresh === "refreshed" ? await send(userId, method, file) : first;
  if (second === 401 && redirectToSignIn()) return new Promise<never>(() => {});
  return second;
}

async function send(
  userId: string,
  method: "POST" | "DELETE",
  file?: File,
): Promise<number | null> {
  // A new body for every try: the retry after a refresh must send the file again.
  let body: FormData | null = null;
  if (file) {
    body = new FormData();
    body.append(FILE_FIELD, file);
  }
  try {
    // No `content-type` header: for a FormData body the browser sets `multipart/form-data` with the boundary itself.
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}/avatar`, {
      method,
      body,
    });
    return response.status;
  } catch {
    return null;
  }
}
