import { Module } from "@nestjs/common";
import { ThrottlingModule } from "../../common/throttling";
import { CvPdfRenderer } from "./cv-pdf/cv-pdf-renderer";
import { CvPdfResolver } from "./cv-pdf/cv-pdf.resolver";
import { CvPdfService } from "./cv-pdf/cv-pdf.service";
import { CvPreviewResolver } from "./cv-preview/cv-preview.resolver";
import { CvPreviewService } from "./cv-preview/cv-preview.service";
import { CvProjectsResolver } from "./cv-projects/cv-projects.resolver";
import { CvProjectsService } from "./cv-projects/cv-projects.service";
import { CvSkillsResolver } from "./cv-skills/cv-skills.resolver";
import { CvSkillsService } from "./cv-skills/cv-skills.service";
import { CvsResolver } from "./cvs.resolver";
import { CvsService } from "./cvs.service";

@Module({
  imports: [ThrottlingModule], // the rate limit of `exportCvPdf`
  providers: [
    CvsResolver,
    CvsService,
    CvProjectsResolver,
    CvProjectsService,
    CvSkillsResolver,
    CvSkillsService,
    CvPreviewResolver,
    CvPreviewService,
    CvPdfResolver,
    CvPdfService,
    CvPdfRenderer,
  ],
})
export class CvsModule {}
