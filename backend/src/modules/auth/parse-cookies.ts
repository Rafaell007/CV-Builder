/** Reads the value of one cookie from a `Cookie` request header. `undefined` when it is absent or empty. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined) return undefined;

  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1 || pair.slice(0, separator).trim() !== name) continue;

    const value = pair.slice(separator + 1).trim();
    if (value === "") return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined; // a broken percent sequence is treated as no cookie
    }
  }
  return undefined;
}
