import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./validate-environment";

/** The only place in the backend that touches `process.env` (through `@nestjs/config`). */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment })],
})
export class AppConfigModule {}
