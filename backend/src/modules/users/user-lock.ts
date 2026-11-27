import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { Role } from "../auth/models/role.enum";

/**
 * Shared by the writes on a user (`UsersService`, `AvatarsService`): who may act, the row lock, and the
 * transaction errors after which the client can simply try again.
 */

/** `extensions.reason` of the `CONFLICT` after which nothing was saved and the admin can try again. */
export const CONCURRENT_CHANGE_REASON = "CONCURRENT_CHANGE";

/**
 * Transaction errors after which nothing was saved, so the admin can simply try again:
 * - P2034: a deadlock or a write conflict; PostgreSQL stopped this transaction because a parallel one needs the
 *   same rows. Example: a user is deleted while their browser refreshes its session token.
 * - P2028: Prisma rolled the transaction back because it did not finish in time (default 5 s), or got no free
 *   database connection in time (default 2 s). Example: many requests wait for the same locked user at once.
 */
export const TRANSACTION_CONFLICT_CODES: ReadonlySet<string> = new Set(["P2034", "P2028"]);

/** A transaction error from `TRANSACTION_CONFLICT_CODES` becomes a `CONFLICT` to retry, not a server error. Any other error is returned as is. */
export function toTransactionConflict(error: unknown): unknown {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSACTION_CONFLICT_CODES.has(error.code)
    ? new ConflictException({
        message: "The user was changed at the same time. Try again",
        reason: CONCURRENT_CHANGE_REASON,
      })
    : error;
}

/**
 * A UUID as PostgreSQL returns it: lower case. The input checks accept "6F1D3C52-…" too, and the SQL
 * matches it, but a plain `===` with an id read from the database (the locked rows, the actor) would not.
 */
export function canonicalId(id: string): string {
  return id.toLowerCase();
}

/**
 * Locks the acting admin and the target until the transaction ends, then checks both as they are now. A
 * parallel request that changes or deletes one of them waits here until this one commits, and then reads the
 * new data. One statement in id order locks the rows in the same order in every request, so two requests cannot
 * each hold a row the other one waits for (a deadlock).
 * `FOR NO KEY UPDATE`, not `FOR UPDATE`: it still blocks every other lock of this function and every update or
 * delete of the rows, but not the light lock that saving a row which points to the user takes (a refresh token
 * on sign-in or refresh), so an admin's edit does not hold up anyone's session.
 * - `FORBIDDEN` when the actor is no longer an admin: the guard checked the role before the request waited
 *   here, and a parallel request may have demoted or deleted the actor since. With `ownerMayAct`, a user who
 *   still exists may also act on themselves (the profile, the avatar).
 * - `NOT_FOUND` when the target does not exist.
 *
 * This keeps at least one admin (D24) without counting them: a role change or delete goes through only while
 * its actor is an admin, the actor cannot demote or delete themselves (`OWN_ROLE`, `SELF_DELETE`), and the lock
 * keeps the actor an admin until the change commits. So after every change, its actor is still an admin.
 * `ownerMayAct` is only for writes that keep the role and the row.
 */
export async function lockActorAndTarget(
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
  { ownerMayAct = false }: { ownerMayAct?: boolean } = {},
): Promise<void> {
  // A tagged template: Prisma sends the ids as query parameters, never as SQL text.
  const rows = await tx.$queryRaw<LockedUser[]>`
    SELECT id, role FROM "User"
    WHERE id = ${id}::uuid OR id = ${actorId}::uuid
    ORDER BY id
    FOR NO KEY UPDATE`;
  const actor = rows.find((row) => row.id === actorId);
  const actsOnSelf = ownerMayAct && actor !== undefined && id === actorId;
  if (actor?.role !== Role.ADMIN && !actsOnSelf) {
    throw new ForbiddenException("You are not allowed to do this");
  }
  if (!rows.some((row) => row.id === id)) throw new NotFoundException("User not found");
}

interface LockedUser {
  id: string;
  role: Role;
}
