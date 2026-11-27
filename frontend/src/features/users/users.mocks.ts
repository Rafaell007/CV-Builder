import type { MockLink } from "@apollo/client/testing";
import {
  CreateUserDocument,
  type CreateUserInput,
  DeleteUserDocument,
  DepartmentOptionsDocument,
  MeDocument,
  PositionOptionsDocument,
  UpdateUserDocument,
  type UpdateUserInput,
  UsersDocument,
  type UsersQuery,
  type UsersQueryVariables,
} from "@/shared/graphql";
import { DEFAULT_USERS_SORT } from "./users.constants";
import type { UserListItem } from "./users.types";

const department = (id: string, name: string) => ({
  __typename: "Department" as const,
  id,
  name,
});
const position = (id: string, name: string) => ({ __typename: "Position" as const, id, name });

export const departments = {
  react: department("d1", "React"),
  dotNet: department("d2", ".NET"),
  java: department("d3", "Java"),
};

export const positions = {
  softwareEngineer: position("p1", "Software Engineer"),
  dataAnalyst: position("p2", "Data Analyst"),
  projectManager: position("p3", "Project Manager"),
};

// Made-up names (no real people), in the shapes the Figma list shows: a full row, a row without a last name and
// position, and a row with an email only (a user who signed up and never filled the profile).
export const alpha: UserListItem = {
  __typename: "User",
  id: "u1",
  email: "alpha.lima@example.com",
  firstName: "Alpha",
  lastName: "Lima",
  role: "ADMIN",
  avatarUrl: null,
  department: departments.react,
  position: positions.softwareEngineer,
};

export const bravo: UserListItem = {
  __typename: "User",
  id: "u2",
  email: "bravo.tango@example.com",
  firstName: "Bravo",
  lastName: "Tango",
  role: "USER",
  avatarUrl: null,
  department: departments.dotNet,
  position: positions.dataAnalyst,
};

export const charlie: UserListItem = {
  __typename: "User",
  id: "u3",
  email: "charlie@example.com",
  firstName: "Charlie",
  lastName: null,
  role: "USER",
  avatarUrl: null,
  department: departments.java,
  position: null,
};

export const emailOnly: UserListItem = {
  __typename: "User",
  id: "u4",
  email: "signed.up@example.com",
  firstName: null,
  lastName: null,
  role: "USER",
  avatarUrl: null,
  department: null,
  position: null,
};

export const sampleUsers: UserListItem[] = [alpha, bravo, charlie, emailOnly];

/** The variables of the first request of the page: page 1 of 10 rows, sorted by first name ascending. No search: it is left out. */
export const defaultVariables: UsersQueryVariables = {
  page: { number: 1, size: 10 },
  sort: DEFAULT_USERS_SORT,
};

/** Variables for a search, a sort or a page. A MockedProvider answers only a request with the same variables. */
export const variablesFor = (changes: Partial<UsersQueryVariables> = {}): UsersQueryVariables => ({
  ...defaultVariables,
  ...changes,
});

export const usersData = (items: UserListItem[], total = items.length): UsersQuery => ({
  users: { __typename: "UserPage", items, total },
});

interface MockOptions {
  variables?: UsersQueryVariables;
  /** Number of users on all pages (default: the number of items). */
  total?: number;
}

/** MockedProvider response of the `Users` query. */
export const usersMock = (
  items: UserListItem[],
  { variables = defaultVariables, total }: MockOptions = {},
): MockLink.MockedResponse => ({
  request: { query: UsersDocument, variables },
  result: { data: usersData(items, total) },
});

/** The value a sort field reads from a user (department and position sort by their name). */
const sortValue = (user: UserListItem, field: string): string | null | undefined => {
  if (field === "department") return user.department?.name;
  if (field === "position") return user.position?.name;
  if (field === "lastName") return user.lastName;
  return user.firstName;
};

/**
 * A stand-in for the backend, for stories and page tests: it answers every request, whatever the search, the sort or
 * the page, with the rules of the real backend (search in first name, last name and email without regard to case;
 * empty values last in A→Z and first in Z→A; 10 rows on a page). The page itself never filters, sorts or cuts pages.
 */
export const fakeBackendMock = (
  all: UserListItem[],
  /** Called with the variables of every request, so a test can count the requests. */
  onRequest?: (variables: UsersQueryVariables) => void,
): MockLink.MockedResponse => ({
  // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
  request: { query: UsersDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UsersQueryVariables) => {
    onRequest?.(variables);
    const search = variables.search?.trim().toLowerCase();
    const matching = search
      ? all.filter((user) =>
          [user.firstName, user.lastName, user.email].some((value) =>
            value?.toLowerCase().includes(search),
          ),
        )
      : all;

    const field = variables.sort?.field ?? DEFAULT_USERS_SORT.field;
    const descending = variables.sort?.direction === "DESC";
    const sorted = [...matching].sort((a, b) => {
      const left = sortValue(a, field);
      const right = sortValue(b, field);
      if (!left || !right) {
        // PostgreSQL: empty values are "bigger" than any text, so last in A→Z and first in Z→A.
        const order = (left ? 0 : 1) - (right ? 0 : 1);
        return descending ? -order : order;
      }
      return left.localeCompare(right) * (descending ? -1 : 1);
    });

    const number = variables.page.number ?? 1;
    const size = variables.page.size ?? 10;
    return { data: usersData(sorted.slice((number - 1) * size, number * size), matching.length) };
  },
});

