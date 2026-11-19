import { describe, expect, it } from "vitest";
import { MAX_DESCRIPTION_LENGTH, MAX_EDUCATION_LENGTH, MAX_NAME_LENGTH } from "../cvs.constants";
import type { CvFormValues, CvListItem } from "../cvs.types";
import {
  cvFormSchema,
  toCreateCvInput,
  toCvFormValues,
  toUpdateCvInput,
  type CvFormMessages,
} from "./cvForm.utils";

const messages: CvFormMessages = {
  nameRequired: "name required",
  nameTooLong: "name long",
  educationRequired: "education required",
  educationTooLong: "education long",
  descriptionRequired: "description required",
  descriptionTooLong: "description long",
};

const valid: CvFormValues = {
  name: "Backend CV",
  education: "MSc Computer Science",
  description: "Five years of Node.js",
};

const cv: CvListItem = {
  __typename: "Cv",
  id: "7",
  ownerEmail: "ann@example.com",
  userId: "3",
  ...valid,
};

const schema = cvFormSchema(messages);

/** The messages of every issue, by field. */
function issues(values: CvFormValues): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("cvFormSchema", () => {
  it("accepts valid values and trims the texts", () => {
    const result = schema.safeParse({ name: "  A  ", education: " B ", description: " C " });

    expect(result.data).toEqual({ name: "A", education: "B", description: "C" });
  });

  it("asks for every field, and a value of spaces counts as empty", () => {
    expect(issues({ name: "", education: "   ", description: "" })).toEqual({
      name: "name required",
      education: "education required",
      description: "description required",
    });
  });

  it("accepts the longest values and refuses one more character", () => {
    expect(
      issues({
        name: "n".repeat(MAX_NAME_LENGTH),
        education: "e".repeat(MAX_EDUCATION_LENGTH),
        description: "d".repeat(MAX_DESCRIPTION_LENGTH),
      }),
    ).toEqual({});
    expect(
      issues({
        name: "n".repeat(MAX_NAME_LENGTH + 1),
        education: "e".repeat(MAX_EDUCATION_LENGTH + 1),
        description: "d".repeat(MAX_DESCRIPTION_LENGTH + 1),
      }),
    ).toEqual({
      name: "name long",
      education: "education long",
      description: "description long",
    });
  });
});

describe("toCreateCvInput", () => {
  it("sends the three fields and no owner", () => {
    expect(toCreateCvInput(valid)).toEqual(valid);
  });

  it("adds the owner when the page gives one (the User CVs tab)", () => {
    expect(toCreateCvInput(valid, "10")).toEqual({ ...valid, userId: "10" });
  });
});

describe("toCvFormValues", () => {
  it("takes the editable fields of the CV", () => {
    expect(toCvFormValues(cv)).toEqual(valid);
  });
});

describe("toUpdateCvInput", () => {
  it("adds the employee of the page as the scope, not the owner of the row", () => {
    expect(toUpdateCvInput({ ...cv, userId: "other" }, valid, "10")).toEqual({
      id: "7",
      ...valid,
      userId: "10",
    });
  });

  it("adds the id of the CV to the form values", () => {
    expect(toUpdateCvInput(cv, { ...valid, name: "New" })).toEqual({
      id: "7",
      ...valid,
      name: "New",
    });
  });
});
