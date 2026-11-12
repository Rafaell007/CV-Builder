import { describe, expect, it } from "vitest";
import { MAX_DESCRIPTION_LENGTH, MAX_DOMAIN_LENGTH, MAX_NAME_LENGTH } from "../projects.constants";
import { blog } from "../projects.mocks";
import type { ProjectFormValues } from "../projects.types";
import {
  projectFormSchema,
  fromUtcDateIso,
  toCreateProjectInput,
  toProjectFormValues,
  toUpdateProjectInput,
  toUtcDateIso,
  type ProjectFormMessages,
} from "./projectForm.utils";

const messages: ProjectFormMessages = {
  nameRequired: "name required",
  nameTooLong: "name long",
  domainRequired: "domain required",
  domainTooLong: "domain long",
  startDateRequired: "start required",
  endDateRequired: "end required",
  endDateBeforeStart: "end before start",
  descriptionRequired: "description required",
  descriptionTooLong: "description long",
};

const valid: ProjectFormValues = {
  name: "Blog",
  domain: "Blogging",
  startDate: new Date(2026, 0, 10),
  endDate: new Date(2026, 5, 30),
  description: "A blogging site",
};

const schema = projectFormSchema(messages);

/** The messages of every issue, by field. */
function issues(values: ProjectFormValues): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("projectFormSchema", () => {
  it("accepts valid values and trims the texts", () => {
    const result = schema.safeParse({
      ...valid,
      name: "  Blog  ",
      domain: " Blogging ",
      description: " A site ",
    });

    expect(result.success && result.data).toMatchObject({
      name: "Blog",
      domain: "Blogging",
      description: "A site",
    });
  });

  it("requires every field", () => {
    expect(
      issues({ name: "  ", domain: "", startDate: null, endDate: null, description: "" }),
    ).toEqual({
      name: "name required",
      domain: "domain required",
      startDate: "start required",
      endDate: "end required",
      description: "description required",
    });
  });

  it("accepts the longest allowed texts and refuses one character more", () => {
    const longest = {
      ...valid,
      name: "n".repeat(MAX_NAME_LENGTH),
      domain: "d".repeat(MAX_DOMAIN_LENGTH),
      description: "x".repeat(MAX_DESCRIPTION_LENGTH),
    };
    expect(issues(longest)).toEqual({});

    expect(
      issues({
        ...valid,
        name: "n".repeat(MAX_NAME_LENGTH + 1),
        domain: "d".repeat(MAX_DOMAIN_LENGTH + 1),
        description: "x".repeat(MAX_DESCRIPTION_LENGTH + 1),
      }),
    ).toEqual({ name: "name long", domain: "domain long", description: "description long" });
  });

  it("refuses an end date earlier than the start date, on the end date", () => {
    expect(issues({ ...valid, endDate: new Date(2026, 0, 9) })).toEqual({
      endDate: "end before start",
    });
  });

  it("accepts the same day for both dates", () => {
    expect(issues({ ...valid, endDate: valid.startDate })).toEqual({});
  });

  it("does not compare the dates when one is missing", () => {
    expect(issues({ ...valid, startDate: null })).toEqual({ startDate: "start required" });
  });
});

describe("toUtcDateIso", () => {
  it("keeps the calendar day the user picked, whatever the time zone", () => {
    // Local midnight of 10 January: `toISOString` would give the 9th in a time zone east of UTC.
    expect(toUtcDateIso(new Date(2026, 0, 10))).toBe("2026-01-10T00:00:00.000Z");
  });
});

describe("toCreateProjectInput", () => {
  it("turns the form values into the mutation input without an environment", () => {
    expect(
      toCreateProjectInput({
        ...valid,
        startDate: new Date(2026, 0, 10),
        endDate: new Date(2026, 5, 30),
      }),
    ).toEqual({
      name: "Blog",
      domain: "Blogging",
      startDate: "2026-01-10T00:00:00.000Z",
      endDate: "2026-06-30T00:00:00.000Z",
      description: "A blogging site",
    });
  });
});

describe("fromUtcDateIso", () => {
  it("gives the local day that has the same calendar date as the UTC day", () => {
    // `new Date(iso)` would be the 9th (local time) in a time zone west of UTC.
    const date = fromUtcDateIso("2026-01-10T00:00:00.000Z");

    expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([2026, 0, 10]);
  });

  it("round-trips with toUtcDateIso", () => {
    const iso = "2026-03-29T00:00:00.000Z";

    expect(toUtcDateIso(fromUtcDateIso(iso) as Date)).toBe(iso);
  });

  it("gives null for a text that is not a date", () => {
    expect(fromUtcDateIso("not a date")).toBeNull();
  });
});

describe("toProjectFormValues", () => {
  it("prefills the form with the data of the project", () => {
    const values = toProjectFormValues(blog);

    expect(values).toMatchObject({
      name: "Blog",
      domain: "Blogging",
      description: blog.description,
    });
    expect(values.startDate).toEqual(new Date(2025, 11, 31));
    expect(values.endDate).toEqual(new Date(2026, 4, 31));
  });
});

describe("toUpdateProjectInput", () => {
  it("sends the id and the ids of the current environment, so an edit keeps the technologies", () => {
    expect(
      toUpdateProjectInput(blog, {
        ...valid,
        name: "Blog 2",
        startDate: new Date(2026, 0, 10),
        endDate: new Date(2026, 5, 30),
      }),
    ).toEqual({
      id: "1",
      name: "Blog 2",
      domain: "Blogging",
      startDate: "2026-01-10T00:00:00.000Z",
      endDate: "2026-06-30T00:00:00.000Z",
      description: "A blogging site",
      environmentIds: ["10", "11", "12", "13", "14", "15"],
    });
  });

  it("sends an empty list for a project without technologies", () => {
    const input = toUpdateProjectInput(
      { ...blog, environment: [] },
      { ...valid, startDate: new Date(2026, 0, 10), endDate: new Date(2026, 5, 30) },
    );

    expect(input.environmentIds).toEqual([]);
  });
});
