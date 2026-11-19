import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

/** `exportCvPdf(cvId: "...")`. */
@ArgsType()
export class CvPdfArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;
}
