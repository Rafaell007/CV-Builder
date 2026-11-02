import type { Catalogs } from "./catalogs";
import { idOf, type Db, type IdsByName } from "./ids";
import { PROJECTS } from "./projects.data";

// Project names are not unique in the schema, so the seed looks a project up by name before creating it.
export async function seedProjects(db: Db, catalogs: Catalogs): Promise<IdsByName> {
  const projectIds = new Map<string, string>();

  for (const project of PROJECTS) {
    const existing = await db.project.findFirst({ where: { name: project.name } });
    const { id: projectId } =
      existing ??
      (await db.project.create({
        data: {
          name: project.name,
          domain: project.domain,
          description: project.description,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
        },
      }));
    projectIds.set(project.name, projectId);

    await db.projectSkill.createMany({
      data: project.skills.map((skill) => ({ projectId, skillId: idOf(catalogs.skills, skill) })),
      skipDuplicates: true,
    });
  }

  return projectIds;
}
