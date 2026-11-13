import { Module } from "@nestjs/common";
import { CvPreviewResolver } from "./cv-preview/cv-preview.resolver";
import { CvPreviewService } from "./cv-preview/cv-preview.service";
import { CvProjectsResolver } from "./cv-projects/cv-projects.resolver";
import { CvProjectsService } from "./cv-projects/cv-projects.service";
import { CvSkillsResolver } from "./cv-skills/cv-skills.resolver";
import { CvSkillsService } from "./cv-skills/cv-skills.service";
import { CvsResolver } from "./cvs.resolver";
import { CvsService } from "./cvs.service";

@Module({
  providers: [
    CvsResolver,
    CvsService,
    CvProjectsResolver,
    CvProjectsService,
    CvSkillsResolver,
    CvSkillsService,
    CvPreviewResolver,
    CvPreviewService,
  ],
})
export class CvsModule {}
