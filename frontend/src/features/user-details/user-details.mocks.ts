import type { MockLink } from "@apollo/client/testing";
import {
  CvsDocument,
  DepartmentOptionsDocument,
  MeDocument,
  PositionOptionsDocument,
  ResendVerificationCodeDocument,
  UpdateProfileDocument,
  UserDocument,
  type UpdateProfileInput,
} from "@/shared/graphql";

// Mock data for tests. The page itself never uses it: all data comes from the backend.

/** MockedProvider response of the `me` query: the signed-in user (id "1" unless told) with this role, verified unless told. */
export const meMock = (
  role: "ADMIN" | "USER",
  isVerified = true,
  id = "1",
): MockLink.MockedResponse => ({
  request: { query: MeDocument },
  result: {
    data: {
      me: {
        __typename: "SessionUser",
        id,
        email: "admin@example.com",
        firstName: "Ada",
        lastName: "Admin",
        role,
        isVerified,
      },
    },
  },
});

type CatalogItem = { id: string; name: string } | null;

/**
 * MockedProvider response of the `user` query: the employee of the page. Names are `null` for a user who signed up;
 * department and position are `null` until someone sets them.
 */
export const userMock = (
  id: string,
  name: { firstName: string | null; lastName: string | null } = {
    firstName: "Emma",
    lastName: "Employee",
  },
  assigned: { department: CatalogItem; position: CatalogItem } = {
    department: null,
    position: null,
  },
): MockLink.MockedResponse => ({
  request: { query: UserDocument, variables: { id } },
  result: {
    data: {
      user: {
        __typename: "User",
        id,
        email: "emma@example.com",
        ...name,
        role: "USER",
        createdAt: "2024-01-14T10:00:00.000Z",
        department: assigned.department && { __typename: "Department", ...assigned.department },
        position: assigned.position && { __typename: "Position", ...assigned.position },
      },
    },
  },
});

/** The first request of the CVs tab of this user: page 1, name ascending, no search. */
export const userCvsMock = (
  userId: string,
  items: Array<{ id: string; name: string; education: string; ownerEmail: string }>,
): MockLink.MockedResponse => ({
  request: {
    query: CvsDocument,
    variables: {
      page: { number: 1, size: 10 },
      sort: { field: "name", direction: "ASC" },
      userId,
    },
  },
  result: {
    data: {
      cvs: {
        __typename: "CvPage",
        items: items.map((item) => ({
          __typename: "Cv",
          description: "A short description",
          userId,
          ...item,
        })),
        total: items.length,
      },
    },
  },
});

/** The `user` query fails with this GraphQL error code (for example `NOT_FOUND`). */
export const userErrorMock = (id: string, code: string): MockLink.MockedResponse => ({
  request: { query: UserDocument, variables: { id } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

const DEPARTMENT_NAMES: Record<string, string> = { d1: "React", d2: ".NET", d3: "Java" };
const POSITION_NAMES: Record<string, string> = { p1: "Software Engineer", p2: "Data Analyst" };

/**
 * MockedProvider response of `updateProfile`: the backend saved `input` (department and position ids of the options
 * mocks below) and answers with the whole user.
 */
export const updateProfileMock = (input: UpdateProfileInput): MockLink.MockedResponse => ({
  request: { query: UpdateProfileDocument, variables: { input } },
  result: {
    data: {
      updateProfile: {
        __typename: "User",
        id: input.id,
        email: "emma@example.com",
        firstName: input.firstName,
        lastName: input.lastName,
        role: "USER",
        createdAt: "2024-01-14T10:00:00.000Z",
        department: {
          __typename: "Department",
          id: input.departmentId,
          name: DEPARTMENT_NAMES[input.departmentId],
        },
        position: {
          __typename: "Position",
          id: input.positionId,
          name: POSITION_NAMES[input.positionId],
        },
      },
    },
  },
});

/** `updateProfile` refused by the backend with these `extensions` (for example `{ code: "FORBIDDEN" }`). */
export const updateProfileRefusedMock = (
  input: UpdateProfileInput,
  extensions: Record<string, unknown>,
): MockLink.MockedResponse => ({
  request: { query: UpdateProfileDocument, variables: { input } },
  result: { errors: [{ message: String(extensions.code), extensions }] },
});

/** `updateProfile` that fails without an answer (no network). */
export const updateProfileNetworkErrorMock = (
  input: UpdateProfileInput,
): MockLink.MockedResponse => ({
  request: { query: UpdateProfileDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the Department options of the Profile form: `.NET`, `Java` and `React`, by name. */
export const departmentOptionsMock = (): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  result: {
    data: {
      departmentOptions: [
        { __typename: "Department", id: "d2", name: ".NET" },
        { __typename: "Department", id: "d3", name: "Java" },
        { __typename: "Department", id: "d1", name: "React" },
      ],
    },
  },
});

/** Department options that fail (no network). */
export const departmentOptionsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the Position options of the Profile form, by name. */
export const positionOptionsMock = (): MockLink.MockedResponse => ({
  request: { query: PositionOptionsDocument },
  result: {
    data: {
      positionOptions: [
        { __typename: "Position", id: "p2", name: "Data Analyst" },
        { __typename: "Position", id: "p1", name: "Software Engineer" },
      ],
    },
  },
});

/** `resendVerificationCode` that sent a new code (VERIFY EMAIL). `delay` keeps the request open, in ms. */
export const resendCodeMock = (delay = 0): MockLink.MockedResponse => ({
  request: { query: ResendVerificationCodeDocument },
  result: { data: { resendVerificationCode: true } },
  delay,
});

/** `resendVerificationCode` refused by the backend with these `extensions` (for example a `reason`). */
export const resendCodeRefusedMock = (
  extensions: Record<string, unknown>,
): MockLink.MockedResponse => ({
  request: { query: ResendVerificationCodeDocument },
  result: { errors: [{ message: String(extensions.code), extensions }] },
});

/** `resendVerificationCode` that fails without an answer (no network). */
export const resendCodeNetworkErrorMock = (): MockLink.MockedResponse => ({
  request: { query: ResendVerificationCodeDocument },
  error: new Error("Failed to fetch"),
});
