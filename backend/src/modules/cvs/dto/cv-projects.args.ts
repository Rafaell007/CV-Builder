import { ArgsType, Field, ID } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { SortInput } from "../../../common/pagination";
import { Trim } from "../../../common/validation";

/** `cvProjects(cvId: "...", search: "bank", sort: {...})`. A CV holds few projects, so there is no paging. */
@ArgsType()
export class CvProjectsArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** Matches the name and the domain of the project, without regard to case. */
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
  // `null` when a client sends `sort: null`; `resolveSort` treats it like no sort.
  sort?: SortInput | null;
}
