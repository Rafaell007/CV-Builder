import { Field, ID, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { Trim } from "./cv-fields";

/** Checked again on the server, because the checks in the browser are not a security measure (cvs page AC). */
@InputType()
export class CreateCvInput {
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
  description!: string;

  /** Admins only: the owner of the new CV. Without it, the CV belongs to the signed-in user. */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
