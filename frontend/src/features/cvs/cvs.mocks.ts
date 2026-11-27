import type { MockLink } from "@apollo/client/testing";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import { CvsDocument, MeDocument, type CvsQuery, type CvsQueryVariables } from "@/shared/graphql";
import { DEFAULT_CVS_SORT } from "./cvs.constants";
import type { CvListItem } from "./cvs.types";

// Mock data for tests and stories. The page itself never uses it: all CV data comes from the backend.

export const frontendCv: CvListItem = {
  __typename: "Cv",
  id: "1",
  name: "Frontend Developer",
  education: "MSc Computer Science, Warsaw University of Technology",
  description: "Five years of work with React, TypeScript and design systems.",
  ownerEmail: "anna.kowalska@example.com",
  userId: "10",
};

export const backendCv: CvListItem = {
  __typename: "Cv",
  id: "2",
  name: "Backend Engineer",
  education: "BSc Software Engineering, AGH University of Krakow",
  description: "Node.js, NestJS and PostgreSQL services for banking customers.",
  ownerEmail: "jan.nowak@example.com",
  userId: "11",
};

export const dataCv: CvListItem = {
  __typename: "Cv",
  id: "3",
  name: "Data Analyst",
  education: "MSc Statistics, University of Wroclaw",
  description: "Dashboards, SQL reports and forecasting for logistics teams.",
  ownerEmail: "anna.kowalska@example.com",
  userId: "10",
};

/** Three mock CVs from two owners. The order does not matter: `fakeBackendMock` sorts them. */
export const sampleCvs: CvListItem[] = [frontendCv, backendCv, dataCv];

/** The variables of the first request of the page: page 1 of 10 rows, sorted by name ascending. No search: it is left out. */
export const defaultVariables: CvsQueryVariables = {
  page: { number: 1, size: 10 },
  sort: DEFAULT_CVS_SORT,
};

/** Variables for a search, a sort, a page or a user. A MockedProvider answers only a request with the same variables. */
export const variablesFor = (changes: Partial<CvsQueryVariables> = {}): CvsQueryVariables => ({
  ...defaultVariables,
  ...changes,
});

export const cvsData = (items: CvListItem[], total = items.length): CvsQuery => ({
  cvs: { __typename: "CvPage", items, total },
});

interface MockOptions {
  variables?: CvsQueryVariables;
  /** Number of CVs on all pages (default: the number of items). */
  total?: number;
}

/** MockedProvider response of the `Cvs` query. */
export const cvsMock = (
  items: CvListItem[],
  { variables = defaultVariables, total }: MockOptions = {},
): MockLink.MockedResponse => ({
  request: { query: CvsDocument, variables },
  result: { data: cvsData(items, total) },
});

/** `count` generated CVs with unique names, so the pages of a list can be shown. */
export const manyCvs = (count: number): CvListItem[] =>
  Array.from({ length: count }, (_, index) => {
    const base = sampleCvs[index % sampleCvs.length]!;
    const number = String(index + 1).padStart(2, "0");
    return { ...base, id: `gen-${number}`, name: `${base.name} ${number}` };
  });

/**
 * A stand-in for the backend, for stories: it answers every request, whatever the search, the sort, the page or
 * the user, with the rules of the real backend (search in name and owner email without regard to case, sort by
 * name, name ascending by default, 10 rows on a page, `userId` keeps the CVs of one user). It lives here, in the
 * mocks, so a story works when the user types or clicks. The page itself never filters, sorts or cuts pages.
 */
export const fakeBackendMock = (
  all: CvListItem[],
  /** Called with the variables of every request, so a test can count the requests. */
  onRequest?: (variables: CvsQueryVariables) => void,
): MockLink.MockedResponse => ({
  // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
  request: { query: CvsDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CvsQueryVariables) => {
    onRequest?.(variables);
    const search = variables.search?.trim().toLowerCase();
    const ofUser =
      variables.userId == null ? all : all.filter((cv) => cv.userId === String(variables.userId));
    const matching = search
      ? ofUser.filter(
          (cv) =>
            cv.name.toLowerCase().includes(search) || cv.ownerEmail.toLowerCase().includes(search),
        )
      : ofUser;

    const direction = variables.sort?.direction ?? "ASC";
    const sorted = [...matching].sort(
      (a, b) => a.name.localeCompare(b.name) * (direction === "DESC" ? -1 : 1),
    );

    // Same default as the backend PageInput: page 1, 10 rows.
    const number = variables.page.number ?? 1;
    const size = variables.page.size ?? DEFAULT_PAGE_SIZE;
    const items = sorted.slice((number - 1) * size, number * size);
    return { data: cvsData(items, matching.length) };
  },
});

/** MockedProvider response for a request that fails. */
export const cvsErrorMock = (
  variables: CvsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: CvsDocument, variables },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the `me` query: the signed-in user with this role. The empty text of the list depends on it. */
export const meMock = (role: "ADMIN" | "USER" = "USER"): MockLink.MockedResponse => ({
  request: { query: MeDocument },
  result: {
    data: {
      me: {
        __typename: "SessionUser",
        id: "10",
        email: "anna.kowalska@example.com",
        firstName: "Anna",
        lastName: "Kowalska",
        role,
        isVerified: true,
      },
    },
  },
});

/** The `Cvs` query refused with a GraphQL error code, for example `FORBIDDEN` or `NOT_FOUND` (unknown employee). */
export const cvsRefusedMock = (
  code: string,
  variables: CvsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: CvsDocument, variables },
  result: { errors: [{ message: "Refused", extensions: { code } }] },
});
