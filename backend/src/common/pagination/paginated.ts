import { Type } from "@nestjs/common";
import { Field, Int, ObjectType } from "@nestjs/graphql";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * Base class for the output of a list query: `{ items, total }`.
 * Usage: `@ObjectType() export class UserPage extends Paginated(User) {}`
 */
export function Paginated<T>(itemClass: Type<T>): abstract new () => PaginatedResult<T> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedPage implements PaginatedResult<T> {
    @Field(() => [itemClass])
    items!: T[];

    @Field(() => Int)
    total!: number;
  }

  return PaginatedPage;
}
