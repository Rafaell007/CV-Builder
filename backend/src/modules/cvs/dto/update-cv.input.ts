import { Field, ID, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { Trim } from "../../../common/validation";
import { MAX_DESCRIPTION_LENGTH } from "./cv-fields";

/** The owner of a CV cannot be changed. */
@InputType()
export class UpdateCvInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "Education is required" })
  @MaxLength(255, { message: "Education must not exceed 255 characters" })
  education!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty({ message: "Description is required" })
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  description!: string;
}
