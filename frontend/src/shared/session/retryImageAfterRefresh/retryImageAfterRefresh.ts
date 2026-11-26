import { refreshSession } from "../refreshSession";

/**
 * Decides if an image that failed to load may load again. An `<img>` request never goes through the Apollo session
 * link or the page proxy, so an expired access token makes it fail with 401. A `HEAD` request tells why the image
 * failed: only a 401 refreshes the session (single-flight, so many failed images share one refresh). True when the
 * session was refreshed; false for any other answer (404, no network, session over).
 */
export async function retryImageAfterRefresh(src: string): Promise<boolean> {
  let status: number;
  try {
    status = (await fetch(src, { method: "HEAD" })).status;
  } catch {
    return false;
  }
  if (status !== 401) return false;
  return (await refreshSession()) === "refreshed";
}