/** `count` made-up users "User 01", "User 02"…, for the page buttons. */
export const manyUsers = (count: number): UserListItem[] =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      ...bravo,
      id: `many-${number}`,
      email: `user${number}@example.com`,
      firstName: "User",
      lastName: number,
    };
  });

/**
 * MockedProvider response of the `me` query: the signed-in user. The admin is `alpha` (first row of the sample), so
 * the admin's own row is in the list.
 */
export const meMock = (role: "ADMIN" | "USER" = "ADMIN"): MockLink.MockedResponse => {
  const me = role === "ADMIN" ? alpha : bravo;
  return {
    request: { query: MeDocument },
    result: {
      data: {
        me: {
          __typename: "SessionUser",
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role,
          isVerified: true,
        },
      },
    },
  };
};

/** MockedProvider response for a `Users` request that fails. */
export const usersErrorMock = (
  variables: UsersQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: UsersDocument, variables },
  error: new Error("Failed to fetch"),
});

// A GraphQL `ID` input can be a string or a number; the mocks answer with string ids, like the backend.
const departmentById = (id: string | number) =>
  Object.values(departments).find((item) => item.id === String(id)) ??
  department(String(id), `Department ${id}`);
const positionById = (id: string | number) =>
  Object.values(positions).find((item) => item.id === String(id)) ??
  position(String(id), `Position ${id}`);

/** MockedProvider response of `createUser`: the backend returns the new user with an id and a lowercased email. */
export const createUserMock = (
  input: CreateUserInput,
  created: Partial<UserListItem> = {},
): MockLink.MockedResponse => ({
  request: { query: CreateUserDocument, variables: { input } },
  result: {
    data: {
      createUser: {
        __typename: "User",
        id: "new-1",
        email: input.email.trim().toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        avatarUrl: null,
        department: departmentById(input.departmentId),
        position: positionById(input.positionId),
        ...created,
      },
    },
  },
});

/** `createUser` refused with a GraphQL error, for example `CONFLICT` with `reason: "EMAIL_TAKEN"`. */
export const createUserRefusedMock = (
  input: CreateUserInput,
  extensions: Record<string, unknown>,
  message = "Refused",
): MockLink.MockedResponse => ({
  request: { query: CreateUserDocument, variables: { input } },
  result: { errors: [{ message, extensions }] },
});

/** `createUser` that fails before the backend answers (no network). */
export const createUserNetworkErrorMock = (input: CreateUserInput): MockLink.MockedResponse => ({
  request: { query: CreateUserDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updateUser`: the backend returns the saved user. */
export const updateUserMock = (
  input: UpdateUserInput,
  email = "alpha.lima@example.com",
): MockLink.MockedResponse => ({
  request: { query: UpdateUserDocument, variables: { input } },
  result: {
    data: {
      updateUser: {
        __typename: "User",
        id: input.id,
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        avatarUrl: null,
        department: departmentById(input.departmentId),
        position: positionById(input.positionId),
      },
    },
  },
});

/** `updateUser` refused with a GraphQL error, for example `CONFLICT` with `reason: "OWN_ROLE"`. */
export const updateUserRefusedMock = (
  input: UpdateUserInput,
  extensions: Record<string, unknown>,
  message = "Refused",
): MockLink.MockedResponse => ({
  request: { query: UpdateUserDocument, variables: { input } },
  result: { errors: [{ message, extensions }] },
});

/** `updateUser` that fails before the backend answers (no network). */
export const updateUserNetworkErrorMock = (input: UpdateUserInput): MockLink.MockedResponse => ({
  request: { query: UpdateUserDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `deleteUser`: the backend answers `true`. */
export const deleteUserMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteUserDocument, variables: { id } },
  result: { data: { deleteUser: true } },
});

/** `deleteUser` refused with a GraphQL error, for example `CONFLICT` with `reason: "SELF_DELETE"`. */
export const deleteUserRefusedMock = (
  id: string,
  extensions: Record<string, unknown>,
  message = "Refused",
): MockLink.MockedResponse => ({
  request: { query: DeleteUserDocument, variables: { id } },
  result: { errors: [{ message, extensions }] },
});

/** `deleteUser` that fails before the backend answers (no network). */
export const deleteUserNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteUserDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the Department options (`departmentOptions`, every department by name). */
export const departmentOptionsMock = (
  items: { id: string; name: string }[],
): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  result: { data: { departmentOptions: items.map((item) => department(item.id, item.name)) } },
});

/** MockedProvider response of Department options that fail. */
export const departmentOptionsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the Position options (`positionOptions`, every position by name). */
export const positionOptionsMock = (
  items: { id: string; name: string }[],
): MockLink.MockedResponse => ({
  request: { query: PositionOptionsDocument },
  result: { data: { positionOptions: items.map((item) => position(item.id, item.name)) } },
});
