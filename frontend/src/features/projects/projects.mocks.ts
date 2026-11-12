import type { MockLink } from "@apollo/client/testing";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import {
  CreateProjectDocument,
  type CreateProjectInput,
  DeleteProjectDocument,
  ProjectsDocument,
  type ProjectsQuery,
  type ProjectsQueryVariables,
} from "@/shared/graphql";
import {
  DEFAULT_PROJECTS_SORT,
  MAX_DESCRIPTION_LENGTH,
  MAX_DOMAIN_LENGTH,
  MAX_NAME_LENGTH,
} from "./projects.constants";
import type { ProjectListItem } from "./projects.types";

const skill = (id: string, name: string) => ({
  __typename: "EnvironmentSkill" as const,
  id,
  name,
});

// The first two projects are the rows of the Figma Projects list, so a story can be compared with the design.
export const blog: ProjectListItem = {
  __typename: "Project",
  id: "1",
  name: "Blog",
  domain: "Blogging",
  startDate: "2025-12-31T00:00:00.000Z",
  endDate: "2026-05-31T00:00:00.000Z",
  description:
    "A dynamic blogging website that provides users with a platform to create, publish and share written content. The application has a modern interface that allows users to easily write and organize their articles by categories or tags. Readers can participate in discussions through comments and share articles on social media. The site is responsive, making it easy to read on all devices, and offers customizable themes for personalization.",
  environment: [
    skill("10", "HTML5"),
    skill("11", "CSS3"),
    skill("12", "TypeScript"),
    skill("13", "React"),
    skill("14", "Zustand"),
    skill("15", "Firebase"),
  ],
};

export const sales: ProjectListItem = {
  __typename: "Project",
  id: "2",
  name: "Cloud Sales Management",
  domain: "CRM (Customer RM)",
  startDate: "2025-04-15T00:00:00.000Z",
  endDate: "2025-12-31T00:00:00.000Z",
  description:
    "This system offer numerous benefits for businesses looking to streamline operations and improve customer interactions. System can centralize customer data, providing a comprehensive view of each client's journey, preferences, and history with the company.",
  environment: [skill("12", "TypeScript"), skill("13", "React"), skill("16", "MobX")],
};

/** About 160 characters: a short description that still fills two lines on a tablet. */
export const analytics: ProjectListItem = {
  __typename: "Project",
  id: "4",
  name: "Logistics Analytics Dashboard",
  domain: "Logistics",
  startDate: "2024-02-01T00:00:00.000Z",
  endDate: "2024-11-30T00:00:00.000Z",
  description:
    "A dashboard for dispatchers that shows live shipment status, delivery delays and fleet usage in charts, with exports to CSV for the weekly reports of the team.",
  environment: [skill("12", "TypeScript"), skill("13", "React"), skill("17", "PostgreSQL")],
};

/** About 560 characters: long enough to be cut after three lines on a tablet in the Figma design. */
export const banking: ProjectListItem = {
  __typename: "Project",
  id: "5",
  name: "Mobile Banking Platform",
  domain: "Finance",
  startDate: "2022-01-10T00:00:00.000Z",
  endDate: "2023-06-30T00:00:00.000Z",
  description:
    "A secure mobile banking platform for a retail bank. Customers see the balance of every account, make transfers between their own accounts and to other banks, set up standing orders and download statements. The platform sends a push message for each card payment and asks for a second confirmation for large transfers. Administrators of the bank manage limits, block cards and review the audit log of every change. The system keeps the data of customers in separate services and supports English and Polish texts.",
  environment: [
    skill("12", "TypeScript"),
    skill("13", "React"),
    skill("17", "PostgreSQL"),
    skill("18", "Docker"),
    skill("19", "Kubernetes"),
  ],
};

/** Mock projects whose descriptions have 100 characters or more, in the order of a list. */
export const sampleProjects: ProjectListItem[] = [blog, sales, analytics, banking];

/** Text of exactly `length` characters, made of words, so it wraps like real text. */
const textOfLength = (length: number, words: string): string =>
  `${`${words} `.repeat(Math.ceil(length / words.length)).slice(0, length - 1)}.`;

// The longest values the project form allows; the numbers live in `projects.constants.ts`.
export { MAX_DESCRIPTION_LENGTH, MAX_DOMAIN_LENGTH, MAX_NAME_LENGTH };

/** A project that uses the longest allowed texts and many tags, one of them with a very long name. */
export const maxLengthProject: ProjectListItem = {
  __typename: "Project",
  id: "3",
  name: textOfLength(MAX_NAME_LENGTH, "Customer portal for a large retail bank"),
  domain: textOfLength(MAX_DOMAIN_LENGTH, "Financial services and regulated markets"),
  startDate: "2020-01-01T00:00:00.000Z",
  endDate: "2026-12-31T00:00:00.000Z",
  description: textOfLength(
    MAX_DESCRIPTION_LENGTH,
    "A dynamic project description with enough words to wrap over many lines",
  ),
  environment: [
    "HTML5",
    "CSS3",
    "TypeScript",
    "React",
    "Zustand",
    "Firebase",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "GitHub Actions",
    "Amazon Web Services Elastic Container Service for Kubernetes",
  ].map((name, index) => ({ __typename: "EnvironmentSkill" as const, id: `3${index}`, name })),
};

