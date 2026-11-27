import type { Catalogs } from "./catalogs";
import { CVS } from "./cvs.data";
import { idOf, type Db, type IdsByName } from "./ids";

// A CV has no unique key, so one that already exists (same owner and name) is left as it is.
export async function seedCvs(
  db: Db,
  catalogs: Catalogs,
  userIds: IdsByName,
  projectIds: IdsByName,
): Promise<void> {
  for (const cv of CVS) {
    const userId = idOf(userIds, cv.ownerEmail);
    const existing = await db.cv.findFirst({ where: { userId, name: cv.name } });
    if (existing) continue;

    // A CV skill must be one of the owner's skills; the mastery comes from there.
    const ownedSkills = await db.userSkill.findMany({ where: { userId } });
    const masteryBySkillId = new Map(ownedSkills.map((owned) => [owned.skillId, owned.mastery]));

    await db.cv.create({
      data: {
        name: cv.name,
        education: cv.education,
        description: cv.description,
        userId,
        skills: {
          create: cv.skills.map((name) => {
            const skillId = idOf(catalogs.skills, name);
            const mastery = masteryBySkillId.get(skillId);
            if (mastery === undefined) {
              throw new Error(
                `CV "${cv.name}" lists "${name}", which ${cv.ownerEmail} does not have.`,
              );
            }
            return { skillId, mastery };
          }),
        },
        projects: {
          create: cv.projects.map((project) => ({
            projectId: idOf(projectIds, project.project),
            startDate: new Date(project.startDate),
            endDate: project.endDate === null ? null : new Date(project.endDate),
            responsibilities: project.responsibilities,
            roles: {
              create: project.roles.map((role) => ({ roleId: idOf(catalogs.roles, role) })),
            },
          })),
        },
      },
    });
  }
}
