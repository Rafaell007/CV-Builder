import { Module } from "@nestjs/common";
import { CvsResolver } from "./cvs.resolver";
import { CvsService } from "./cvs.service";

@Module({ providers: [CvsResolver, CvsService] })
export class CvsModule {}
