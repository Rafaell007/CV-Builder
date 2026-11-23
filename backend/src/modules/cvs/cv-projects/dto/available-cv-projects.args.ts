import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

/** `availableCvProjects(cvId: "...")`. The catalog has no paging here: the modal lists every project that can be added. */
@ArgsType()
export class AvailableCvProjectsArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;
}
