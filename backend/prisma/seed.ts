import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCatalogs } from "./seed/catalogs";
import { seedCvs } from "./seed/cvs";
import { seedProjects } from "./seed/projects";
import { seedUsers } from "./seed/users";

async function main(): Promise<void> {
  // Runs outside Nest (Prisma CLI), so it builds the client like PrismaService and reads process.env itself.
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env.");
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const catalogs = await seedCatalogs(db);
    const userIds = await seedUsers(db, catalogs);
    const projectIds = await seedProjects(db, catalogs);
    await seedCvs(db, catalogs, userIds, projectIds);
    console.log(
      `Seeded ${userIds.size} users, ${catalogs.skills.size} skills, ${catalogs.languages.size} languages, ${projectIds.size} projects.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
