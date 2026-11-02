import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { Environment } from "./config";
import { configureApp } from "./configure-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  const config = app.get<ConfigService<Environment, true>>(ConfigService);
  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
