import { ValidationFailedException } from "../../common/errors";
import { normalizeProjectDates, toDateOnly } from "./project-dates";

describe("toDateOnly", () => {
  it("cuts the time off", () => {
    expect(toDateOnly(new Date("2026-03-05T22:15:00.000Z"))).toEqual(
      new Date("2026-03-05T00:00:00.000Z"),
    );
  });
});

describe("normalizeProjectDates", () => {
  it("returns whole days", () => {
    expect(
      normalizeProjectDates(new Date("2026-01-01T10:00:00Z"), new Date("2026-02-01T23:00:00Z")),
    ).toEqual({
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-02-01T00:00:00Z"),
    });
  });

  it("accepts a project that starts and ends on the same day", () => {
    expect(() =>
      normalizeProjectDates(new Date("2026-01-01T08:00:00Z"), new Date("2026-01-01T20:00:00Z")),
    ).not.toThrow();
  });

  it("rejects an end date before the start date with a field error", () => {
    const attempt = (): unknown =>
      normalizeProjectDates(new Date("2026-02-01"), new Date("2026-01-31"));

    expect(attempt).toThrow(ValidationFailedException);
    try {
      attempt();
    } catch (error) {
      expect((error as ValidationFailedException).fieldErrors).toEqual([
        { field: "endDate", messages: ["endDate must not be earlier than startDate"] },
      ]);
    }
  });
});
