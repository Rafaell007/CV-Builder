import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, Max, Min } from "class-validator";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Which slice of a list to return; `number` starts at 1. */
@InputType()
export class PageInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  number = 1;

  @Field(() => Int, { defaultValue: DEFAULT_PAGE_SIZE })
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  size = DEFAULT_PAGE_SIZE;
}
