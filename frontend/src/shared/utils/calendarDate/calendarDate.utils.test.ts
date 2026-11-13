import { describe, expect, it } from "vitest";
import { formatCalendarDate, fromUtcDateIso, toUtcDateIso } from "./calendarDate.utils";

describe("toUtcDateIso", () => {
  it("keeps the calendar day the user picked, whatever the time zone", () => {
    // Local midnight of 10 January: `toISOString` would give the 9th in a time zone east of UTC.
    expect(toUtcDateIso(new Date(2026, 0, 10))).toBe("2026-01-10T00:00:00.000Z");
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

describe("formatCalendarDate", () => {
  it("writes month, day and year with slashes in English", () => {
    expect(formatCalendarDate("2025-12-31T00:00:00.000Z", "en")).toBe("12/31/2025");
  });

  it("writes day, month and year with dots in Polish", () => {
    expect(formatCalendarDate("2025-12-31T00:00:00.000Z", "pl")).toBe("31.12.2025");
  });

  it("adds a leading zero to a single digit day and month", () => {
    expect(formatCalendarDate("2025-04-05T00:00:00.000Z", "en")).toBe("04/05/2025");
    expect(formatCalendarDate("2025-04-05T00:00:00.000Z", "pl")).toBe("05.04.2025");
  });

  it("keeps the calendar day of a date at midnight UTC", () => {
    expect(formatCalendarDate("2026-01-01T00:00:00.000Z", "en")).toBe("01/01/2026");
  });

  it("returns null for a value that is not a date", () => {
    expect(formatCalendarDate("not a date", "en")).toBeNull();
    expect(formatCalendarDate("", "pl")).toBeNull();
  });
});
