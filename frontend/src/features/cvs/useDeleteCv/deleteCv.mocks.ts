import type { MockLink } from "@apollo/client/testing";
import { DeleteCvDocument } from "@/shared/graphql";
import type { CvListItem } from "../cvs.types";

/** A CV row for the delete tests. */
export const cvToDelete: CvListItem = {
  __typename: "Cv",
  id: "cv-1",
  name: "Frontend Developer",
  education: "MSc Computer Science",
  description: "Five years of React.",
  ownerEmail: "anna@example.com",
  userId: "user-1",
};

/** MockedProvider response of `deleteCv` for the CV with this id. */
export const deleteCvMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteCvDocument, variables: { id } },
  result: { data: { deleteCv: { __typename: "Cv", id } } },
});

/** `deleteCv` refused with a GraphQL error, for example `NOT_FOUND` or `FORBIDDEN`. */
export const deleteCvRefusedMock = (
  id: string,
  { code = "NOT_FOUND", message = "CV not found" } = {},
): MockLink.MockedResponse => ({
  request: { query: DeleteCvDocument, variables: { id } },
  result: { errors: [{ message, extensions: { code } }] },
});

/** `deleteCv` that fails before the backend answers (no network). */
export const deleteCvNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteCvDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});
