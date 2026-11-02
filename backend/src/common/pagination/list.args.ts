import { ArgsType, Field } from "@nestjs/graphql";
import { Transform, Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { PageInput } from "./page.input";
import { SortInput } from "./sort.input";

/** The arguments of every list query (PLAN.md §3): `users(search: "ada", sort: {...}, page: {...})`. */
@ArgsType()
export class ListArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  search?: string;

  @Field(() => SortInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortInput)
  sort?: SortInput;

  @Field(() => PageInput, { defaultValue: new PageInput() })
  @ValidateNested()
  @Type(() => PageInput)
  page: PageInput = new PageInput();
}
