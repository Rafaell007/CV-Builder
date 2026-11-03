import { Field, ID, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

/** Checked again on the server, because the checks in the browser are not a security measure (projects page AC-15 to AC-23). */
@InputType()
export class CreateProjectInput {
  @Field()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Field()
  @Transform(trim)
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
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  /** Ids of the skills that make up the environment. Optional; the service checks that each one exists. */
  @Field(() => [ID], { defaultValue: [] })
  @IsArray()
  @ArrayUnique()
  @IsUUID("all", { each: true })
  environmentIds: string[] = [];
}
