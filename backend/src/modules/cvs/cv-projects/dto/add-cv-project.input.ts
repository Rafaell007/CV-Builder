import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CvProjectDetailsInput } from "./cv-project-details.input";

@InputType()
export class AddCvProjectInput extends CvProjectDetailsInput {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  @Field(() => ID)
  @IsUUID("all", { message: "Project is required" })
  projectId!: string;
}
