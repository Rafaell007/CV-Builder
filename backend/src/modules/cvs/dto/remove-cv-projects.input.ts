import { Field, ID, InputType } from "@nestjs/graphql";
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from "class-validator";

export const MAX_REMOVED_CV_PROJECTS = 100;

/** The CV is part of the input, so the service can check that every id belongs to that CV. */
@InputType()
export class RemoveCvProjectsInput {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** Ids of CV projects, not of catalog projects. */
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_REMOVED_CV_PROJECTS)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];
}
