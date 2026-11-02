import { ValidationFailedException } from "../errors";
import type { PageInput } from "./page.input";
import { SortDirection, type SortInput } from "./sort.input";

export interface ResolvedSort<Field extends string> {
  field: Field;
  direction: "asc" | "desc";
}

/** Prisma's `skip` and `take` for a page. */
export function toSkipTake(page: PageInput): { skip: number; take: number } {
  return { skip: (page.number - 1) * page.size, take: page.size };
}

/**
 * Checks the requested sort field against the ones a module allows, so a client cannot sort by
 * (or probe) any column. Falls back to `defaultSort` when no sort is requested.
 * Build Prisma's orderBy from the result: `{ [sort.field]: sort.direction }`.
 */
export function resolveSort<Field extends string>(
  sort: SortInput | undefined,
  allowedFields: readonly Field[],
  defaultSort: ResolvedSort<Field>,
): ResolvedSort<Field> {
  if (sort === undefined) return defaultSort;

  const field = allowedFields.find((allowed) => allowed === sort.field);
  if (field === undefined) {
    throw new ValidationFailedException([
      {
        field: "sort.field",
        messages: [`sort.field must be one of: ${allowedFields.join(", ")}`],
      },
    ]);
  }
  return { field, direction: sort.direction === SortDirection.DESC ? "desc" : "asc" };
}
