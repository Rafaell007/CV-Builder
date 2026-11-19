import { ArgsType } from "@nestjs/graphql";
import { CvIdLocaleArgs } from "../../dto/cv-id-locale.args";

/** `exportCvPdf(cvId: "...", locale: "pl")`. The language is the one of the fixed texts in the PDF. */
@ArgsType()
export class CvPdfArgs extends CvIdLocaleArgs {}
