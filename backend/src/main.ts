import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Port is fixed until S0.2 adds the validated config module (the only place allowed to read env).
const PORT = 4000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}

void bootstrap();
