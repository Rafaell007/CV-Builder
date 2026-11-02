import {
  DEPARTMENTS,
  LANGUAGES,
  POSITIONS,
  PROJECT_ROLES,
  SKILL_CATEGORIES,
} from "./catalogs.data";
import type { Db, IdsByName } from "./ids";

export interface Catalogs {
  departments: IdsByName;
  positions: IdsByName;
  roles: IdsByName;
  skills: IdsByName;
  languages: IdsByName;
}

// upsert on the unique name keeps the seed safe to run twice.
async function seedNames(
  names: string[],
  upsert: (name: string) => Promise<{ id: string; name: string }>,
): Promise<IdsByName> {
  const rows = await Promise.all(names.map(upsert));
  return new Map(rows.map((row) => [row.name, row.id]));
}

export async function seedCatalogs(db: Db): Promise<Catalogs> {
  const departments = await seedNames(DEPARTMENTS, (name) =>
    db.department.upsert({ where: { name }, update: {}, create: { name } }),
  );
  const positions = await seedNames(POSITIONS, (name) =>
    db.position.upsert({ where: { name }, update: {}, create: { name } }),
  );
  const roles = await seedNames(PROJECT_ROLES, (name) =>
    db.projectRole.upsert({ where: { name }, update: {}, create: { name } }),
  );

  const languageRows = await Promise.all(
    LANGUAGES.map((language) =>
      db.language.upsert({ where: { name: language.name }, update: {}, create: language }),
    ),
  );
  const languages = new Map(languageRows.map((row) => [row.name, row.id]));

  const skills = new Map<string, string>();
  for (const category of SKILL_CATEGORIES) {
    const { id: categoryId } = await db.skillCategory.upsert({
      where: { name: category.name },
      update: {},
      create: { name: category.name, type: category.type },
    });
    const skillRows = await Promise.all(
      category.skills.map((name) =>
        db.skill.upsert({ where: { name }, update: {}, create: { name, categoryId } }),
      ),
    );
    skillRows.forEach((row) => skills.set(row.name, row.id));
  }

  return { departments, positions, roles, skills, languages };
}
