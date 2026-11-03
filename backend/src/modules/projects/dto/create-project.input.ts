import { Field, ID, InputType } from "@nestjs/graphql";
import { Trim } from "../../../common/validation";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export const MAX_ENVIRONMENT_SKILLS = 50;

/** Checked again on the server, because the checks in the browser are not a security measure (projects page AC-15 to AC-23). */
@InputType()
export class CreateProjectInput {
  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  domain!: string;

  @Field()
  @IsDate()
  startDate!: Date;

  @Field()
  @IsDate()
  endDate!: Date;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  /** Ids of the skills that make up the environment. Optional, at most 50; the service checks that each one exists. */
  @Field(() => [ID], { defaultValue: [] })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_ENVIRONMENT_SKILLS)
  @IsUUID("all", { each: true })
  environmentIds: string[] = [];
}
