import type { PrismaClient } from "../../src/generated/prisma/client";

export type Db = PrismaClient;

// Name -> id of the rows a seed step created, so later steps can link to them.
export type IdsByName = ReadonlyMap<string, string>;

// A wrong name in the seed data should stop the seed, not create a half-linked row.
export function idOf(ids: IdsByName, name: string): string {
  const id = ids.get(name);
  if (id === undefined) {
    throw new Error(`Seed data refers to "${name}", which was not seeded.`);
  }
  return id;
}
