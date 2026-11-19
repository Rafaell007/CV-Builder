import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsIn, IsOptional, IsUUID } from "class-validator";
import { CV_LOCALES } from "../../cv-locale";
import type { CvLocale } from "../../cv-locale";

/** `exportCvPdf(cvId: "...", locale: "pl")`. */
@ArgsType()
export class CvPdfArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** The language of the fixed texts in the PDF: `en` or `pl`. Without it the PDF is in English. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(CV_LOCALES)
  locale?: CvLocale;
}
