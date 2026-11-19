import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { requireUser } from "../../../common/auth";
import { CvPdfService } from "./cv-pdf.service";
import { CvPdfArgs } from "./dto/cv-pdf.args";
import { CvPdf } from "./models/cv-pdf";

/** A query, not a mutation: it changes no data. It needs a session only, like `cvPreview`. */
@Resolver(() => CvPdf)
export class CvPdfResolver {
  constructor(private readonly service: CvPdfService) {}

  @Query(() => CvPdf)
  exportCvPdf(
    @CurrentUser() user: AuthUser | undefined,
    @Args() { cvId, locale }: CvPdfArgs,
  ): Promise<CvPdf> {
    return this.service.export(requireUser(user), cvId, locale);
  }
}
