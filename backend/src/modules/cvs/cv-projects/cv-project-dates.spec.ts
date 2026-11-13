import { ValidationFailedException } from "../../../common/errors";
import type { FieldError } from "../../../common/errors";
import { resolveCvProjectDates } from "./cv-project-dates";

const PROJECT = {
  startDate: new Date("2026-01-01T00:00:00Z"),
  endDate: new Date("2026-12-31T00:00:00Z"),
};

function fieldErrorsOf(attempt: () => unknown): FieldError[] {
  try {
    attempt();
  } catch (error) {
    if (error instanceof ValidationFailedException) return error.fieldErrors;
    throw error;
  }
  throw new Error("The call did not fail");
}

describe("resolveCvProjectDates", () => {
  it("returns whole days", () => {
    expect(
      resolveCvProjectDates(
        { startDate: new Date("2026-03-01T10:30:00Z"), endDate: new Date("2026-04-01T23:00:00Z") },
        PROJECT,
      ),
    ).toEqual({
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-04-01T00:00:00Z"),
    });
  });

  it("stores a missing end date as null (Present)", () => {
    const { endDate } = resolveCvProjectDates({ startDate: new Date("2026-03-01") }, PROJECT);

    expect(endDate).toBeNull();
  });

  it("stores an end date of null as null", () => {
    const { endDate } = resolveCvProjectDates(
      { startDate: new Date("2026-03-01"), endDate: null },
      PROJECT,
    );

    expect(endDate).toBeNull();
  });

  it("accepts the first and the last day of the project", () => {
    expect(() =>
      resolveCvProjectDates({ startDate: PROJECT.startDate, endDate: PROJECT.endDate }, PROJECT),
    ).not.toThrow();
  });

  it("accepts a person who starts and ends on the same day", () => {
    const day = new Date("2026-05-05");

    expect(() => resolveCvProjectDates({ startDate: day, endDate: day }, PROJECT)).not.toThrow();
  });

  it("rejects a start date before the project", () => {
    const errors = fieldErrorsOf(() =>
      resolveCvProjectDates({ startDate: new Date("2025-12-31") }, PROJECT),
    );

    expect(errors).toEqual([
      { field: "startDate", messages: ["Start date must be within project duration"] },
    ]);
  });

  it("rejects a start date after the project", () => {
    const errors = fieldErrorsOf(() =>
      resolveCvProjectDates({ startDate: new Date("2027-01-01") }, PROJECT),
    );

    expect(errors).toEqual([
      { field: "startDate", messages: ["Start date must be within project duration"] },
    ]);
  });

  it("rejects an end date after the project", () => {
    expect(
      fieldErrorsOf(() =>
        resolveCvProjectDates(
          { startDate: new Date("2026-03-01"), endDate: new Date("2027-01-01") },
          PROJECT,
        ),
      ),
    ).toEqual([{ field: "endDate", messages: ["End date must be within project duration"] }]);
  });

  it("rejects an end date before the start date", () => {
    expect(
      fieldErrorsOf(() =>
        resolveCvProjectDates(
          { startDate: new Date("2026-03-10"), endDate: new Date("2026-03-09") },
          PROJECT,
        ),
      ),
    ).toEqual([{ field: "endDate", messages: ["End date cannot be earlier than start date"] }]);
  });

  it("reports both messages when the end date is before the start and before the project", () => {
    expect(
      fieldErrorsOf(() =>
        resolveCvProjectDates(
          { startDate: new Date("2026-03-10"), endDate: new Date("2025-06-01") },
          PROJECT,
        ),
      ),
    ).toEqual([
      {
        field: "endDate",
        messages: [
          "End date cannot be earlier than start date",
          "End date must be within project duration",
        ],
      },
    ]);
  });

  it("reports the start and the end date errors together", () => {
    const errors = fieldErrorsOf(() =>
      resolveCvProjectDates(
        { startDate: new Date("2025-01-01"), endDate: new Date("2027-01-01") },
        PROJECT,
      ),
    );

    expect(errors.map(({ field }) => field)).toEqual(["startDate", "endDate"]);
  });
});
