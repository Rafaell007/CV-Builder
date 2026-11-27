/** The version part of an avatar address: the time of the last upload, as `?v=` sends it. */
export function avatarVersion(avatarUpdatedAt: Date): string {
  return String(avatarUpdatedAt.getTime());
}

/**
 * The address of a user's avatar for `<img src>`: the `GET /api/users/:id/avatar` endpoint (D11), or `null` when
 * the user has no avatar, so the page shows the initials without a failed image request. `?v=` is the time of
 * the last upload: a new upload gives a new address, so the browser loads the new image instead of a cached one.
 */
export function avatarUrl(userId: string, avatarUpdatedAt: Date | null): string | null {
  if (avatarUpdatedAt === null) return null;
  return `/api/users/${userId}/avatar?v=${avatarVersion(avatarUpdatedAt)}`;
}
