import { formatPeriod } from "./format-period";

describe("formatPeriod", () => {
  it("formats a finished project as MM.YYYY - MM.YYYY", () => {
    expect(formatPeriod(new Date("2022-03-01T00:00:00Z"), new Date("2023-12-31T00:00:00Z"))).toBe(
      "03.2022 - 12.2023",
    );
  });

  it("writes Present when there is no end date", () => {
    expect(formatPeriod(new Date("2022-03-01T00:00:00Z"), null)).toBe("03.2022 - Present");
  });

  it("pads a one-digit month with a zero", () => {
    expect(formatPeriod(new Date("2024-01-05T00:00:00Z"), new Date("2024-09-30T00:00:00Z"))).toBe(
      "01.2024 - 09.2024",
    );
  });

  it("uses UTC, so the first day of a month stays in that month", () => {
    expect(formatPeriod(new Date("2025-01-01T00:00:00Z"), new Date("2025-12-01T00:00:00Z"))).toBe(
      "01.2025 - 12.2025",
    );
  });
});
