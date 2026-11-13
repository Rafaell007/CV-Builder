import { describe, expect, it } from "vitest";
import { formatProjectDate } from "./project.utils";

describe("formatProjectDate", () => {
  it("writes month, day and year with slashes in English", () => {
    expect(formatProjectDate("2025-12-31T00:00:00.000Z", "en")).toBe("12/31/2025");
  });

  it("writes day, month and year with dots in Polish", () => {
    expect(formatProjectDate("2025-12-31T00:00:00.000Z", "pl")).toBe("31.12.2025");
  });

  it("adds a leading zero to a single digit day and month", () => {
    expect(formatProjectDate("2025-04-05T00:00:00.000Z", "en")).toBe("04/05/2025");
    expect(formatProjectDate("2025-04-05T00:00:00.000Z", "pl")).toBe("05.04.2025");
  });

  it("keeps the calendar day of a date at midnight UTC", () => {
    expect(formatProjectDate("2026-01-01T00:00:00.000Z", "en")).toBe("01/01/2026");
  });

  it("returns null for a value that is not a date", () => {
    expect(formatProjectDate("not a date", "en")).toBeNull();
    expect(formatProjectDate("", "pl")).toBeNull();
  });
});
