import { ConflictException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { CONCURRENT_CHANGE_REASON, toTransactionConflict } from "./transaction-conflict";

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

describe("toTransactionConflict", () => {
  it.each([
    ["P2034", "a deadlock or write conflict"],
    ["P2028", "a transaction that did not finish in time"],
  ])("turns %s (%s) into a CONFLICT to retry", (code) => {
    const result = toTransactionConflict(databaseError(code));

    expect(result).toBeInstanceOf(ConflictException);
    expect((result as ConflictException).getResponse()).toEqual({
      message: "The data was changed at the same time. Try again",
      reason: CONCURRENT_CHANGE_REASON,
    });
  });

  it("returns another database error as is", () => {
    const failure = databaseError("P2002");

    expect(toTransactionConflict(failure)).toBe(failure);
  });

  it("returns an error that is not from the database as is", () => {
    const failure = new Error("connection lost");

    expect(toTransactionConflict(failure)).toBe(failure);
  });
});
