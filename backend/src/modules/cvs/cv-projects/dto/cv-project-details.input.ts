import { Field, ID, InputType } from "@nestjs/graphql";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Trim } from "../../../../common/validation";

/** Same cap as the description of a CV. The database column has no limit, so the API sets one. */
export const MAX_RESPONSIBILITIES_LENGTH = 2000;
export const MAX_ROLES_PER_CV_PROJECT = 50;

/**
 * The fields of a CV project that the person can change, shared by add and update. The
 * dates are checked against the project in the service, because that needs the stored project
 * (CV projects page AC-15, AC-16, AC-34).
 */
@InputType({ isAbstract: true })
export class CvProjectDetailsInput {
  @Field()
  @IsDate({ message: "Start date is required" })
  startDate!: Date;

  /** Empty means "Present". */
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date | null;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1, { message: "At least one role must be selected" })
  @ArrayMaxSize(MAX_ROLES_PER_CV_PROJECT)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  roleIds!: string[];

  /** Optional. The service stores an empty text as "no responsibilities". */
  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_RESPONSIBILITIES_LENGTH, {
    message: `Responsibilities must not exceed ${MAX_RESPONSIBILITIES_LENGTH} characters`,
  })
  responsibilities?: string | null;
}
