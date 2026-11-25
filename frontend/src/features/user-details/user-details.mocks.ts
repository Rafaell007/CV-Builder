import type { MockLink } from "@apollo/client/testing";
import { CvsDocument, MeDocument, UserDocument } from "@/shared/graphql";

// Mock data for tests. The page itself never uses it: all data comes from the backend.

/** MockedProvider response of the `me` query: the signed-in user with this role. */
export const meMock = (role: "ADMIN" | "USER"): MockLink.MockedResponse => ({
  request: { query: MeDocument },
  result: {
    data: {
      me: {
        __typename: "SessionUser",
        id: "1",
        email: "admin@example.com",
        firstName: "Ada",
        lastName: "Admin",
        role,
        isVerified: true,
      },
    },
  },
});

/** MockedProvider response of the `user` query: the employee of the page. Names are `null` for a user who signed up. */
export const userMock = (
  id: string,
  name: { firstName: string | null; lastName: string | null } = {
    firstName: "Emma",
    lastName: "Employee",
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
        department: null,
        position: null,
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
