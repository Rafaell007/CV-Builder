import { INestApplication } from "@nestjs/common";
import { hashPassword } from "../../src/modules/auth/password";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";

export const TEST_PASSWORD = "Password123!";

/** Inserts a user that can sign in with `TEST_PASSWORD`. */
export async function createUser(
  app: INestApplication,
  overrides: { email?: string; role?: Role; isVerified?: boolean } = {},
): Promise<{ id: string; email: string }> {
  return app.get(PrismaService).user.create({
    data: {
      email: overrides.email ?? "user@example.com",
      passwordHash: await hashPassword(TEST_PASSWORD),
      role: overrides.role ?? Role.USER,
      isVerified: overrides.isVerified ?? true,
    },
    select: { id: true, email: true },
  });
}
