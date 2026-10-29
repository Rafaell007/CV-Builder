import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Not env(): it throws while loading the config, which would break `prisma generate` in CI where
    // there is no .env. Only migrate / db commands need a real URL. This file is Prisma CLI config
    // and runs outside Nest, so it reads process.env itself.
    url: process.env["DATABASE_URL"] ?? "",
  },
});
