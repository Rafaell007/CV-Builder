import { describe, expect, it } from "vitest";
import { applyListPick, getStepStart, stepSelection } from "./datePicker.utils";

describe("stepSelection", () => {
  it("moves one month and keeps the day", () => {
    expect(stepSelection(new Date(2026, 10, 15), "month", 1, {})).toEqual(new Date(2026, 11, 15));
    expect(stepSelection(new Date(2026, 10, 15), "month", -1, {})).toEqual(new Date(2026, 9, 15));
  });

  it("goes from December to January of the next year, and back", () => {
    expect(stepSelection(new Date(2026, 11, 10), "month", 1, {})).toEqual(new Date(2027, 0, 10));
    expect(stepSelection(new Date(2027, 0, 10), "month", -1, {})).toEqual(new Date(2026, 11, 10));
  });

  it("cuts the day to the end of a shorter month", () => {
    expect(stepSelection(new Date(2026, 0, 31), "month", 1, {})).toEqual(new Date(2026, 1, 28));
    expect(stepSelection(new Date(2028, 0, 31), "month", 1, {})).toEqual(new Date(2028, 1, 29));
  });

  it("moves one year and keeps the month and the day", () => {
    expect(stepSelection(new Date(2026, 10, 4), "year", 1, {})).toEqual(new Date(2027, 10, 4));
    expect(stepSelection(new Date(2028, 1, 29), "year", 1, {})).toEqual(new Date(2029, 1, 28));
  });

  it("returns null when the whole target month is outside the limits", () => {
    const limits = { minDate: new Date(2026, 10, 3), maxDate: new Date(2026, 10, 20) };

    expect(stepSelection(new Date(2026, 10, 4), "month", -1, limits)).toBeNull();
    expect(stepSelection(new Date(2026, 10, 4), "month", 1, limits)).toBeNull();
  });

  it("returns null when the whole target year is outside the limits", () => {
    expect(
      stepSelection(new Date(2026, 10, 4), "year", -1, { minDate: new Date(2026, 0, 1) }),
    ).toBeNull();
  });

  it("moves a target that is partly inside the limits to the nearest allowed day", () => {
    expect(
      stepSelection(new Date(2026, 11, 10), "month", -1, { minDate: new Date(2026, 10, 15) }),
    ).toEqual(new Date(2026, 10, 15));
    expect(
      stepSelection(new Date(2026, 10, 25), "month", 1, { maxDate: new Date(2026, 11, 5) }),
    ).toEqual(new Date(2026, 11, 5));
  });
});

describe("applyListPick", () => {
  it("keeps the saved day when a month is picked", () => {
    expect(applyListPick(new Date(2026, 10, 15), new Date(2026, 2, 1), "month", {})).toEqual(
      new Date(2026, 2, 15),
    );
  });

  it("cuts the saved day to the end of a shorter month", () => {
    expect(applyListPick(new Date(2026, 0, 31), new Date(2026, 1, 1), "month", {})).toEqual(
      new Date(2026, 1, 28),
    );
  });

  it("takes the year of the picked month", () => {
    expect(applyListPick(new Date(2026, 10, 15), new Date(2027, 4, 1), "month", {})).toEqual(
      new Date(2027, 4, 15),
    );
  });

  it("keeps the month and the day when a year is picked", () => {
    expect(applyListPick(new Date(2026, 10, 15), new Date(2020, 0, 1), "year", {})).toEqual(
      new Date(2020, 10, 15),
    );
    expect(applyListPick(new Date(2028, 1, 29), new Date(2029, 0, 1), "year", {})).toEqual(
      new Date(2029, 1, 28),
    );
  });

  it("uses the picked date when nothing is saved", () => {
    expect(applyListPick(null, new Date(2026, 2, 1), "month", {})).toEqual(new Date(2026, 2, 1));
  });

  it("moves a result outside the limits to the nearest allowed day", () => {
    expect(
      applyListPick(new Date(2026, 10, 4), new Date(2026, 9, 1), "month", {
        minDate: new Date(2026, 9, 20),
      }),
    ).toEqual(new Date(2026, 9, 20));
  });
});

describe("getStepStart", () => {
  const today = new Date(2026, 10, 5, 14, 30);

  it("is the saved date", () => {
    expect(getStepStart(new Date(2020, 2, 9), new Date(2026, 10, 1), today)).toEqual(
      new Date(2020, 2, 9),
    );
  });

  it("is today when the empty field shows today's month", () => {
    expect(getStepStart(null, new Date(2026, 10, 1), today)).toEqual(new Date(2026, 10, 5));
  });

  it("is the 1st of the shown month when that is not today's month", () => {
    expect(getStepStart(null, new Date(2024, 5, 18), today)).toEqual(new Date(2024, 5, 1));
  });
});
