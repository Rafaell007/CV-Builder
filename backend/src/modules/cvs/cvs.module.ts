import { Module } from "@nestjs/common";
import { CvProjectsResolver } from "./cv-projects/cv-projects.resolver";
import { CvProjectsService } from "./cv-projects/cv-projects.service";
import { CvsResolver } from "./cvs.resolver";
import { CvsService } from "./cvs.service";

@Module({ providers: [CvsResolver, CvsService, CvProjectsResolver, CvProjectsService] })
export class CvsModule {}
