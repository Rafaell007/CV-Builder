import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CvProjectDetailsInput } from "./cv-project-details.input";

/** Replaces the dates, roles and responsibilities of one CV project. The project cannot change (AC-19). */
@InputType()
export class UpdateCvProjectInput extends CvProjectDetailsInput {
  /** The id of the CV project, not of the catalog project. */
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
