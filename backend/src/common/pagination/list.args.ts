import { ArgsType, Field } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { PageInput } from "./page.input";
import { SortInput } from "./sort.input";
import { Trim } from "../validation";

/** The arguments of every list query (PLAN.md §3): `users(search: "ada", sort: {...}, page: {...})`. */
@ArgsType()
export class ListArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Trim()
  search?: string;

  @Field(() => SortInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortInput)
  // `null` when a client sends `sort: null` (the argument is nullable); `resolveSort` treats it like no sort.
  sort?: SortInput | null;

  @Field(() => PageInput, { defaultValue: new PageInput() })
  @ValidateNested()
  @Type(() => PageInput)
  page: PageInput = new PageInput();
}
