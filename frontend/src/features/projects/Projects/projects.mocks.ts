import type { MockLink } from "@apollo/client/testing";
import { ProjectsDocument, type ProjectsQuery } from "@/shared/graphql";
import type { ProjectListItem } from "./projects.types";

export const blog: ProjectListItem = {
  __typename: "Project",
  id: "1",
  name: "Blog",
  domain: "Blogging",
  startDate: "2025-12-31T00:00:00.000Z",
  endDate: "2026-05-31T00:00:00.000Z",
  description: "A dynamic blogging website.",
  environment: [
    { __typename: "EnvironmentSkill", id: "10", name: "HTML5" },
    { __typename: "EnvironmentSkill", id: "11", name: "TypeScript" },
  ],
};

export const sales: ProjectListItem = {
  __typename: "Project",
  id: "2",
  name: "Cloud Sales Management",
  domain: "CRM",
  startDate: "2025-04-15T00:00:00.000Z",
  endDate: "2025-12-31T00:00:00.000Z",
  description: "A system for customer interactions.",
  environment: [],
};

export const projectsData = (items: ProjectListItem[]): ProjectsQuery => ({
  projects: { __typename: "ProjectPage", items, total: items.length },
});

/** MockedProvider response of the `Projects` query. */
export const projectsMock = (items: ProjectListItem[]): MockLink.MockedResponse => ({
  request: { query: ProjectsDocument },
  result: { data: projectsData(items) },
});

/** MockedProvider response for a request that fails. */
export const projectsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: ProjectsDocument },
  error: new Error("Failed to fetch"),
});
