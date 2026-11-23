import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

const PROJECTS =
  "query Projects($search: String, $page: PageInput!) { projects(search: $search, page: $page) { items { id name } } }";
const ROLES = "query Roles { projectRoles { id name } }";
const ADD =
  "mutation AddCvProject($input: AddCvProjectInput!) { addCvProject(input: $input) { id } }";

export interface CvProjectEntry {
  /** The name of a catalog project (the seed has Banking Portal, E-commerce Marketplace, ...). */
  project: string;
  /** A day inside the days of the project, as `YYYY-MM-DD`. */
  startDate: string;
  /** A day inside the days of the project, as `YYYY-MM-DD`. Leave it out for a project that is not finished. */
  endDate?: string;
  roles: string[];
  responsibilities?: string;
}

/**
 * Adds projects to a CV through the API, so a spec does not click through the Add project modal for its set-up.
 * The context must hold an Admin session: this helper reads the catalog with the admin only `projects` query, and an
 * admin may change the CV of any user. (An employee reads the options of their own CV with `availableCvProjects`, KAN-156.) The entries go away with their CV (`deleteCvsByName`), so no clean-up is needed.
 */
export async function addCvProjectsByName(
  adminContext: BrowserContext,
  cvId: string,
  entries: CvProjectEntry[],
): Promise<void> {
  const { projectRoles } = await graphql<{ projectRoles: { id: string; name: string }[] }>(
    adminContext,
    ROLES,
    {},
  );
  for (const entry of entries) {
    const { projects } = await graphql<{ projects: { items: { id: string; name: string }[] } }>(
      adminContext,
      PROJECTS,
      { search: entry.project, page: { number: 1, size: 100 } },
    );
    const project = projects.items.find((candidate) => candidate.name === entry.project);
    if (!project) throw new Error(`The catalog has no project named ${entry.project}`);
    const roleIds = entry.roles.map((name) => {
      const role = projectRoles.find((candidate) => candidate.name === name);
      if (!role) throw new Error(`The catalog has no role named ${name}`);
      return role.id;
    });
    await graphql(adminContext, ADD, {
      input: {
        cvId,
        projectId: project.id,
        startDate: `${entry.startDate}T00:00:00.000Z`,
        endDate: entry.endDate ? `${entry.endDate}T00:00:00.000Z` : null,
        responsibilities: entry.responsibilities ?? null,
        roleIds,
      },
    });
  }
}
