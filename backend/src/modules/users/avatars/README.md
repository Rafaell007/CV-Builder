# Avatars

The profile photo of a user (D11, user profile page "Upload Avatar", AC-18 to AC-23). REST, not GraphQL, because the body is a file. Stored in PostgreSQL (`Avatar`: `userId`, `data`, `mimeType`, `updatedAt`), so it works locally and deployed without a storage service.

- **REST** (the browser calls them through the Next.js rewrite `/api/*`, D8, so the auth cookie goes along):
  - `GET /api/users/:id/avatar` → the image with its stored `Content-Type`, `X-Content-Type-Options: nosniff` and `Cache-Control: private, max-age=31536000, immutable` when `?v=` is the current version (the address from `User.avatarUrl`, `avatarVersion` in `avatar-url.utils.ts`). Without `v` or with an old one: `Cache-Control: private, no-cache`, so the browser never keeps an old photo under an address that stays the same. The headers are set only on success, so a 404 is never cached. `404` when the user has no avatar.
  - `POST /api/users/:id/avatar` → `204`. Multipart with one file in the field `file`.
  - `DELETE /api/users/:id/avatar` → `204`, also when there was no avatar.
  - `:id` must be a UUID (`400` otherwise).
- **Who:** every signed-in user may read (AC-3); the owner or an admin may upload and remove (PLAN.md §7). Not signed in → `401` (global `JwtAuthGuard`). No verified email needed (D16), like `updateProfile`.
- **Checks, in this order:**
  0. `GET` has its own higher rate limit (`AVATAR_READ_LIMIT`, 300 per 60 s per IP, in `avatars.constants.ts`), because one page can show many photos. Before the file is read, two guards on `POST` and `DELETE`: `GqlThrottlerGuard` (the limit of D23, `THROTTLE_LIMIT` per `THROTTLE_TTL_SECONDS`, counted per IP; each of `POST` and `DELETE` counts on its own; over it → `429`) and `AvatarActorGuard` (neither the owner nor an admin by the role in the token → `403`, so such a user cannot make the server read 5 MB). Because the guard runs before the id is parsed, a user who writes to an id that is not a UUID gets `403`, not `400`. The service still checks the actor under the row lock (step 2) and stays the one that decides.
  1. Multer reads the upload into memory and stops at 5 MB (`AVATAR_MAX_BYTES`) → `413`. Other form fields or a second file → `400`. No file → `400`.
  2. Inside a transaction, the actor and the user are locked with `lockActorAndTarget` from [`../user-lock.ts`](../user-lock.ts), shared with `UsersService.updateProfile`: neither the owner nor an admin → `403`, also for an unknown id (no probing); an admin with an unknown id → `404`.
  3. The type comes from the first bytes of the file (`detectImageType`), never from the file name or the type the browser sent: PNG, JPG/JPEG or GIF, else `415` with `{ reason: "UNSUPPORTED_FILE_TYPE" }`. The stored `mimeType` is the detected one.
  4. `upsert`: a new upload replaces the old one. A failed upload changes nothing (AC-23).
  - A transaction timeout or deadlock (`P2028`, `P2034`) → `409` with `reason: "CONCURRENT_CHANGE"`, like the users writes.
- **Why our own type check:** Nest's `FileTypeValidator` also reads the content, but it does not return the type it found, so the type to store would come from the browser. It also loads the ESM package `file-type`, which Jest cannot load without `--experimental-vm-modules`.
- **Errors** are Nest's default JSON for REST (`{ statusCode, message }`, plus `reason` where set); the GraphQL error filter leaves HTTP requests to Nest.
- **Tests:** `*.spec.ts` next to the code. The real limits over HTTP are in `backend/test/users/avatars.int-spec.ts`; the rate limit is in `backend/test/users/avatar-throttling.int-spec.ts` (limit lowered to 3).
- **Docs:** [User profile page](../../../../../docs/pages/11-user-profile-page.md) · [PLAN.md D8, D11, §7](../../../../../PLAN.md) · [Nest file upload](https://docs.nestjs.com/techniques/file-upload)
