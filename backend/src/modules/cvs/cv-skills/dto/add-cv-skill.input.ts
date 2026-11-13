import { Field, ID, InputType } from "@nestjs/graphql";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { Mastery } from "../../skills/models/mastery.enum";

@InputType()
export class AddCvSkillInput {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  @Field(() => ID)
  @IsUUID("all", { message: "Skill is required" })
  skillId!: string;

  /** Without a level, the CV gets the level that the owner has for the skill. */
  @Field(() => Mastery, { nullable: true })
  @IsOptional()
  @IsEnum(Mastery)
  mastery?: Mastery | null;
}
