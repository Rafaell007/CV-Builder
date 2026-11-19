import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import type { CvLocale } from "../cv-locale";
import { CvPreviewService } from "../cv-preview/cv-preview.service";
import { buildCvPdfDefinition } from "./cv-pdf-document";
import { toPdfFileName } from "./cv-pdf-file-name";
import { CvPdfRenderer } from "./cv-pdf-renderer";
import type { CvPdf } from "./models/cv-pdf";

/**
 * Makes the PDF of a CV (CV preview page, EXPORT PDF). The data comes from `CvPreviewService.get`,
 * the same call as the preview page. That call checks access first: the owner and admins may read
 * the CV, anyone else gets NOT_FOUND, and no PDF is made. So the PDF and the preview cannot differ,
 * and the PDF cannot be made for a CV the user may not see.
 */
@Injectable()
export class CvPdfService {
  private readonly logger = new Logger(CvPdfService.name);

  constructor(
    private readonly preview: CvPreviewService,
    private readonly renderer: CvPdfRenderer,
  ) {}

  async export(user: AuthUser, cvId: string, locale: CvLocale): Promise<CvPdf> {
    // Errors of this call (NOT_FOUND, FORBIDDEN) pass on unchanged. Only the PDF step is wrapped below.
    const preview = await this.preview.get(user, cvId, locale);

    try {
      const bytes = await this.renderer.render(buildCvPdfDefinition(preview, locale));
      return { fileName: toPdfFileName(preview.name), base64: bytes.toString("base64") };
    } catch (error) {
      // The details go to the log only. The client gets a message without internal information.
      this.logger.error(`PDF of CV ${cvId} failed`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException("The PDF could not be generated");
    }
  }
}
