import type { MockLink } from "@apollo/client/testing";
import {
  ProjectsDocument,
  type ProjectsQuery,
  type ProjectsQueryVariables,
} from "@/shared/graphql";
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

// The longest values the project form allows (page document: name 100, domain 100, description 2000 characters).
export const MAX_NAME_LENGTH = 100;
export const MAX_DOMAIN_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;

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

/** The variables of the first request of the page: page 1 of 10 rows. No search and no sort: they are left out. */
export const defaultVariables: ProjectsQueryVariables = {
  page: { number: 1, size: 10 },
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

/** MockedProvider response for a request that fails. */
export const projectsErrorMock = (
  variables: ProjectsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: ProjectsDocument, variables },
  error: new Error("Failed to fetch"),
});
