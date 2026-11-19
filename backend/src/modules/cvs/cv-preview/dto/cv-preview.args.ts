import { ArgsType } from "@nestjs/graphql";
import { CvIdLocaleArgs } from "../../dto/cv-id-locale.args";

/** `cvPreview(cvId: "...", locale: "pl")`. The query returns one CV, so there is no paging. */
@ArgsType()
export class CvPreviewArgs extends CvIdLocaleArgs {}
