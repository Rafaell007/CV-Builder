import { Field, ID, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { Trim } from "../../../common/validation";
import { PasswordRule } from "../../auth/dto/password-rule";
import { Role } from "../../auth/models/role.enum";

/**
 * An admin creates a user (users page, Create User modal). Every field is required and checked again here, because
 * the checks in the browser are not a security measure. The new user starts verified (D16).
 */
@InputType()
export class CreateUserInput {
  /** Trimmed and lowercased, like sign-up, so sign-in (which lowercases too) finds the user. */
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;

  /** The D33 rule of every new password (8–128 characters, a letter and a digit), not the doc's "at least 6". */
  @Field()
  @PasswordRule()
  password!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @Field(() => ID)
  @IsUUID()
  departmentId!: string;

  @Field(() => ID)
  @IsUUID()
  positionId!: string;

  @Field(() => Role)
  @IsEnum(Role)
  role!: Role;
}
