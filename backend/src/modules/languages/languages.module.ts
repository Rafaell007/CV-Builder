import { Module } from "@nestjs/common";
import { LanguagesResolver } from "./languages.resolver";
import { LanguagesService } from "./languages.service";

@Module({
  providers: [LanguagesResolver, LanguagesService],
})
export class LanguagesModule {}
