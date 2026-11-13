import { describe, expect, it } from "vitest";
import { MAX_RESPONSIBILITIES_LENGTH, MAX_ROLES } from "../cvProjects.constants";
import { blog, cvProject, developer, sampleCvProjects } from "../cvProjects.mocks";
import type { CvProjectFormValues } from "../cvProjects.types";
import {
  cvProjectFormSchema,
  toAddCvProjectInput,
  toCvProjectFormValues,
  toProjectRange,
  toUpdateCvProjectInput,
  type CvProjectFormMessages,
} from "./cvProjectForm.utils";

const messages: CvProjectFormMessages = {
  projectRequired: "project required",
  startDateRequired: "start required",
  startDateOutOfRange: "start outside",
  endDateOutOfRange: "end outside",
  endDateBeforeStart: "end before start",
  rolesRequired: "roles required",
  rolesTooMany: "too many roles",
  responsibilitiesTooLong: "responsibilities long",
};

// The project lasts from 1 January 2025 to 31 December 2026.
const range = { start: new Date(2025, 0, 1), end: new Date(2026, 11, 31) };
const schema = cvProjectFormSchema(messages, (projectId) =>
  projectId === "project-1" ? range : undefined,
);

const valid: CvProjectFormValues = {
  projectId: "project-1",
  startDate: new Date(2025, 1, 1),
  endDate: new Date(2025, 10, 30),
  roleIds: ["role-1"],
  responsibilities: "  Built the pages.  ",
};

/** The messages of the failed fields, by field name. */
function issues(values: CvProjectFormValues): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}

describe("cvProjectFormSchema", () => {
  it("accepts valid values and trims the responsibilities", () => {
    const result = schema.safeParse(valid);

    expect(result.success && result.data).toMatchObject({
      projectId: "project-1",
      responsibilities: "Built the pages.",
    });
  });

  it("requires the project, the start date and one role (AC-14, AC-16)", () => {
    expect(issues({ ...valid, projectId: "", startDate: null, roleIds: [] })).toEqual({
      projectId: "project required",
      startDate: "start required",
      roleIds: "roles required",
    });
  });

  it("accepts no end date: the person still works on the project", () => {
    expect(issues({ ...valid, endDate: null })).toEqual({});
  });

  it("accepts no responsibilities (AC-17)", () => {
    expect(issues({ ...valid, responsibilities: "" })).toEqual({});
  });

  it("accepts the first and the last day of the project, and refuses the days outside (AC-15)", () => {
    expect(issues({ ...valid, startDate: range.start, endDate: range.end })).toEqual({});

    expect(issues({ ...valid, startDate: new Date(2024, 11, 31) })).toEqual({
      startDate: "start outside",
    });
    expect(issues({ ...valid, startDate: new Date(2027, 0, 1), endDate: null })).toEqual({
      startDate: "start outside",
    });
    expect(issues({ ...valid, endDate: new Date(2027, 0, 1) })).toEqual({
      endDate: "end outside",
    });
  });

  it("refuses an end date earlier than the start date, on the end date", () => {
    expect(issues({ ...valid, endDate: new Date(2025, 0, 15) })).toEqual({
      endDate: "end before start",
    });
  });

  it("accepts the same day for both dates", () => {
    expect(issues({ ...valid, endDate: valid.startDate })).toEqual({});
  });

  it("does not check the range when the project is not known", () => {
    expect(
      issues({ ...valid, projectId: "other", startDate: new Date(1990, 0, 1), endDate: null }),
    ).toEqual({});
  });

  it("accepts the most roles and the longest responsibilities, and refuses one more", () => {
    const roles = (count: number) => Array.from({ length: count }, (_, index) => `role-${index}`);

    expect(
      issues({
        ...valid,
        roleIds: roles(MAX_ROLES),
        responsibilities: "x".repeat(MAX_RESPONSIBILITIES_LENGTH),
      }),
    ).toEqual({});
    expect(
      issues({
        ...valid,
        roleIds: roles(MAX_ROLES + 1),
        responsibilities: "x".repeat(MAX_RESPONSIBILITIES_LENGTH + 1),
      }),
    ).toEqual({ roleIds: "too many roles", responsibilities: "responsibilities long" });
  });
});

describe("toProjectRange", () => {
  it("gives the local days of the project", () => {
    expect(toProjectRange(blog)).toEqual({
      start: new Date(2025, 0, 1),
      end: new Date(2026, 11, 31),
    });
  });

  it("gives undefined when a date cannot be read", () => {
    expect(toProjectRange({ startDate: "not a date", endDate: blog.endDate })).toBeUndefined();
  });
});

describe("toCvProjectFormValues", () => {
  it("prefills the form with the data of the CV project", () => {
    expect(toCvProjectFormValues(sampleCvProjects[0]!)).toEqual({
      projectId: "project-1",
      startDate: new Date(2025, 1, 1),
      endDate: new Date(2025, 10, 30),
      roleIds: ["role-1"],
      responsibilities: "Built the pages.",
    });
  });

  it("gives an empty end date and empty responsibilities for a project that has none", () => {
    expect(
      toCvProjectFormValues(cvProject({ endDate: null, responsibilities: null })),
    ).toMatchObject({
      endDate: null,
      responsibilities: "",
    });
  });
});

describe("toAddCvProjectInput", () => {
  it("turns the form values into the mutation input with UTC days", () => {
    expect(
      toAddCvProjectInput("cv-1", {
        projectId: "project-1",
        startDate: new Date(2025, 1, 1),
        endDate: new Date(2025, 10, 30),
        roleIds: [developer.id],
        responsibilities: "Built the pages.",
      }),
    ).toEqual({
      cvId: "cv-1",
      projectId: "project-1",
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: "2025-11-30T00:00:00.000Z",
      responsibilities: "Built the pages.",
      roleIds: ["role-1"],
    });
  });

  it("sends null for an empty end date and empty responsibilities", () => {
    expect(
      toAddCvProjectInput("cv-1", {
        projectId: "project-1",
        startDate: new Date(2025, 1, 1),
        endDate: null,
        roleIds: ["role-1"],
        responsibilities: "",
      }),
    ).toMatchObject({ endDate: null, responsibilities: null });
  });
});

describe("toUpdateCvProjectInput", () => {
  it("sends the id and the editable values, and no project", () => {
    expect(
      toUpdateCvProjectInput("link-1", {
        projectId: "project-1",
        startDate: new Date(2025, 1, 1),
        endDate: null,
        roleIds: ["role-1", "role-2"],
        responsibilities: "",
      }),
    ).toEqual({
      id: "link-1",
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: null,
      responsibilities: null,
      roleIds: ["role-1", "role-2"],
    });
  });
});
