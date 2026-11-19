import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsIn, IsOptional, IsUUID } from "class-validator";
import { CV_LOCALES } from "../../cv-locale";
import type { CvLocale } from "../../cv-locale";

/** `cvPreview(cvId: "...", locale: "pl")`. The query returns one CV, so there is no paging. */
@ArgsType()
export class CvPreviewArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** The language of the texts that the backend builds (the open period word): `en` or `pl`. Without it: English. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(CV_LOCALES)
  locale?: CvLocale;
}
