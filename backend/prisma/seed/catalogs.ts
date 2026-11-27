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

  // Not an upsert: an upsert matches one unique field only. An admin may rename "English" or change its
  // code "EN", so a seed language is found by its ISO code or its name; creating it again would fail on
  // the other unique index.
  const languageRows = await Promise.all(
    LANGUAGES.map(
      async (language) =>
        (await db.language.findFirst({
          where: { OR: [{ iso: language.iso }, { name: language.name }] },
          select: { id: true },
        })) ?? db.language.create({ data: language, select: { id: true } }),
    ),
  );
  // Keyed by the seed's own name: the stored name may differ (renamed, or other letter case with
  // citext, D35), and the later seed steps look languages up by the seed's name.
  const languages = new Map(
    LANGUAGES.map((language, index) => [language.name, languageRows[index]!.id]),
  );

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
    // Keyed by the seed's own name: with citext (D35) the upsert also matches a stored name in other
    // letter case, so `row.name` can differ from the name the later seed steps look up.
    category.skills.forEach((name, index) => skills.set(name, skillRows[index]!.id));
  }

  return { departments, positions, roles, skills, languages };
}
