import { Field, ID, InputType } from "@nestjs/graphql";
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from "class-validator";
import { MAX_REMOVED_USER_SKILLS } from "../user-skills.constants";

/** The user is part of the input, so the service can check that every id belongs to that user. */
@InputType()
export class RemoveUserSkillsInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  /** Ids of user-skill links, not of catalog skills. */
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_REMOVED_USER_SKILLS)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];
}
