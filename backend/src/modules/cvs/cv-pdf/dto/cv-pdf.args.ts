import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsIn, IsOptional, IsUUID } from "class-validator";
import { PDF_LOCALES } from "../cv-pdf-labels";
import type { PdfLocale } from "../cv-pdf-labels";

/** `exportCvPdf(cvId: "...", locale: "pl")`. */
@ArgsType()
export class CvPdfArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** The language of the fixed texts in the PDF: `en` or `pl`. Without it the PDF is in English. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(PDF_LOCALES)
  locale?: PdfLocale;
}
