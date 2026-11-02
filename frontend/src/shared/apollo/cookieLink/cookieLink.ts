import { SetContextLink } from "@apollo/client/link/context";

/**
 * Sends the incoming request's cookies with every backend call made on the server, so the backend
 * sees the user's session (PLAN D6). Browsers send cookies themselves and do not need this link.
 */
export function createCookieLink(getCookieHeader: () => Promise<string>): SetContextLink {
  return new SetContextLink(async (prevContext) => {
    const cookie = await getCookieHeader();
    if (!cookie) return {};
    return { headers: { ...prevContext.headers, cookie } };
  });
}
