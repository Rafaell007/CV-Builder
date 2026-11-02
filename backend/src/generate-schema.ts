import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/**
 * Boots the app without listening on a port. GraphQLModule writes backend/schema.gql while it starts (D3),
 * so this regenerates the contract exactly as the running app would. CI uses it to check that the committed
 * file is current. Needs DATABASE_URL, like the app.
 */
async function generateSchema(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
  await app.init();
  await app.close();
}

generateSchema().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