/** The variables of the first request of the page: page 1 of 10 rows, sorted by name ascending. No search: it is left out. */
export const defaultVariables: ProjectsQueryVariables = {
  page: { number: 1, size: 10 },
  sort: DEFAULT_PROJECTS_SORT,
};

/** Variables for a search, a sort or a page. A MockedProvider answers only a request with the same variables. */
export const variablesFor = (
  changes: Partial<ProjectsQueryVariables> = {},
): ProjectsQueryVariables => ({ ...defaultVariables, ...changes });

export const projectsData = (items: ProjectListItem[], total = items.length): ProjectsQuery => ({
  projects: { __typename: "ProjectPage", items, total },
});

interface MockOptions {
  variables?: ProjectsQueryVariables;
  /** Number of projects on all pages (default: the number of items). */
  total?: number;
}

/** MockedProvider response of the `Projects` query. */
export const projectsMock = (
  items: ProjectListItem[],
  { variables = defaultVariables, total }: MockOptions = {},
): MockLink.MockedResponse => ({
  request: { query: ProjectsDocument, variables },
  result: { data: projectsData(items, total) },
});

/** `count` generated projects with unique names, so the pages of a list can be shown. */
export const manyProjects = (count: number): ProjectListItem[] =>
  Array.from({ length: count }, (_, index) => {
    const base = sampleProjects[index % sampleProjects.length]!;
    const number = String(index + 1).padStart(2, "0");
    return { ...base, id: `gen-${number}`, name: `${base.name} ${number}` };
  });

/**
 * A stand-in for the backend, for stories: it answers every request, whatever the search, the sort or the page,
 * with the rules of the real backend (search in name and domain without regard to case, sort by name, start
 * date or end date, name ascending by default, 10 rows on a page). It lives here, in the mocks, so a story
 * works when the user types or clicks. The page itself never filters, sorts or cuts pages.
 */
export const fakeBackendMock = (
  all: ProjectListItem[],
  /** Called with the variables of every request, so a test can count the requests. */
  onRequest?: (variables: ProjectsQueryVariables) => void,
): MockLink.MockedResponse => ({
  // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
  request: { query: ProjectsDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: ProjectsQueryVariables) => {
    onRequest?.(variables);
    const search = variables.search?.trim().toLowerCase();
    const matching = search
      ? all.filter(
          (project) =>
            project.name.toLowerCase().includes(search) ||
            project.domain.toLowerCase().includes(search),
        )
      : all;

    const { field, direction } = variables.sort ?? { field: "name", direction: "ASC" };
    const key = (project: ProjectListItem): string =>
      project[field === "startDate" || field === "endDate" ? field : "name"];
    const sorted = [...matching].sort(
      (a, b) => key(a).localeCompare(key(b)) * (direction === "DESC" ? -1 : 1),
    );

    // Same default as the backend PageInput: page 1, 10 rows.
    const number = variables.page.number ?? 1;
    const size = variables.page.size ?? DEFAULT_PAGE_SIZE;
    const items = sorted.slice((number - 1) * size, number * size);
    return { data: projectsData(items, matching.length) };
  },
});

/** MockedProvider response for a request that fails. */
export const projectsErrorMock = (
  variables: ProjectsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: ProjectsDocument, variables },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `deleteProject` for the project with this id. */
export const deleteProjectMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteProjectDocument, variables: { id } },
  result: { data: { deleteProject: true } },
});

/** `deleteProject` refused with a GraphQL error, for example `CONFLICT` when a CV uses the project. */
export const deleteProjectRefusedMock = (
  id: string,
  { code = "CONFLICT", message = "The project is used in 1 CV" } = {},
): MockLink.MockedResponse => ({
  request: { query: DeleteProjectDocument, variables: { id } },
  result: { errors: [{ message, extensions: { code } }] },
});

/** `deleteProject` that fails before the backend answers (no network). */
export const deleteProjectNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteProjectDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `createProject`: the backend returns the new project with an id. */
export const createProjectMock = (
  input: CreateProjectInput,
  created: Partial<ProjectListItem> = {},
): MockLink.MockedResponse => ({
  request: { query: CreateProjectDocument, variables: { input } },
  result: {
    data: {
      createProject: {
        __typename: "Project",
        id: "new-1",
        name: input.name,
        domain: input.domain,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        environment: [],
        ...created,
      },
    },
  },
});

/** `createProject` refused with `BAD_USER_INPUT` and field errors, as the backend validation answers. */
export const createProjectInvalidMock = (
  input: CreateProjectInput,
  fields: string[],
): MockLink.MockedResponse => ({
  request: { query: CreateProjectDocument, variables: { input } },
  result: {
    errors: [
      {
        message: "Bad Request Exception",
        extensions: {
          code: "BAD_USER_INPUT",
          fieldErrors: fields.map((field) => ({ field, messages: [`${field} is invalid`] })),
        },
      },
    ],
  },
});

/** `createProject` that fails before the backend answers (no network). */
export const createProjectNetworkErrorMock = (
  input: CreateProjectInput,
): MockLink.MockedResponse => ({
  request: { query: CreateProjectDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});
