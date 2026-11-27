import "dotenv/config";
import { assertSeedAllowed } from "./seed/guard";

// Runs before `prisma migrate reset` in db:reset: the reset drops the data before the seed guard can refuse.
// Runs outside Nest (Prisma CLI), so it reads process.env itself.
const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env.");
}
assertSeedAllowed(connectionString, process.env);
