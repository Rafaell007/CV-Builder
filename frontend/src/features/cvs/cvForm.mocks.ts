import type { MockLink } from "@apollo/client/testing";
import {
  CreateCvDocument,
  type CreateCvInput,
  UpdateCvDocument,
  type UpdateCvInput,
} from "@/shared/graphql";
import type { CvListItem } from "./cvs.types";

/** A CV row as the list gives it to the Update CV flow. */
export const backendCv: CvListItem = {
  __typename: "Cv",
  id: "1",
  name: "Backend CV",
  education: "MSc Computer Science",
  description: "Five years of Node.js",
  ownerEmail: "ann@example.com",
  userId: "3",
};

/** The input the Create CV modal sends when the user types these values. */
export const createInput: CreateCvInput = {
  name: "Frontend CV",
  education: "BSc Design",
  description: "React and CSS",
};

const badInput = (field: string) => ({
  errors: [
    {
      message: "Bad Request Exception",
      extensions: {
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field, messages: [`${field} is invalid`] }],
      },
    },
  ],
});

/** MockedProvider response of `createCv`: the backend returns the new CV with an id. */
export const createCvMock = (
  input: CreateCvInput,
  created: Partial<CvListItem> = {},
): MockLink.MockedResponse => ({
  request: { query: CreateCvDocument, variables: { input } },
  result: {
    data: {
      createCv: {
        __typename: "Cv",
        id: "new-1",
        name: input.name,
        education: input.education,
        description: input.description,
        ownerEmail: "ann@example.com",
        userId: "3",
        ...created,
      },
    },
  },
});

/** `createCv` refused with `BAD_USER_INPUT` for one field, as the backend validation answers. */
export const createCvInvalidMock = (
  input: CreateCvInput,
  field: string,
): MockLink.MockedResponse => ({
  request: { query: CreateCvDocument, variables: { input } },
  result: badInput(field),
});

/** `createCv` that fails before the backend answers (no network). */
export const createCvNetworkErrorMock = (input: CreateCvInput): MockLink.MockedResponse => ({
  request: { query: CreateCvDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updateCv`: the backend returns the saved CV. */
export const updateCvMock = (input: UpdateCvInput): MockLink.MockedResponse => ({
  request: { query: UpdateCvDocument, variables: { input } },
  result: {
    data: {
      updateCv: {
        __typename: "Cv",
        id: input.id,
        name: input.name,
        education: input.education,
        description: input.description,
        ownerEmail: "ann@example.com",
        userId: "3",
      },
    },
  },
});

/** `updateCv` refused with `BAD_USER_INPUT` for one field. */
export const updateCvInvalidMock = (
  input: UpdateCvInput,
  field: string,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvDocument, variables: { input } },
  result: badInput(field),
});

/** `updateCv` that fails before the backend answers (no network). */
export const updateCvNetworkErrorMock = (input: UpdateCvInput): MockLink.MockedResponse => ({
  request: { query: UpdateCvDocument, variables: { input } },
  error: new Error("Failed to fetch"),
});

/** `createCv` refused with a code and no field errors, for example `NOT_FOUND` for an unknown employee. */
export const createCvRefusedMock = (
  input: CreateCvInput,
  code = "NOT_FOUND",
): MockLink.MockedResponse => ({
  request: { query: CreateCvDocument, variables: { input } },
  result: { errors: [{ message: "User not found", extensions: { code } }] },
});
