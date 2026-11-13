import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

/** `cvPreview(cvId: "...")`. The query returns one CV, so there is no paging. */
@ArgsType()
export class CvPreviewArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;
}
