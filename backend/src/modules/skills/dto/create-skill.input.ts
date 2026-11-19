import { Field, ID, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { NormalizeSpaces } from "../../../common/validation";

@InputType()
export class CreateSkillInput {
  @Field()
  @NormalizeSpaces()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /** The type of the skill comes from this category; the client never sends a type (page 17). */
  @Field(() => ID)
  @IsUUID()
  categoryId!: string;
}
