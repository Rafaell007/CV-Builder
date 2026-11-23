/**
 * Escapes `\`, `%` and `_` in a search string, so Prisma `contains` treats them as plain characters.
 * Prisma does not escape LIKE wildcards itself, and PostgreSQL uses `\` as the default LIKE escape character.
 * Without this, a search for `%` or `_` matches every row.
 */
export function escapeLike(search: string): string {
  return search.replace(/[\\%_]/g, "\\$&");
}
