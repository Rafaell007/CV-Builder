import { formatPeriod } from "./format-period";

describe("formatPeriod", () => {
  it("formats a finished project as MM.YYYY – MM.YYYY", () => {
    expect(
      formatPeriod(new Date("2022-03-01T00:00:00Z"), new Date("2023-12-31T00:00:00Z"), "Till now"),
    ).toBe("03.2022 – 12.2023");
  });

  it("writes Till now when there is no end date", () => {
    expect(formatPeriod(new Date("2022-03-01T00:00:00Z"), null, "Till now")).toBe(
      "03.2022 – Till now",
    );
  });

  it("writes the given word when there is no end date", () => {
    expect(formatPeriod(new Date("2022-03-01T00:00:00Z"), null, "obecnie")).toBe(
      "03.2022 – obecnie",
    );
  });

  it("ignores the given word when there is an end date", () => {
    expect(
      formatPeriod(new Date("2022-03-01T00:00:00Z"), new Date("2023-12-31T00:00:00Z"), "obecnie"),
    ).toBe("03.2022 – 12.2023");
  });

  it("pads a one-digit month with a zero", () => {
    expect(
      formatPeriod(new Date("2024-01-05T00:00:00Z"), new Date("2024-09-30T00:00:00Z"), "Till now"),
    ).toBe("01.2024 – 09.2024");
  });

  it("uses UTC, so the first day of a month stays in that month", () => {
    expect(
      formatPeriod(new Date("2025-01-01T00:00:00Z"), new Date("2025-12-01T00:00:00Z"), "Till now"),
    ).toBe("01.2025 – 12.2025");
  });
});
