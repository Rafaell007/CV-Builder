import { Module } from "@nestjs/common";
import { CvProjectsResolver } from "./cv-projects.resolver";
import { CvProjectsService } from "./cv-projects.service";
import { CvSkillsResolver } from "./cv-skills.resolver";
import { CvSkillsService } from "./cv-skills.service";
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
  ],
})
export class CvsModule {}
