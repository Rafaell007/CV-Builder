import { ConflictException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";

/** `extensions.reason` of the `CONFLICT` after which nothing was saved and the client can try again. */
export const CONCURRENT_CHANGE_REASON = "CONCURRENT_CHANGE";

/**
 * Transaction errors after which nothing was saved, so the client can simply try again:
 * - P2034: a deadlock or a write conflict; PostgreSQL stopped this transaction because a parallel one needs the
 *   same rows. Example: a user is deleted while their browser refreshes its session token.
 * - P2028: Prisma rolled the transaction back because it did not finish in time (default 5 s), or got no free
 *   database connection in time (default 2 s). Example: many requests wait for the same locked row at once.
 */
export const TRANSACTION_CONFLICT_CODES: ReadonlySet<string> = new Set(["P2034", "P2028"]);

/** A transaction error from `TRANSACTION_CONFLICT_CODES` becomes a `CONFLICT` to retry, not a server error. Any other error is returned as is. */
export function toTransactionConflict(error: unknown): unknown {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSACTION_CONFLICT_CODES.has(error.code)
    ? new ConflictException({
        message: "The data was changed at the same time. Try again",
        reason: CONCURRENT_CHANGE_REASON,
      })
    : error;
}
