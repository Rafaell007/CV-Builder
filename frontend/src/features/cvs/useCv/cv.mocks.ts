import type { MockLink } from "@apollo/client/testing";
import { CvDocument } from "@/shared/graphql";
import type { CvDetailsData } from "../cvs.types";

// Mock data for tests and stories. The page itself never uses it: all CV data comes from the backend.

/** MockedProvider response of the `Cv` query for the CV with this id. `userId`: the employee of the User CVs tab (AC-12). */
export const cvMock = (cv: CvDetailsData, userId?: string): MockLink.MockedResponse => ({
  request: {
    query: CvDocument,
    variables: { id: cv.id, ...(userId === undefined ? {} : { userId }) },
  },
  result: { data: { cv } },
});

/** The backend answers the `Cv` query with a GraphQL error code, e.g. `NOT_FOUND` or `FORBIDDEN`. */
export const cvCodeErrorMock = (id: string, code: string): MockLink.MockedResponse => ({
  request: { query: CvDocument, variables: { id } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** The `Cv` query fails like a network error (no GraphQL error code). */
export const cvNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: CvDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});
