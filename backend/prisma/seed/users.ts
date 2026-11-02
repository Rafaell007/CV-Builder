import { hash } from "@node-rs/argon2";
import type { Catalogs } from "./catalogs";
import { SEED_PASSWORD } from "./credentials";
import { idOf, type Db, type IdsByName } from "./ids";
import { USERS } from "./users.data";

// Seed users start verified: they cannot receive a verification code first (D16).
export async function seedUsers(db: Db, catalogs: Catalogs): Promise<IdsByName> {
  // One hash for everyone: argon2 salts it, so a single hash is still valid for each account.
  const passwordHash = await hash(SEED_PASSWORD);
  const userIds = new Map<string, string>();

  for (const user of USERS) {
    const profile = {
      role: user.role,
      isVerified: true,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: idOf(catalogs.departments, user.department),
      positionId: idOf(catalogs.positions, user.position),
    };
    const { id: userId } = await db.user.upsert({
      where: { email: user.email },
      update: { ...profile, passwordHash },
      create: { email: user.email, passwordHash, ...profile },
    });
    userIds.set(user.email, userId);

    await db.userSkill.createMany({
      data: user.skills.map(([skill, mastery]) => ({
        userId,
        skillId: idOf(catalogs.skills, skill),
        mastery,
      })),
      skipDuplicates: true,
    });
    await db.userLanguage.createMany({
      data: user.languages.map(([language, proficiency]) => ({
        userId,
        languageId: idOf(catalogs.languages, language),
        proficiency,
      })),
      skipDuplicates: true,
    });
  }

  return userIds;
}
