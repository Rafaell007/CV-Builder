import type { Prisma } from "../../generated/prisma/client";
import type { Project } from "./models/project";

/** Prisma `include` that loads the environment (the skills) of a project, ordered by skill name. */
export const WITH_ENVIRONMENT = {
  skills: {
    select: { skill: { select: { id: true, name: true } } },
    orderBy: { skill: { name: "asc" } },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof WITH_ENVIRONMENT }>;

/** A project row as the API returns it: the environment is a plain list of skills. */
export function toProject({ skills, ...project }: ProjectRow): Project {
  return { ...project, environment: skills.map(({ skill }) => skill) };
}
