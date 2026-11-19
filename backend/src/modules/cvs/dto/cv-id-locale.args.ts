import { ArgsType, Field, ID } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsIn, IsUUID } from "class-validator";
import { CV_LOCALES, DEFAULT_CV_LOCALE } from "../cv-locale";
import type { CvLocale } from "../cv-locale";

/**
 * The arguments that `cvPreview` and `exportCvPdf` share: one CV and the language of the texts the backend
 * builds. This is the only place that decides the default language. A missing `locale` and `locale: null`
 * both become English here, so the services always get a real `CvLocale`.
 */
@ArgsType()
export class CvIdLocaleArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  /** `en` or `pl`. Without it: English. */
  @Field(() => String, { nullable: true })
  @Transform(({ value }: { value: unknown }) => value ?? DEFAULT_CV_LOCALE)
  @IsIn(CV_LOCALES)
  locale: CvLocale = DEFAULT_CV_LOCALE;
}
